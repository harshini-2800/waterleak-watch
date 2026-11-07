import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  UserCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  Copy
} from 'lucide-react';
import { formatDate } from '../../lib/utils.js';

const STATUS_ICONS = {
  reported: FileText,
  verified: CheckCircle,
  assigned: UserCheck,
  in_progress: Wrench,
  resolved: CheckCircle2,
  rejected: XCircle,
  duplicate: Copy
};

const STATUS_COLORS = {
  reported: 'bg-sky-500 text-sky-100',
  verified: 'bg-indigo-500 text-indigo-100',
  assigned: 'bg-purple-500 text-purple-100',
  in_progress: 'bg-amber-500 text-amber-100',
  resolved: 'bg-emerald-500 text-emerald-100',
  rejected: 'bg-rose-500 text-rose-100',
  duplicate: 'bg-slate-500 text-slate-100'
};

export default function AnimatedTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-sm text-slate-400">No timeline entries recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary-aqua before:via-ocean before:to-emerald-500/30">
      {timeline.map((entry, idx) => {
        const Icon = STATUS_ICONS[entry.status] || FileText;
        const colorClass = STATUS_COLORS[entry.status] || 'bg-slate-500 text-white';

        return (
          <motion.div
            key={entry._id || idx}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.35 }}
            className="relative flex items-start group"
          >
            {/* Step Icon */}
            <div
              className={`absolute -left-6 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md ring-4 ring-background-deep ${colorClass}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            {/* Content card */}
            <div className="ml-4 p-4 rounded-xl glass-panel-elevated w-full transition-all duration-200 group-hover:border-primary-aqua/40">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="text-xs uppercase tracking-wider font-bold text-primary-aqua">
                  {entry.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {formatDate(entry.timestamp)}
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-1">
                <span className="font-semibold text-white">{entry.changedByName || 'System'}</span>
                {entry.note ? ` — ${entry.note}` : ''}
              </p>

              {entry.photoUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-white/10 max-w-xs">
                  <img
                    src={entry.photoUrl}
                    alt="Timeline attachment"
                    className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

