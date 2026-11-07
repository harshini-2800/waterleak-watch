import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/axios.js';
import SLABadge from '../components/common/SLABadge.jsx';
import LiveTimer from '../components/common/LiveTimer.jsx';
import AnimatedTimeline from '../components/common/AnimatedTimeline.jsx';
import BeforeAfterSlider from '../components/common/BeforeAfterSlider.jsx';
import { getSeverityColor, getStatusBadge, formatDate } from '../lib/utils.js';
import toast from 'react-hot-toast';
import { Search, MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';

export default function TrackReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingIdInput, setTrackingIdInput] = useState(searchParams.get('id') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchReport = async (idToSearch) => {
    if (!idToSearch) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/reports/track/${idToSearch.trim()}`);
      setData(res.data.data);
      setSearchParams({ id: idToSearch.trim() });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Report not found');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      fetchReport(id);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport(trackingIdInput);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header and Lookup Bar */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white">Public Report Tracker</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Enter any tracking ID (e.g.{' '}
          <span className="font-mono text-primary-aqua cursor-pointer hover:underline" onClick={() => { setTrackingIdInput('WLW-2026-000001'); fetchReport('WLW-2026-000001'); }}>
            WLW-2026-XXXXXX
          </span>
          ) to view live progress, assigned crew status, and SLA timeline.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value.toUpperCase())}
              placeholder="e.g. WLW-2026-AB12CD"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-background-elevated border border-white/10 text-white font-mono text-sm focus:border-primary-aqua focus:outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !trackingIdInput}
            className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Track'}
          </button>
        </form>
      </div>

      {/* Results View */}
      {data && (
        <div className="space-y-6">
          {/* Main Status Hero Card */}
          <div className="rounded-3xl glass-panel-elevated p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary-aqua bg-primary-aqua/10 px-3 py-1 rounded-lg border border-primary-aqua/20">
                  {data.report.trackingId}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusBadge(data.incident?.status).color}`}>
                  {getStatusBadge(data.incident?.status).label}
                </span>
              </div>
              <SLABadge sla={data.incident?.sla} status={data.incident?.status} />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {data.incident?.title || 'Reported Water Leak'}
            </h2>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-aqua shrink-0" />
                <span>{data.report.address?.formatted || data.report.address?.area}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-aqua shrink-0" />
                <span>Reported: {formatDate(data.report.createdAt)}</span>
              </div>
              <div>
                <LiveTimer
                  startDate={data.incident?.firstReportedAt}
                  isResolved={data.incident?.status === 'resolved'}
                  resolvedDate={data.incident?.sla?.resolvedAt}
                />
              </div>
            </div>

            {/* Clustered notice */}
            {data.incident?.reportCount > 1 && (
              <div className="p-3 rounded-xl bg-primary-aqua/10 border border-primary-aqua/30 text-xs text-primary-aqua flex items-center justify-between">
                <span>
                  ✨ Your report is linked with {data.incident.reportCount - 1} other community reports at this location.
                </span>
                <Link
                  to={`/incidents/${data.incident._id}`}
                  className="font-bold underline hover:text-white"
                >
                  View Incident Cluster →
                </Link>
              </div>
            )}
          </div>

          {/* Photos and Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Photos */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Photographic Documentation</h3>
              <BeforeAfterSlider
                beforeUrl={data.report.photos?.[0]?.url || data.incident?.photos?.[0]?.url}
                afterUrl={data.incident?.afterPhotos?.[0]?.url}
              />
              {data.report.description && (
                <div className="p-4 rounded-xl glass-panel text-xs text-slate-300">
                  <span className="font-bold text-white block mb-1">Reporter Notes:</span>
                  <p>{data.report.description}</p>
                </div>
              )}
            </div>

            {/* Right: Timeline */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Status Timeline</h3>
              <div className="p-4 rounded-2xl glass-panel border border-white/10">
                <AnimatedTimeline timeline={data.incident?.timeline} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

