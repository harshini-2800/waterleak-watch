export const USER_ROLES = {
  CITIZEN: 'citizen',
  CREW: 'crew',
  ADMIN: 'admin'
};

export const SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const SEVERITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 4,
  critical: 8
};

export const SLA_HOURS = {
  critical: 24, // 24 hours
  high: 48,     // 48 hours
  medium: 120,  // 5 days
  low: 240      // 10 days
};

export const LEAK_TYPES = {
  PIPE_BURST: 'pipe_burst',
  DRIPPING_TAP: 'dripping_tap',
  VALVE_LEAK: 'valve_leak',
  SEWAGE_OVERFLOW: 'sewage_overflow',
  OTHER: 'other'
};

export const INCIDENT_STATUSES = {
  REPORTED: 'reported',
  VERIFIED: 'verified',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  DUPLICATE: 'duplicate'
};

// Enforced state machine transitions
export const VALID_STATUS_TRANSITIONS = {
  reported: ['verified', 'rejected', 'duplicate'],
  verified: ['assigned', 'rejected', 'duplicate'],
  assigned: ['in_progress', 'verified', 'rejected'],
  in_progress: ['resolved', 'assigned'],
  resolved: [],
  rejected: [],
  duplicate: []
};

export const DEFAULT_PROXIMITY_RADIUS_METERS = 50;

