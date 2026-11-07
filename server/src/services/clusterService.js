import { Incident } from '../models/Incident.js';
import { Report } from '../models/Report.js';
import { generateIncidentNumber, generateTrackingId } from '../utils/trackingId.js';
import { calculateSlaDeadline } from './slaService.js';
import { INCIDENT_STATUSES, SEVERITIES, SEVERITY_WEIGHTS } from '../config/constants.js';
import { emitNewIncident, emitIncidentUpdated } from './socketService.js';

/**
 * Find open incidents within a given radius using MongoDB 2dsphere index
 */
export async function findNearbyIncidents({
  latitude,
  longitude,
  radiusMeters = 50,
  excludeResolved = true,
  limit = 5
}) {
  const query = {};
  if (excludeResolved) {
    query.status = {
      $nin: [
        INCIDENT_STATUSES.RESOLVED,
        INCIDENT_STATUSES.REJECTED,
        INCIDENT_STATUSES.DUPLICATE
      ]
    };
  }

  const incidents = await Incident.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        distanceField: 'distanceMeters',
        maxDistance: radiusMeters,
        spherical: true,
        query
      }
    },
    { $limit: limit }
  ]);

  return incidents.map((inc) => ({
    ...inc,
    distanceMeters: Math.round(inc.distanceMeters)
  }));
}

/**
 * Handle new report submission: either link to existing cluster or create new Incident
 */
export async function processReportSubmission({
  reportData,
  user = null,
  photos = []
}) {
  const {
    latitude,
    longitude,
    area,
    ward,
    street,
    landmark,
    formattedAddress,
    severity,
    leakType,
    description,
    reporterName,
    reporterEmail,
    reporterPhone,
    isAnonymous,
    existingIncidentId,
    deviceFingerprint
  } = reportData;

  const trackingId = generateTrackingId();
  let incident = null;
  let isNewIncident = false;

  // 1. If user explicitly confirmed an existing incident
  if (existingIncidentId) {
    incident = await Incident.findById(existingIncidentId);
  }

  // 2. If no incident was explicitly linked, check if an open incident exists within proximity
  if (!incident) {
    const nearby = await findNearbyIncidents({
      latitude,
      longitude,
      radiusMeters: 50,
      excludeResolved: true,
      limit: 1
    });

    if (nearby && nearby.length > 0) {
      incident = await Incident.findById(nearby[0]._id);
    }
  }

  // 3. If an incident was found/selected, append to cluster
  if (incident) {
    incident.reportCount += 1;
    incident.lastReportedAt = new Date();

    // Check if new unique reporter
    const currentReporters = incident.reports.length;
    incident.uniqueReporters = currentReporters + 1;

    // Escalate severity if new report is more severe
    if (SEVERITY_WEIGHTS[severity] > SEVERITY_WEIGHTS[incident.severity]) {
      incident.severity = severity;
      // Recalculate SLA with escalated urgency
      const { targetHours, deadline } = calculateSlaDeadline(severity, incident.firstReportedAt);
      incident.sla.targetHours = targetHours;
      incident.sla.deadline = deadline;
    }

    // Append any photos
    if (photos && photos.length > 0) {
      incident.photos.push(...photos);
    }

    // Add timeline record of repeated report
    incident.timeline.push({
      status: incident.status,
      changedByName: user ? user.name : reporterName || 'Anonymous Citizen',
      note: `Additional report received (${trackingId}). Repeated leak confirmed at location.`,
      timestamp: new Date()
    });

    incident.calculatePriorityScore();
    incident.updateSlaState();
    await incident.save();

    emitIncidentUpdated(incident);
  } else {
    // 4. Create brand new Incident cluster
    isNewIncident = true;
    const incidentNumber = generateIncidentNumber();
    const { targetHours, deadline } = calculateSlaDeadline(severity);

    const title = `${leakType.replace('_', ' ').toUpperCase()} at ${street || area || 'Reported Location'}`;

    incident = new Incident({
      incidentNumber,
      title,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address: {
        formatted: formattedAddress || `${street || ''} ${area || ''}`.trim(),
        area,
        ward,
        street,
        landmark
      },
      severity,
      leakType,
      status: INCIDENT_STATUSES.REPORTED,
      reportCount: 1,
      uniqueReporters: 1,
      reports: [],
      photos: photos || [],
      sla: {
        targetHours,
        deadline,
        state: 'on_track'
      },
      timeline: [
        {
          status: INCIDENT_STATUSES.REPORTED,
          changedByName: user ? user.name : reporterName || 'Citizen Report',
          note: `Initial leak reported (${trackingId}). Cluster created.`,
          timestamp: new Date()
        }
      ],
      firstReportedAt: new Date(),
      lastReportedAt: new Date()
    });

    incident.calculatePriorityScore();
    await incident.save();

    emitNewIncident(incident);
  }

  // 5. Create the individual Report record
  const report = new Report({
    trackingId,
    incidentId: incident._id,
    reporter: {
      userId: user ? user._id : undefined,
      name: isAnonymous ? 'Anonymous Citizen' : user ? user.name : reporterName || 'Anonymous Citizen',
      email: user ? user.email : reporterEmail || undefined,
      phone: user ? user.phone : reporterPhone || undefined,
      isAnonymous: Boolean(isAnonymous)
    },
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    },
    address: {
      formatted: formattedAddress,
      area,
      ward,
      street,
      landmark
    },
    severity,
    leakType,
    description,
    photos: photos || [],
    deviceFingerprint
  });

  await report.save();

  // Add report reference to incident
  incident.reports.push(report._id);
  await incident.save();

  return {
    report,
    incident,
    isNewIncident
  };
}

