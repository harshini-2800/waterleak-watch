import { Incident } from '../models/Incident.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';
import {
  VALID_STATUS_TRANSITIONS,
  INCIDENT_STATUSES,
  USER_ROLES
} from '../config/constants.js';
import { emitIncidentUpdated, emitNotification } from '../services/socketService.js';
import { sendEmail } from '../services/emailService.js';
import { processUploadedImage } from '../middleware/upload.js';

export async function getIncidents(req, res, next) {
  try {
    const {
      status,
      severity,
      area,
      slaState,
      assignedCrew,
      search,
      sortBy = 'priorityScore',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    if (severity) query.severity = severity;
    if (area) query['address.area'] = new RegExp(area, 'i');
    if (slaState) query['sla.state'] = slaState;
    if (assignedCrew) query.assignedCrew = assignedCrew;
    if (search) {
      query.$or = [
        { incidentNumber: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { 'address.street': new RegExp(search, 'i') },
        { 'address.area': new RegExp(search, 'i') }
      ];
    }

    const sortObj = {};
    sortObj[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Incident.countDocuments(query);

    const incidents = await Incident.find(query)
      .populate('assignedCrew', 'name email phone assignedWard')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Update real-time dynamic SLA states for response
    incidents.forEach((inc) => inc.updateSlaState());

    res.status(200).json({
      success: true,
      data: incidents,
      meta: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getIncidentById(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assignedCrew', 'name email phone assignedWard')
      .populate({
        path: 'reports',
        populate: { path: 'reporter.userId', select: 'name email' }
      });

    if (!incident) {
      return next(new AppError('Incident not found', 404));
    }

    incident.updateSlaState();

    res.status(200).json({
      success: true,
      data: incident,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateIncidentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note, photoUrl } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return next(new AppError('Incident not found', 404));
    }

    // Server-side finite state machine validation
    const allowedTransitions = VALID_STATUS_TRANSITIONS[incident.status] || [];
    if (!allowedTransitions.includes(status)) {
      return next(
        new AppError(
          `Invalid status transition from '${incident.status}' to '${status}'. Allowed next statuses: [${allowedTransitions.join(
            ', '
          )}]`,
          400
        )
      );
    }

    // Role-specific check: Crew can only move from assigned -> in_progress, and in_progress -> resolved
    if (req.user.role === USER_ROLES.CREW) {
      if (incident.assignedCrew?.toString() !== req.user._id.toString()) {
        return next(new AppError('You are only allowed to update incidents assigned to your crew.', 403));
      }
      if (!['in_progress', 'resolved'].includes(status)) {
        return next(new AppError('Crew members can only update status to in_progress or resolved.', 403));
      }
    }

    const previousStatus = incident.status;
    incident.status = status;

    const now = new Date();

    // Update SLA timestamps
    if (status === INCIDENT_STATUSES.VERIFIED && !incident.sla.firstResponseAt) {
      incident.sla.firstResponseAt = now;
    } else if (status === INCIDENT_STATUSES.IN_PROGRESS && !incident.sla.inProgressAt) {
      incident.sla.inProgressAt = now;
    } else if (status === INCIDENT_STATUSES.RESOLVED) {
      incident.sla.resolvedAt = now;
      const durationMs = now.getTime() - new Date(incident.firstReportedAt).getTime();
      incident.sla.totalResolutionMinutes = Math.round(durationMs / (1000 * 60));
    }

    // Update timeline
    incident.timeline.push({
      status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: note || `Status transitioned from ${previousStatus} to ${status}`,
      photoUrl,
      timestamp: now
    });

    incident.updateSlaState();
    incident.calculatePriorityScore();
    await incident.save();

    // Audit log
    await AuditLog.create({
      action: 'UPDATE_STATUS',
      performedBy: req.user._id,
      performerRole: req.user.role,
      targetEntity: 'Incident',
      targetId: incident._id,
      details: { from: previousStatus, to: status, note }
    });

    // Notify citizens associated with this incident
    const reports = await Report.find({ incidentId: incident._id });
    for (const report of reports) {
      if (report.reporter?.userId) {
        const notif = await Notification.create({
          recipient: report.reporter.userId,
          title: `Update on Report ${report.trackingId}`,
          message: `The incident status has been updated to "${status}". Note: ${note || 'No notes added.'}`,
          type: 'status_change',
          incidentId: incident._id,
          reportTrackingId: report.trackingId
        });
        emitNotification(report.reporter.userId, notif);
      }
      if (report.reporter?.email) {
        sendEmail({
          to: report.reporter.email,
          subject: `WaterLeak Watch Update: Report ${report.trackingId} is now ${status}`,
          text: `Hello ${report.reporter.name || 'Citizen'},\n\nYour report (${report.trackingId}) regarding the water leak at ${incident.address.area} has been updated to "${status}".\nNote: ${note || 'No additional note'}\n\nThank you for helping preserve community water infrastructure.`
        });
      }
    }

    emitIncidentUpdated(incident);

    res.status(200).json({
      success: true,
      data: incident,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function assignCrew(req, res, next) {
  try {
    const { id } = req.params;
    const { crewId, note } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return next(new AppError('Incident not found', 404));
    }

    const crewUser = await User.findById(crewId);
    if (!crewUser || crewUser.role !== USER_ROLES.CREW) {
      return next(new AppError('Selected user is not an active crew member', 400));
    }

    incident.assignedCrew = crewUser._id;
    if (!incident.sla.assignedAt) {
      incident.sla.assignedAt = new Date();
    }

    // Auto-advance to ASSIGNED status if currently reported or verified
    if ([INCIDENT_STATUSES.REPORTED, INCIDENT_STATUSES.VERIFIED].includes(incident.status)) {
      incident.status = INCIDENT_STATUSES.ASSIGNED;
    }

    incident.timeline.push({
      status: incident.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: note || `Assigned to repair crew: ${crewUser.name}`,
      timestamp: new Date()
    });

    incident.calculatePriorityScore();
    await incident.save();

    // Audit log
    await AuditLog.create({
      action: 'ASSIGN_CREW',
      performedBy: req.user._id,
      performerRole: req.user.role,
      targetEntity: 'Incident',
      targetId: incident._id,
      details: { assignedCrewId: crewUser._id, assignedCrewName: crewUser.name, note }
    });

    // Notify the crew member
    const notif = await Notification.create({
      recipient: crewUser._id,
      title: `New Job Assigned: ${incident.incidentNumber}`,
      message: `You have been assigned to repair a ${incident.severity} leak at ${incident.address.formatted || incident.address.area}.`,
      type: 'crew_assigned',
      incidentId: incident._id
    });
    emitNotification(crewUser._id, notif);

    emitIncidentUpdated(incident);

    res.status(200).json({
      success: true,
      data: incident,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function upvoteIncident(req, res, next) {
  try {
    const { id } = req.params;
    const { deviceFingerprint } = req.body;
    const userId = req.user ? req.user._id : null;

    const incident = await Incident.findById(id);
    if (!incident) {
      return next(new AppError('Incident not found', 404));
    }

    // Check if user or device has already upvoted
    const alreadyUpvoted = incident.upvotes.some((u) => {
      if (userId && u.userId && u.userId.toString() === userId.toString()) return true;
      if (deviceFingerprint && u.deviceFingerprint === deviceFingerprint) return true;
      return false;
    });

    if (alreadyUpvoted) {
      return next(new AppError('You have already confirmed this leak report ("I see this too").', 409));
    }

    incident.upvotes.push({
      userId,
      deviceFingerprint: deviceFingerprint || 'anonymous-device',
      createdAt: new Date()
    });

    incident.calculatePriorityScore();
    await incident.save();

    emitIncidentUpdated(incident);

    res.status(200).json({
      success: true,
      data: {
        upvotesCount: incident.upvotes.length,
        priorityScore: incident.priorityScore
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function mergeIncidents(req, res, next) {
  try {
    const { primaryIncidentId, duplicateIncidentIds, note } = req.body;

    const primary = await Incident.findById(primaryIncidentId);
    if (!primary) {
      return next(new AppError('Primary incident not found', 404));
    }

    const duplicates = await Incident.find({ _id: { $in: duplicateIncidentIds } });
    if (!duplicates.length) {
      return next(new AppError('No duplicate incidents found to merge', 404));
    }

    let mergedReportCount = 0;
    const duplicateNumbers = [];

    for (const dup of duplicates) {
      duplicateNumbers.push(dup.incidentNumber);
      mergedReportCount += dup.reports.length;

      // Re-point reports from duplicate to primary
      await Report.updateMany(
        { incidentId: dup._id },
        { $set: { incidentId: primary._id } }
      );

      // Merge photos and upvotes
      primary.photos.push(...dup.photos);
      primary.upvotes.push(...dup.upvotes);
      primary.reports.push(...dup.reports);

      // Mark duplicate incident as DUPLICATE status
      dup.status = INCIDENT_STATUSES.DUPLICATE;
      dup.timeline.push({
        status: INCIDENT_STATUSES.DUPLICATE,
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Merged into primary cluster ${primary.incidentNumber}. ${note}`,
        timestamp: new Date()
      });
      await dup.save();
    }

    primary.reportCount += mergedReportCount;
    primary.timeline.push({
      status: primary.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: `Merged incidents [${duplicateNumbers.join(', ')}] into this cluster. ${note}`,
      timestamp: new Date()
    });

    primary.calculatePriorityScore();
    await primary.save();

    await AuditLog.create({
      action: 'MERGE_INCIDENTS',
      performedBy: req.user._id,
      performerRole: req.user.role,
      targetEntity: 'Incident',
      targetId: primary._id,
      details: { primaryId: primary._id, mergedIncidentIds: duplicateIncidentIds, note }
    });

    emitIncidentUpdated(primary);

    res.status(200).json({
      success: true,
      data: primary,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadAfterPhoto(req, res, next) {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) {
      return next(new AppError('Incident not found', 404));
    }

    if (!req.file) {
      return next(new AppError('Please upload an after-repair photo', 400));
    }

    const optimizedName = await processUploadedImage(req.file.path);
    const photoUrl = `/uploads/${optimizedName}`;

    incident.afterPhotos.push({
      url: photoUrl,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      uploadedAt: new Date()
    });

    incident.timeline.push({
      status: incident.status,
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: 'Repair crew uploaded after-resolution verification photo',
      photoUrl,
      timestamp: new Date()
    });

    await incident.save();

    emitIncidentUpdated(incident);

    res.status(200).json({
      success: true,
      data: {
        afterPhotos: incident.afterPhotos
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

