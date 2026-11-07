import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    recipientEmail: {
      type: String,
      lowercase: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['status_change', 'sla_warning', 'crew_assigned', 'cluster_merged', 'system'],
      default: 'status_change'
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    },
    reportTrackingId: String,
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

