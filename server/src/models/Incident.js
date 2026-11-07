import mongoose from 'mongoose';
import {
  SEVERITIES,
  LEAK_TYPES,
  INCIDENT_STATUSES,
  SEVERITY_WEIGHTS,
  SLA_HOURS
} from '../config/constants.js';

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(INCIDENT_STATUSES),
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedByName: {
      type: String,
      default: 'System'
    },
    note: {
      type: String,
      default: ''
    },
    photoUrl: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const incidentSchema = new mongoose.Schema(
  {
    incidentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },
    address: {
      formatted: { type: String, default: '' },
      area: { type: String, required: true, index: true },
      ward: String,
      street: String,
      landmark: String
    },
    severity: {
      type: String,
      enum: Object.values(SEVERITIES),
      default: SEVERITIES.MEDIUM,
      index: true
    },
    leakType: {
      type: String,
      enum: Object.values(LEAK_TYPES),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(INCIDENT_STATUSES),
      default: INCIDENT_STATUSES.REPORTED,
      index: true
    },
    reportCount: {
      type: Number,
      default: 1
    },
    uniqueReporters: {
      type: Number,
      default: 1
    },
    priorityScore: {
      type: Number,
      default: 10,
      index: true
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
      }
    ],
    assignedCrew: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    upvotes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        deviceFingerprint: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    sla: {
      targetHours: {
        type: Number,
        default: 120
      },
      deadline: {
        type: Date,
        required: true
      },
      state: {
        type: String,
        enum: ['on_track', 'at_risk', 'breached'],
        default: 'on_track',
        index: true
      },
      firstResponseAt: Date,
      assignedAt: Date,
      inProgressAt: Date,
      resolvedAt: Date,
      totalResolutionMinutes: Number
    },
    photos: [
      {
        url: { type: String, required: true },
        thumbnail: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    afterPhotos: [
      {
        url: { type: String, required: true },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        uploadedByName: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    timeline: [timelineEntrySchema],
    firstReportedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastReportedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ status: 1, severity: 1, 'address.area': 1 });
incidentSchema.index({ priorityScore: -1, createdAt: -1 });

// Helper method to recalculate priorityScore
incidentSchema.methods.calculatePriorityScore = function () {
  const weight = SEVERITY_WEIGHTS[this.severity] || 2;
  const countFactor = (this.reportCount || 1) * 5;
  const upvoteFactor = (this.upvotes ? this.upvotes.length : 0) * 3;
  const ageInHours = (Date.now() - new Date(this.firstReportedAt).getTime()) / (1000 * 60 * 60);
  
  // Severity weight (1-8)*10 + countFactor + upvoteFactor + ageFactor (up to 30)
  this.priorityScore = Math.round(weight * 10 + countFactor + upvoteFactor + Math.min(ageInHours * 0.5, 30));
  return this.priorityScore;
};

// Helper method to update SLA state based on current time
incidentSchema.methods.updateSlaState = function () {
  if (this.status === INCIDENT_STATUSES.RESOLVED) {
    if (this.sla.resolvedAt && this.sla.deadline) {
      this.sla.state = this.sla.resolvedAt <= this.sla.deadline ? 'on_track' : 'breached';
    }
    return this.sla.state;
  }

  if ([INCIDENT_STATUSES.REJECTED, INCIDENT_STATUSES.DUPLICATE].includes(this.status)) {
    return this.sla.state;
  }

  const now = new Date();
  const deadline = new Date(this.sla.deadline);
  const msRemaining = deadline.getTime() - now.getTime();
  const totalMs = (this.sla.targetHours || 120) * 60 * 60 * 1000;

  if (msRemaining <= 0) {
    this.sla.state = 'breached';
  } else if (msRemaining <= totalMs * 0.25) {
    // Within last 25% of SLA window
    this.sla.state = 'at_risk';
  } else {
    this.sla.state = 'on_track';
  }

  return this.sla.state;
};

export const Incident = mongoose.model('Incident', incidentSchema);

