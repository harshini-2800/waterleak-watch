import { Incident } from '../models/Incident.js';
import { Report } from '../models/Report.js';
import { INCIDENT_STATUSES } from '../config/constants.js';

export async function getSummary(req, res, next) {
  try {
    const totalReports = await Report.countDocuments();
    const openIncidents = await Incident.countDocuments({
      status: {
        $nin: [
          INCIDENT_STATUSES.RESOLVED,
          INCIDENT_STATUSES.REJECTED,
          INCIDENT_STATUSES.DUPLICATE
        ]
      }
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const resolvedMonth = await Incident.countDocuments({
      status: INCIDENT_STATUSES.RESOLVED,
      'sla.resolvedAt': { $gte: startOfMonth }
    });

    const totalResolved = await Incident.countDocuments({
      status: INCIDENT_STATUSES.RESOLVED
    });

    // Average resolution time
    const resolvedIncidents = await Incident.find({
      status: INCIDENT_STATUSES.RESOLVED,
      'sla.totalResolutionMinutes': { $exists: true, $gt: 0 }
    }).select('sla');

    let avgResolutionMinutes = 0;
    let onTimeResolved = 0;

    if (resolvedIncidents.length > 0) {
      const sumMinutes = resolvedIncidents.reduce(
        (acc, inc) => acc + (inc.sla.totalResolutionMinutes || 0),
        0
      );
      avgResolutionMinutes = Math.round(sumMinutes / resolvedIncidents.length);

      onTimeResolved = resolvedIncidents.filter((inc) => inc.sla.state === 'on_track').length;
    }

    const slaComplianceRate =
      resolvedIncidents.length > 0
        ? Math.round((onTimeResolved / resolvedIncidents.length) * 100)
        : 100;

    // Water saved estimation (approx 850 liters/hr saved through fast resolution)
    const estimatedWaterSavedLiters = Math.round(totalResolved * 42000);

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        openIncidents,
        resolvedThisMonth: resolvedMonth,
        totalResolved,
        avgResolutionHours: Math.round((avgResolutionMinutes / 60) * 10) / 10,
        avgResolutionMinutes,
        slaComplianceRate,
        estimatedWaterSavedLiters
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function getResolutionTime(req, res, next) {
  try {
    // Breakdown by severity
    const bySeverity = await Incident.aggregate([
      {
        $match: {
          status: INCIDENT_STATUSES.RESOLVED,
          'sla.totalResolutionMinutes': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$severity',
          avgMinutes: { $avg: '$sla.totalResolutionMinutes' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Breakdown by area
    const byArea = await Incident.aggregate([
      {
        $match: {
          status: INCIDENT_STATUSES.RESOLVED,
          'sla.totalResolutionMinutes': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$address.area',
          avgMinutes: { $avg: '$sla.totalResolutionMinutes' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgMinutes: 1 } },
      { $limit: 10 }
    ]);

    // Breakdown by crew
    const byCrew = await Incident.aggregate([
      {
        $match: {
          status: INCIDENT_STATUSES.RESOLVED,
          assignedCrew: { $exists: true, $ne: null },
          'sla.totalResolutionMinutes': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$assignedCrew',
          avgMinutes: { $avg: '$sla.totalResolutionMinutes' },
          resolvedCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'crewUser'
        }
      },
      { $unwind: '$crewUser' },
      {
        $project: {
          crewId: '$_id',
          crewName: '$crewUser.name',
          avgMinutes: { $round: ['$avgMinutes', 0] },
          avgHours: { $round: [{ $divide: ['$avgMinutes', 60] }, 1] },
          resolvedCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        bySeverity: bySeverity.map((s) => ({
          severity: s._id,
          avgHours: Math.round((s.avgMinutes / 60) * 10) / 10,
          count: s.count
        })),
        byArea: byArea.map((a) => ({
          area: a._id,
          avgHours: Math.round((a.avgMinutes / 60) * 10) / 10,
          count: a.count
        })),
        byCrew
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function getHotspots(req, res, next) {
  try {
    const hotspots = await Incident.aggregate([
      {
        $group: {
          _id: '$address.area',
          totalIncidents: { $sum: 1 },
          totalReports: { $sum: '$reportCount' },
          activeIncidents: {
            $sum: {
              $cond: [
                {
                  $nin: [
                    '$status',
                    [
                      INCIDENT_STATUSES.RESOLVED,
                      INCIDENT_STATUSES.REJECTED,
                      INCIDENT_STATUSES.DUPLICATE
                    ]
                  ]
                },
                1,
                0
              ]
            }
          },
          avgPriorityScore: { $avg: '$priorityScore' },
          coordinates: { $first: '$location.coordinates' }
        }
      },
      { $sort: { totalReports: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: hotspots.map((h) => ({
        area: h._id,
        totalIncidents: h.totalIncidents,
        totalReports: h.totalReports,
        activeIncidents: h.activeIncidents,
        avgPriorityScore: Math.round(h.avgPriorityScore || 0),
        coordinates: h.coordinates
      })),
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function getSlaMetrics(req, res, next) {
  try {
    const openIncidents = await Incident.find({
      status: {
        $nin: [
          INCIDENT_STATUSES.RESOLVED,
          INCIDENT_STATUSES.REJECTED,
          INCIDENT_STATUSES.DUPLICATE
        ]
      }
    });

    let onTrack = 0;
    let atRisk = 0;
    let breached = 0;

    openIncidents.forEach((inc) => {
      const state = inc.updateSlaState();
      if (state === 'breached') breached += 1;
      else if (state === 'at_risk') atRisk += 1;
      else onTrack += 1;
    });

    res.status(200).json({
      success: true,
      data: {
        openTotal: openIncidents.length,
        onTrack,
        atRisk,
        breached
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrend(req, res, next) {
  try {
    // Generate trend data over the last 14 days
    const days = 14;
    const trend = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const reportsCount = await Report.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });

      const resolvedCount = await Incident.countDocuments({
        status: INCIDENT_STATUSES.RESOLVED,
        'sla.resolvedAt': { $gte: dayStart, $lte: dayEnd }
      });

      trend.push({
        date: dayStart.toISOString().slice(5, 10), // MM-DD
        reports: reportsCount,
        resolved: resolvedCount
      });
    }

    res.status(200).json({
      success: true,
      data: trend,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

