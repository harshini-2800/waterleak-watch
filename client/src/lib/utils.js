import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffMs = now - past;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

export function formatDurationMinutes(minutes) {
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

export function getSeverityColor(severity) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        badge: 'bg-red-500 text-white',
        dot: 'bg-red-500 shadow-glow-critical'
      };
    case 'high':
      return {
        bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        badge: 'bg-orange-500 text-white',
        dot: 'bg-orange-500 shadow-glow-warning'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        badge: 'bg-yellow-500 text-black',
        dot: 'bg-yellow-500'
      };
    case 'low':
    default:
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        badge: 'bg-emerald-500 text-white',
        dot: 'bg-emerald-500'
      };
  }
}

export function getStatusBadge(status) {
  switch (status) {
    case 'reported':
      return { label: 'Reported', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
    case 'verified':
      return { label: 'Verified', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    case 'assigned':
      return { label: 'Assigned', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'in_progress':
      return { label: 'In Progress', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' };
    case 'resolved':
      return { label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'rejected':
      return { label: 'Rejected', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    case 'duplicate':
      return { label: 'Duplicate', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    default:
      return { label: status, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  }
}

