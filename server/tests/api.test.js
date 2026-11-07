import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Incident } from '../src/models/Incident.js';
import { Report } from '../src/models/Report.js';
import { USER_ROLES, INCIDENT_STATUSES } from '../src/config/constants.js';

describe('WaterLeak Watch Backend Test Suite', () => {
  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Incident.deleteMany({});
    await Report.deleteMany({});
  });

  describe('1. Authentication Endpoints', () => {
    it('should register a new citizen user and set auth cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
          phone: '+1 555-0100',
          role: 'citizen'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should login an existing user with valid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!'
        });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!'
        });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Report Submission & Proximity Duplicate Detection ($geoNear)', () => {
    it('should create a new Incident cluster on initial report submission', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
          area: 'Mission District',
          street: '16th and Valencia',
          severity: 'high',
          leakType: 'pipe_burst',
          description: 'High pressure main leak spraying water onto sidewalk.',
          reporterName: 'Witness One'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report.trackingId).toMatch(/^WLW-\d{4}-[A-F0-9]{6}$/);
      expect(res.body.data.incident.incidentNumber).toMatch(/^INC-\d{4}-[A-F0-9]{6}$/);
      expect(res.body.data.incident.isNewCluster).toBe(true);
    });

    it('should detect nearby open report within 50m radius', async () => {
      // 1. Create first report
      await request(app)
        .post('/api/v1/reports')
        .send({
          latitude: 37.774900,
          longitude: -122.419400,
          area: 'Downtown',
          street: 'Market St',
          severity: 'medium',
          leakType: 'valve_leak',
          description: 'First report of valve leaking'
        });

      // 2. Query nearby at approximately 15 meters away
      const nearbyRes = await request(app)
        .get('/api/v1/reports/nearby')
        .query({
          lat: 37.774950,
          lng: -122.419420,
          radius: 50
        });

      expect(nearbyRes.status).toBe(200);
      expect(nearbyRes.body.success).toBe(true);
      expect(nearbyRes.body.data.length).toBeGreaterThan(0);
      expect(nearbyRes.body.data[0].distanceMeters).toBeLessThanOrEqual(50);
    });

    it('should cluster a repeated report into the existing incident', async () => {
      // 1. Create first report
      const initial = await request(app)
        .post('/api/v1/reports')
        .send({
          latitude: 37.774900,
          longitude: -122.419400,
          area: 'Downtown',
          street: 'Market St',
          severity: 'medium',
          leakType: 'pipe_burst',
          description: 'Original leak'
        });

      const incidentId = initial.body.data.incident.id;

      // 2. User confirms "Add my report to this incident"
      const second = await request(app)
        .post('/api/v1/reports')
        .send({
          latitude: 37.774910,
          longitude: -122.419410,
          area: 'Downtown',
          street: 'Market St',
          severity: 'critical', // Should escalate severity!
          leakType: 'pipe_burst',
          description: 'Water pressure increased, road flooding now!',
          existingIncidentId: incidentId,
          reporterName: 'Witness Two'
        });

      expect(second.status).toBe(201);
      expect(second.body.data.incident.reportCount).toBe(2);
      expect(second.body.data.incident.severity).toBe('critical');

      // Verify incident in database
      const inc = await Incident.findById(incidentId);
      expect(inc.reportCount).toBe(2);
      expect(inc.reports.length).toBe(2);
      expect(inc.severity).toBe('critical');
    });
  });

  describe('3. Status Workflow & Finite State Machine', () => {
    let adminToken;
    let incidentId;

    beforeEach(async () => {
      // Create admin user
      const admin = await User.create({
        name: 'Admin Boss',
        email: 'boss@example.com',
        password: 'Password123!',
        role: USER_ROLES.ADMIN
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'boss@example.com', password: 'Password123!' });

      adminToken = loginRes.body.data.accessToken;

      // Create initial incident
      const reportRes = await request(app)
        .post('/api/v1/reports')
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
          area: 'Test Ward',
          severity: 'high',
          leakType: 'valve_leak',
          description: 'Testing transitions'
        });

      incidentId = reportRes.body.data.incident.id;
    });

    it('should allow valid transition from reported to verified', async () => {
      const res = await request(app)
        .patch(`/api/v1/incidents/${incidentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: INCIDENT_STATUSES.VERIFIED,
          note: 'Verified by dispatcher'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(INCIDENT_STATUSES.VERIFIED);
      expect(res.body.data.sla.firstResponseAt).toBeDefined();
    });

    it('should reject invalid transition (e.g. reported directly to resolved)', async () => {
      const res = await request(app)
        .patch(`/api/v1/incidents/${incidentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: INCIDENT_STATUSES.RESOLVED,
          note: 'Attempting invalid shortcut transition'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid status transition');
    });
  });

  describe('4. Public Tracking Endpoint', () => {
    it('should return report details and incident status by trackingId', async () => {
      const reportRes = await request(app)
        .post('/api/v1/reports')
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
          area: 'Civic Center',
          severity: 'low',
          leakType: 'dripping_tap',
          description: 'Dripping public fountain hydrant'
        });

      const trackingId = reportRes.body.data.report.trackingId;

      const trackRes = await request(app).get(`/api/v1/reports/track/${trackingId}`);

      expect(trackRes.status).toBe(200);
      expect(trackRes.body.success).toBe(true);
      expect(trackRes.body.data.report.trackingId).toBe(trackingId);
      expect(trackRes.body.data.incident).toBeDefined();
      expect(trackRes.body.data.incident.status).toBe('reported');
    });
  });
});

