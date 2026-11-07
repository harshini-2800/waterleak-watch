import { z } from 'zod';
import { SEVERITIES, LEAK_TYPES, INCIDENT_STATUSES, USER_ROLES } from '../config/constants.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum([USER_ROLES.CITIZEN, USER_ROLES.CREW, USER_ROLES.ADMIN]).optional().default(USER_ROLES.CITIZEN),
  assignedWard: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createReportSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  area: z.string().min(2, 'Area is required'),
  ward: z.string().optional(),
  street: z.string().optional(),
  landmark: z.string().optional(),
  formattedAddress: z.string().optional(),
  severity: z.enum([SEVERITIES.LOW, SEVERITIES.MEDIUM, SEVERITIES.HIGH, SEVERITIES.CRITICAL]),
  leakType: z.enum([
    LEAK_TYPES.PIPE_BURST,
    LEAK_TYPES.DRIPPING_TAP,
    LEAK_TYPES.VALVE_LEAK,
    LEAK_TYPES.SEWAGE_OVERFLOW,
    LEAK_TYPES.OTHER
  ]),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
  reporterName: z.string().optional(),
  reporterEmail: z.string().email().optional().or(z.literal('')),
  reporterPhone: z.string().optional(),
  isAnonymous: z.coerce.boolean().optional().default(false),
  existingIncidentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid incident ID').optional().or(z.literal('')),
  deviceFingerprint: z.string().optional().default('default-client')
});

export const updateStatusSchema = z.object({
  status: z.enum([
    INCIDENT_STATUSES.REPORTED,
    INCIDENT_STATUSES.VERIFIED,
    INCIDENT_STATUSES.ASSIGNED,
    INCIDENT_STATUSES.IN_PROGRESS,
    INCIDENT_STATUSES.RESOLVED,
    INCIDENT_STATUSES.REJECTED,
    INCIDENT_STATUSES.DUPLICATE
  ]),
  note: z.string().max(500).optional().default(''),
  photoUrl: z.string().optional()
});

export const assignCrewSchema = z.object({
  crewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid crew user ID'),
  note: z.string().max(500).optional().default('')
});

export const mergeIncidentsSchema = z.object({
  primaryIncidentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid primary incident ID'),
  duplicateIncidentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid incident ID')).min(1),
  note: z.string().max(500).optional().default('Merged by administrator')
});

export const upvoteSchema = z.object({
  deviceFingerprint: z.string().optional().default('anonymous-device')
});

