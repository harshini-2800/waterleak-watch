import mongoose from 'mongoose';
import { SEVERITIES, LEAK_TYPES } from '../config/constants.js';

const reportSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true
    },
    reporter: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        type: String,
        default: 'Anonymous Citizen'
      },
      email: String,
      phone: String,
      isAnonymous: {
        type: Boolean,
        default: false
      }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    address: {
      formatted: { type: String, default: 'Unspecified location' },
      area: { type: String, required: true },
      ward: String,
      street: String,
      landmark: String
    },
    severity: {
      type: String,
      enum: Object.values(SEVERITIES),
      required: true
    },
    leakType: {
      type: String,
      enum: Object.values(LEAK_TYPES),
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true
    },
    photos: [
      {
        url: { type: String, required: true },
        thumbnail: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    deviceFingerprint: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for geospatial proximity queries
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ 'address.area': 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);

