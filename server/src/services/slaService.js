import { SLA_HOURS, INCIDENT_STATUSES } from '../config/constants.js';

export function calculateSlaDeadline(severity, fromDate = new Date()) {
  const targetHours = SLA_HOURS[severity] || SLA_HOURS.medium;
  const deadline = new Date(fromDate.getTime() + targetHours * 60 * 60 * 1000);
  return {
    targetHours,
    deadline
  };
}

export function computeSlaStatus(incident) {
  if (!incident || !incident.sla || !incident.sla.deadline) {
    return 'on_track';
  }

  if (incident.status === INCIDENT_STATUSES.RESOLVED) {
    if (incident.sla.resolvedAt && incident.sla.deadline) {
      return new Date(incident.sla.resolvedAt) <= new Date(incident.sla.deadline)
        ? 'on_track'
        : 'breached';
    }
    return incident.sla.state || 'on_track';
  }

  if ([INCIDENT_STATUSES.REJECTED, INCIDENT_STATUSES.DUPLICATE].includes(incident.status)) {
    return incident.sla.state || 'on_track';
  }

  const now = Date.now();
  const deadlineTime = new Date(incident.sla.deadline).getTime();
  const targetHours = incident.sla.targetHours || SLA_HOURS[incident.severity] || 120;
  const totalWindowMs = targetHours * 60 * 60 * 1000;

  if (now > deadlineTime) {
    return 'breached';
  }

  const msRemaining = deadlineTime - now;
  // If remaining time is less than 25% of the total target window, flag as at-risk
  if (msRemaining <= totalWindowMs * 0.25) {
    return 'at_risk';
  }

  return 'on_track';
}

export function formatTimeDuration(minutes) {
  if (!minutes || minutes < 0) return '0m';
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = Math.floor(minutes % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

  return parts.join(' ');
}

