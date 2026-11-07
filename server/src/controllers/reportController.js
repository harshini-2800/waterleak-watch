import { Report } from '../models/Report.js';
import { Incident } from '../models/Incident.js';
import { AppError } from '../utils/AppError.js';
import { processUploadedImage } from '../middleware/upload.js';
import { processReportSubmission, findNearbyIncidents } from '../services/clusterService.js';
import path from 'path';

export async function createReport(req, res, next) {
  try {
    const photos = [];

    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const optimizedFileName = await processUploadedImage(file.path);
        photos.push({
          url: `/uploads/${optimizedFileName}`,
          thumbnail: `/uploads/${optimizedFileName}`,
          uploadedAt: new Date()
        });
      }
    }

    const { report, incident, isNewIncident } = await processReportSubmission({
      reportData: req.body,
      user: req.user || null,
      photos
    });

    res.status(201).json({
      success: true,
      data: {
        report,
        incident: {
          id: incident._id,
          incidentNumber: incident.incidentNumber,
          title: incident.title,
          status: incident.status,
          severity: incident.severity,
          reportCount: incident.reportCount,
          sla: incident.sla,
          isNewCluster: isNewIncident
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getReports(req, res, next) {
  try {
    const {
      area,
      severity,
      leakType,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    if (area) query['address.area'] = new RegExp(area, 'i');
    if (severity) query.severity = severity;
    if (leakType) query.leakType = leakType;
    if (search) {
      query.$or = [
        { trackingId: new RegExp(search, 'i') },
        { 'address.street': new RegExp(search, 'i') },
        { 'address.area': new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Report.countDocuments(query);

    const reports = await Report.find(query)
      .populate('incidentId', 'incidentNumber status severity sla')
      .populate('reporter.userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: reports,
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

export async function getReportById(req, res, next) {
  try {
    const report = await Report.findById(req.params.id)
      .populate('incidentId')
      .populate('reporter.userId', 'name email');

    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    res.status(200).json({
      success: true,
      data: report,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function trackReport(req, res, next) {
  try {
    const { trackingId } = req.params;

    const report = await Report.findOne({ trackingId }).populate({
      path: 'incidentId',
      populate: { path: 'assignedCrew', select: 'name phone' }
    });

    if (!report) {
      return next(new AppError(`No report found with tracking ID "${trackingId}"`, 404));
    }

    res.status(200).json({
      success: true,
      data: {
        report,
        incident: report.incidentId
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function getNearbyReports(req, res, next) {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return next(new AppError('Please provide latitude and longitude parameters', 400));
    }

    const incidents = await findNearbyIncidents({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radiusMeters: parseFloat(radius),
      excludeResolved: true
    });

    res.status(200).json({
      success: true,
      data: incidents,
      meta: {
        count: incidents.length,
        radiusMeters: parseFloat(radius),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

