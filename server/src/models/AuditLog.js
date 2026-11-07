import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performerRole: {
      type: String,
      default: 'system'
    },
    targetEntity: {
      type: String, // 'Incident', 'Report', 'User'
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: String,
    userAgent: String
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetEntity: 1, targetId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

