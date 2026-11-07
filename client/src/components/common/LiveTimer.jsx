import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function LiveTimer({ startDate, isResolved, resolvedDate, className }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const calculate = () => {
      if (!startDate) return;
      const start = new Date(startDate).getTime();
      const end = isResolved && resolvedDate ? new Date(resolvedDate).getTime() : Date.now();
      const diffMs = Math.max(0, end - start);

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      if (days === 0 && hours === 0) parts.push(`${seconds}s`);

      setDuration(parts.join(' '));
    };

    calculate();
    if (!isResolved) {
      const interval = setInterval(calculate, 1000);
      return () => clearInterval(interval);
    }
  }, [startDate, isResolved, resolvedDate]);

  if (!duration) return null;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-300', className)}>
      <Timer className="w-3.5 h-3.5 text-primary-aqua animate-spin-slow" />
      {isResolved ? `Resolved in ${duration}` : `Open for ${duration}`}
    </span>
  );
}

