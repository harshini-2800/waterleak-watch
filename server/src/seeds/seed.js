import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Incident } from '../models/Incident.js';
import { Report } from '../models/Report.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { generateTrackingId, generateIncidentNumber } from '../utils/trackingId.js';
import { calculateSlaDeadline } from '../services/slaService.js';
import {
  USER_ROLES,
  SEVERITIES,
  LEAK_TYPES,
  INCIDENT_STATUSES
} from '../config/constants.js';
import { logger } from '../utils/logger.js';

// Base coordinates for a realistic metropolitan water district (San Francisco Bay / Waterfront demo area)
const CENTER_LAT = 37.7749;
const CENTER_LNG = -122.4194;

const AREAS = [
  { name: 'Downtown Financial', ward: 'Ward 1', latOffset: 0.008, lngOffset: 0.012 },
  { name: 'Mission Waterways', ward: 'Ward 2', latOffset: -0.012, lngOffset: -0.005 },
  { name: 'Sunset District', ward: 'Ward 3', latOffset: -0.005, lngOffset: -0.028 },
  { name: 'North Riverbank', ward: 'Ward 4', latOffset: 0.021, lngOffset: -0.009 },
  { name: 'Industrial Park', ward: 'Ward 5', latOffset: -0.025, lngOffset: 0.018 },
  { name: 'Marina Heights', ward: 'Ward 6', latOffset: 0.026, lngOffset: -0.018 }
];

const STREET_NAMES = [
  'Main Street', 'Market Boulevard', 'Ocean Avenue', 'Bayview Drive',
  'Waterfront Road', 'Pine Street', 'Oak Ridge Way', 'Hydrant Lane',
  'Cascade Court', 'Reservoir Path', 'Canal Way', 'Fountain Plaza'
];

const SEVERITY_LIST = [SEVERITIES.LOW, SEVERITIES.MEDIUM, SEVERITIES.HIGH, SEVERITIES.CRITICAL];
const LEAK_TYPE_LIST = [
  LEAK_TYPES.PIPE_BURST,
  LEAK_TYPES.DRIPPING_TAP,
  LEAK_TYPES.VALVE_LEAK,
  LEAK_TYPES.SEWAGE_OVERFLOW,
  LEAK_TYPES.OTHER
];

const BEFORE_PHOTOS = [
  'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1541888946425-d0fbb1861563?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
];

const AFTER_PHOTOS = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80'
];

