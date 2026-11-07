import React from 'react';
import { AlertCircle, Check, Plus, Users, MapPin } from 'lucide-react';
import SLABadge from '../common/SLABadge.jsx';
import { getSeverityColor, getStatusBadge } from '../../lib/utils.js';

export default function NearbySimilarCard({
  nearbyIncident,
  onJoinIncident,
  onReportSeparate
}) {
  if (!nearbyIncident) return null;

  const severityStyle = getSeverityColor(nearbyIncident.severity);
  const statusBadge = getStatusBadge(nearbyIncident.status);
  const photo = nearbyIncident.photos?.[0]?.url;

  return (
    <div className="rounded-2xl p-5 border-2 border-primary-aqua/50 bg-background-elevated/95 shadow-glow-aqua backdrop-blur-xl animate-float">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-aqua/20 text-primary-aqua flex items-center justify-center shrink-0 border border-primary-aqua/30">
          <AlertCircle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-white">
            Similar Active Leak Detected Nearby!
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Authorities already have an active incident open{' '}
            <span className="text-primary-aqua font-bold">
              {nearbyIncident.distanceMeters || 15} meters away
            </span>
            .
          </p>
        </div>
      </div>

      {/* Incident Mini-Card */}
      <div className="rounded-xl glass-panel p-3.5 mb-4 flex gap-3">
        {photo && (
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10">
            <img
              src={photo}
              alt="Reported leak preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-primary-aqua">
              {nearbyIncident.incidentNumber}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${severityStyle.bg}`}>
              {nearbyIncident.severity.toUpperCase()}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <h4 className="text-xs font-bold text-white line-clamp-1">{nearbyIncident.title}</h4>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-primary-aqua shrink-0" />
            <span>{nearbyIncident.address?.formatted || nearbyIncident.address?.area}</span>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-primary-aqua flex items-center gap-1">
              <Users className="w-3 h-3" />
              {nearbyIncident.reportCount} reports already clustered
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
        Joining this cluster increases its priority score and expedites crew dispatch. You will still receive your personal tracking ID.
      </p>

      {/* Action Options */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={() => onJoinIncident(nearbyIncident._id)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-all hover:scale-[1.02]"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Add My Report to This Incident</span>
        </button>
        <button
          type="button"
          onClick={onReportSeparate}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>This is a Different Leak</span>
        </button>
      </div>
    </div>
  );
}

