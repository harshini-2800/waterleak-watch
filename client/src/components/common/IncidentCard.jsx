import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, ThumbsUp, ArrowRight } from 'lucide-react';
import SLABadge from './SLABadge.jsx';
import LiveTimer from './LiveTimer.jsx';
import { getSeverityColor, getStatusBadge } from '../../lib/utils.js';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';

export default function IncidentCard({ incident, onUpvoted }) {
  const [upvotesCount, setUpvotesCount] = useState(incident.upvotes?.length || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const severityStyle = getSeverityColor(incident.severity);
  const statusBadge = getStatusBadge(incident.status);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasUpvoted || isUpvoting) return;

    try {
      setIsUpvoting(true);
      const res = await api.post(`/incidents/${incident._id}/upvote`, {
        deviceFingerprint: localStorage.getItem('wlw-device-id') || 'browser-client'
      });
      setUpvotesCount(res.data.data.upvotesCount);
      setHasUpvoted(true);
      toast.success('Confirmed! Your report adds priority to this incident.');
      if (onUpvoted) onUpvoted(incident._id);
    } catch (err) {
      if (err.response?.status === 409) {
        toast('You already confirmed this report.', { icon: 'ℹ️' });
        setHasUpvoted(true);
      } else {
        toast.error('Could not register upvote.');
      }
    } finally {
      setIsUpvoting(false);
    }
  };

  const primaryPhoto = incident.photos?.[0]?.url || incident.afterPhotos?.[0]?.url;

  return (
    <div className="group rounded-2xl glass-panel p-5 transition-all duration-300 hover:border-primary-aqua/50 hover:shadow-glow-aqua flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-primary-aqua bg-primary-aqua/10 px-2 py-0.5 rounded border border-primary-aqua/20">
              {incident.incidentNumber}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${severityStyle.bg}`}>
              {incident.severity.toUpperCase()}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <SLABadge sla={incident.sla} status={incident.status} />
        </div>

        {/* Title & Photo Row */}
        <div className="flex gap-4 mb-3">
          {primaryPhoto && (
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
              <img
                src={primaryPhoto}
                alt={incident.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              to={`/incidents/${incident._id}`}
              className="text-base font-bold text-white hover:text-primary-aqua transition-colors line-clamp-1"
            >
              {incident.title}
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary-aqua shrink-0" />
              <span className="truncate">{incident.address?.formatted || incident.address?.area}</span>
            </div>
            <div className="mt-2">
              <LiveTimer
                startDate={incident.firstReportedAt}
                isResolved={incident.status === 'resolved'}
                resolvedDate={incident.sla?.resolvedAt}
              />
            </div>
          </div>
        </div>

        {/* Clustered Reports Alert Pill */}
        {incident.reportCount > 1 && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-primary-aqua/10 border border-primary-aqua/20 flex items-center justify-between text-xs text-primary-aqua">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5" />
              {incident.reportCount} citizen reports clustered
            </span>
            <span className="font-mono font-semibold">Priority: {incident.priorityScore}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
        <button
          onClick={handleUpvote}
          disabled={hasUpvoted || isUpvoting}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            hasUpvoted
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
          }`}
          title="Confirm this leak ('I see this too')"
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'text-emerald-400 fill-emerald-400' : ''}`} />
          <span>I see this too ({upvotesCount})</span>
        </button>

        <Link
          to={`/incidents/${incident._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-aqua hover:underline"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