export async function runSeed(skipConnect = false) {
  try {
    logger.info('Starting WaterLeak Watch database seed...');
    if (!skipConnect) {
      await connectDB();
    }

    // Clear collections
    await User.deleteMany({});
    await Incident.deleteMany({});
    await Report.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});

    logger.info('Cleared existing records.');

    // 1. Create Default Users
    const adminUser = await User.create({
      name: 'Sarah Connor (Admin)',
      email: 'admin@waterleakwatch.org',
      password: 'AdminPass123!',
      role: USER_ROLES.ADMIN,
      phone: '+1 (555) 019-2831'
    });

    const crewUser1 = await User.create({
      name: 'Marcus Vance (Crew Leader)',
      email: 'crew@waterleakwatch.org',
      password: 'CrewPass123!',
      role: USER_ROLES.CREW,
      phone: '+1 (555) 019-4472',
      assignedWard: 'Ward 1'
    });

    const crewUser2 = await User.create({
      name: 'Elena Rostova (Lead Plumber)',
      email: 'crew2@waterleakwatch.org',
      password: 'CrewPass123!',
      role: USER_ROLES.CREW,
      phone: '+1 (555) 019-8921',
      assignedWard: 'Ward 2'
    });

    const citizenUser = await User.create({
      name: 'Alex Rivera',
      email: 'citizen@waterleakwatch.org',
      password: 'CitizenPass123!',
      role: USER_ROLES.CITIZEN,
      phone: '+1 (555) 019-3310'
    });

    const crewMembers = [crewUser1, crewUser2];
    logger.info('Created standard demo users.');

    // 2. Generate Incidents and Reports
    // We will generate 35 distinct Incidents containing a total of ~150 Reports
    const incidents = [];
    let totalReportsCreated = 0;

    for (let i = 0; i < 35; i++) {
      const areaObj = AREAS[i % AREAS.length];
      const street = STREET_NAMES[i % STREET_NAMES.length];
      const severity = SEVERITY_LIST[i % SEVERITY_LIST.length];
      const leakType = LEAK_TYPE_LIST[i % LEAK_TYPE_LIST.length];

      // Jitter location around area center (approx within 1-2 blocks)
      const baseLat = CENTER_LAT + areaObj.latOffset + (Math.random() - 0.5) * 0.005;
      const baseLng = CENTER_LNG + areaObj.lngOffset + (Math.random() - 0.5) * 0.005;

      const incidentNumber = generateIncidentNumber();
      const { targetHours } = calculateSlaDeadline(severity);

      // Distribute creation time over the past 14 days
      const daysAgo = (i * 0.4) + Math.random() * 0.5;
      const firstReportedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const deadline = new Date(firstReportedAt.getTime() + targetHours * 60 * 60 * 1000);

      // Determine status distribution
      let status;
      let assignedCrew = null;
      let resolvedAt = null;
      let totalResolutionMinutes = null;
      const afterPhotos = [];

      if (i < 12) {
        // Resolved incidents
        status = INCIDENT_STATUSES.RESOLVED;
        assignedCrew = crewMembers[i % crewMembers.length]._id;
        // Resolved between 4 hours to 40 hours after report
        const resolutionHours = 4 + (i % 8) * 4;
        resolvedAt = new Date(firstReportedAt.getTime() + resolutionHours * 60 * 60 * 1000);
        totalResolutionMinutes = Math.round(resolutionHours * 60);

        afterPhotos.push({
          url: AFTER_PHOTOS[i % AFTER_PHOTOS.length],
          uploadedBy: assignedCrew,
          uploadedByName: crewMembers[i % crewMembers.length].name,
          uploadedAt: resolvedAt
        });
      } else if (i < 19) {
        status = INCIDENT_STATUSES.IN_PROGRESS;
        assignedCrew = crewMembers[i % crewMembers.length]._id;
      } else if (i < 25) {
        status = INCIDENT_STATUSES.ASSIGNED;
        assignedCrew = crewMembers[i % crewMembers.length]._id;
      } else if (i < 30) {
        status = INCIDENT_STATUSES.VERIFIED;
      } else {
        status = INCIDENT_STATUSES.REPORTED;
      }

      // Repeated leak report count: some have 1, some have clusters of 3, 5, 8 reports!
      const clusterSize = (i % 5 === 0) ? 6 + (i % 3) : (i % 3 === 0) ? 3 + (i % 2) : 1 + (i % 3);

      const incidentPhotos = [
        {
          url: BEFORE_PHOTOS[i % BEFORE_PHOTOS.length],
          uploadedAt: firstReportedAt
        }
      ];

      // Build initial timeline
      const timeline = [
        {
          status: INCIDENT_STATUSES.REPORTED,
          changedByName: 'Citizen Report',
          note: `Incident detected and registered in ${areaObj.name}.`,
          timestamp: firstReportedAt
        }
      ];

      if (status !== INCIDENT_STATUSES.REPORTED) {
        timeline.push({
          status: INCIDENT_STATUSES.VERIFIED,
          changedBy: adminUser._id,
          changedByName: adminUser.name,
          note: 'Authority verified visual report and severity classification.',
          timestamp: new Date(firstReportedAt.getTime() + 2 * 60 * 60 * 1000)
        });
      }

      if ([INCIDENT_STATUSES.ASSIGNED, INCIDENT_STATUSES.IN_PROGRESS, INCIDENT_STATUSES.RESOLVED].includes(status)) {
        timeline.push({
          status: INCIDENT_STATUSES.ASSIGNED,
          changedBy: adminUser._id,
          changedByName: adminUser.name,
          note: `Dispatched field crew for rapid containment.`,
          timestamp: new Date(firstReportedAt.getTime() + 4 * 60 * 60 * 1000)
        });
      }

      if ([INCIDENT_STATUSES.IN_PROGRESS, INCIDENT_STATUSES.RESOLVED].includes(status)) {
        timeline.push({
          status: INCIDENT_STATUSES.IN_PROGRESS,
          changedBy: assignedCrew,
          changedByName: crewMembers[i % crewMembers.length].name,
          note: 'Crews on site. Pressure regulation valve shutoff initiated.',
          timestamp: new Date(firstReportedAt.getTime() + 6 * 60 * 60 * 1000)
        });
      }

      if (status === INCIDENT_STATUSES.RESOLVED) {
        timeline.push({
          status: INCIDENT_STATUSES.RESOLVED,
          changedBy: assignedCrew,
          changedByName: crewMembers[i % crewMembers.length].name,
          note: 'Pipe section replaced, pressure tested at 65 PSI. Area sanitized and cleared.',
          photoUrl: afterPhotos[0]?.url,
          timestamp: resolvedAt
        });
      }

      const incident = new Incident({
        incidentNumber,
        title: `${leakType.replace('_', ' ').toUpperCase()} at ${street}`,
        location: {
          type: 'Point',
          coordinates: [baseLng, baseLat]
        },
        address: {
          formatted: `${100 + i * 12} ${street}, ${areaObj.name}`,
          area: areaObj.name,
          ward: areaObj.ward,
          street: `${100 + i * 12} ${street}`,
          landmark: `Near ${street} Corner`
        },
        severity,
        leakType,
        status,
        reportCount: clusterSize,
        uniqueReporters: Math.max(1, clusterSize - 1),
        assignedCrew,
        sla: {
          targetHours,
          deadline,
          state: 'on_track',
          firstResponseAt: status !== INCIDENT_STATUSES.REPORTED ? new Date(firstReportedAt.getTime() + 2 * 3600000) : undefined,
          assignedAt: assignedCrew ? new Date(firstReportedAt.getTime() + 4 * 3600000) : undefined,
          inProgressAt: [INCIDENT_STATUSES.IN_PROGRESS, INCIDENT_STATUSES.RESOLVED].includes(status) ? new Date(firstReportedAt.getTime() + 6 * 3600000) : undefined,
          resolvedAt,
          totalResolutionMinutes
        },
        photos: incidentPhotos,
        afterPhotos,
        timeline,
        firstReportedAt,
        lastReportedAt: new Date(firstReportedAt.getTime() + (clusterSize - 1) * 3600000)
      });

      incident.updateSlaState();
      incident.calculatePriorityScore();
      await incident.save();

      // Create reports belonging to this incident cluster
      const reportIds = [];
      for (let r = 0; r < clusterSize; r++) {
        const trackingId = generateTrackingId();
        // Tiny coordinates micro-jitter within 15 meters (approx 0.00015 deg) to simulate real citizen gps
        const reportLat = baseLat + (Math.random() - 0.5) * 0.00015;
        const reportLng = baseLng + (Math.random() - 0.5) * 0.00015;

        const report = await Report.create({
          trackingId,
          incidentId: incident._id,
          reporter: {
            userId: r === 0 ? citizenUser._id : undefined,
            name: r === 0 ? citizenUser.name : `Citizen Witness #${r + 1}`,
            email: r === 0 ? citizenUser.email : `citizen${totalReportsCreated + 1}@waterwatch.org`,
            isAnonymous: r % 2 === 1
          },
          location: {
            type: 'Point',
            coordinates: [reportLng, reportLat]
          },
          address: {
            formatted: incident.address.formatted,
            area: areaObj.name,
            ward: areaObj.ward,
            street: incident.address.street,
            landmark: incident.address.landmark
          },
          severity,
          leakType,
          description: `Water flowing onto pavement from ${leakType.replace('_', ' ')}. Visible loss of clean potable water.`,
          photos: [
            {
              url: BEFORE_PHOTOS[(i + r) % BEFORE_PHOTOS.length],
              uploadedAt: new Date(firstReportedAt.getTime() + r * 3600000)
            }
          ]
        });

        reportIds.push(report._id);
        totalReportsCreated++;
      }

      incident.reports = reportIds;
      await incident.save();
      incidents.push(incident);
    }

    logger.info(`Database seeded successfully!`);
    logger.info(`Generated ${incidents.length} Incident clusters and ${totalReportsCreated} distinct Reports.`);
    logger.info(`Demo Credentials:`);
    logger.info(`  Admin:   admin@waterleakwatch.org   / AdminPass123!`);
    logger.info(`  Crew:    crew@waterleakwatch.org    / CrewPass123!`);
    logger.info(`  Citizen: citizen@waterleakwatch.org / CitizenPass123!`);

    if (!skipConnect) {
      await disconnectDB();
      process.exit(0);
    }
    return { incidentsCount: incidents.length, reportsCount: totalReportsCreated };
  } catch (err) {
    logger.error('Error seeding database:', err);
    if (!skipConnect) {
      process.exit(1);
    }
    throw err;
  }
}

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed();
}
