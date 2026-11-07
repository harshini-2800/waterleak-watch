import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function SLABadge({ sla, status, className }) {
  if (!sla || !sla.deadline) return null;

  const isResolved = status === 'resolved';
  const deadline = new Date(sla.deadline).getTime();
  const now = Date.now();
  const msRemaining = deadline - now;

  let state = sla.state || 'on_track';
  if (!isResolved) {
    if (msRemaining <= 0) state = 'breached';
    else if (msRemaining <= (sla.targetHours || 120) * 3600000 * 0.25) state = 'at_risk';
  }

  // Formatting remaining/overdue time
  const formatDiff = (diffMs) => {
    const absDiff = Math.abs(diffMs);
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;

    if (days > 0) return `${days}d ${remHours}h`;
    return `${hours}h`;
  };

  if (isResolved) {
    const wasOnTime = state === 'on_track';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide',
          wasOnTime
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-red-500/15 text-red-400 border-red-500/30',
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {wasOnTime ? 'SLA Met' : 'SLA Breached'}
      </span>
    );
  }

  if (state === 'breached') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 glow-critical animate-pulse',
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        Breached (+{formatDiff(msRemaining)})
      </span>
    );
  }

  if (state === 'at_risk') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-warning',
          className
        )}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        At Risk ({formatDiff(msRemaining)} left)
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
        className
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      On Track ({formatDiff(msRemaining)} left)
    </span>
  );
}

