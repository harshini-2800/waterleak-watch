import crypto from 'crypto';

export function generateTrackingId(year = new Date().getFullYear()) {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `WLW-${year}-${randomHex}`;
}

export function generateIncidentNumber(year = new Date().getFullYear()) {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INC-${year}-${randomHex}`;
}

