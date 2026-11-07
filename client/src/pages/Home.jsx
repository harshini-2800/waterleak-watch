import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios.js';
import WaterHeroCanvas from '../components/3d/WaterHeroCanvas.jsx';
import IncidentCard from '../components/common/IncidentCard.jsx';
import IncidentMap from '../components/map/IncidentMap.jsx';
import {
  Droplet,
  ShieldCheck,
  Zap,
  Clock,
  TrendingDown,
  Users,
  ArrowRight,
  PlusCircle,
  Map,
  Sparkles,
  BarChart3
} from 'lucide-react';

export default function Home() {
  const { data: summaryData } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary');
      return res.data.data;
    }
  });

  const { data: recentIncidentsData } = useQuery({
    queryKey: ['incidents', 'recent'],
    queryFn: async () => {
      const res = await api.get('/incidents?limit=6&sortBy=priorityScore&order=desc');
      return res.data.data;
    }
  });

  const summary = summaryData || {
    totalReports: 127,
    openIncidents: 23,
    resolvedThisMonth: 12,
    avgResolutionHours: 24.5,
    slaComplianceRate: 92,
    estimatedWaterSavedLiters: 504000
  };

  const incidents = recentIncidentsData || [];

  return (
    <div className="space-y-16 pb-12">
      {/* 3D Hero Section */}
      <section className="relative min-h-[580px] lg:min-h-[660px] flex items-center justify-center overflow-hidden -mt-6 pt-10">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-aqua/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-ocean/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Text Left */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-primary-aqua/30 text-primary-aqua text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>AI-Powered Proximity Clustering & SLA Tracking</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Every Drop Counts.{' '}
              <span className="bg-gradient-to-r from-primary-aqua via-cyan-300 to-ocean bg-clip-text text-transparent">
                Report Leaks.
              </span>{' '}
              Track Resolutions in Real Time.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Citizens report municipal water leaks with exact GPS maps and photos. Our platform
              automatically clusters repeated reports for the same location, escalates priority, and enforces
              strict time-to-resolution SLAs with municipal repair crews.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/report"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-all hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                <span>Report a Water Leak</span>
              </Link>

              <Link
                to="/map"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm glass-panel text-slate-200 hover:text-white hover:border-primary-aqua/50 transition-all hover:bg-white/5"
              >
                <Map className="w-5 h-5 text-primary-aqua" />
                <span>Explore Live Map</span>
              </Link>
            </div>

            {/* Micro stats banner */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-aqua" />
                <span>24h-48h SLA Commitment</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Community Verified</span>
              </div>
            </div>
          </div>

          {/* 3D Canvas Right */}
          <div className="lg:col-span-5 h-[340px] sm:h-[420px] lg:h-[480px] w-full flex items-center justify-center relative">
            <WaterHeroCanvas />
          </div>
        </div>
      </section>

      {/* Live KPI Metric Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl glass-panel p-5 relative overflow-hidden group hover:border-primary-aqua/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Active Incidents</span>
              <Droplet className="w-4 h-4 text-primary-aqua" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {summary.openIncidents}
            </div>
            <div className="text-[11px] text-primary-aqua mt-1 font-medium">Under active response</div>
          </div>

          <div className="rounded-2xl glass-panel p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Resolved This Month</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {summary.resolvedThisMonth}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Verified by repair crews</div>
          </div>

          <div className="rounded-2xl glass-panel p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Avg Resolution Time</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {summary.avgResolutionHours}h
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">{summary.slaComplianceRate}% on-time SLA rate</div>
          </div>

          <div className="rounded-2xl glass-panel p-5 relative overflow-hidden group hover:border-tealAccent/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Water Saved Est.</span>
              <TrendingDown className="w-4 h-4 text-tealAccent" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-tealAccent font-mono truncate">
              {(summary.estimatedWaterSavedLiters / 1000).toLocaleString()}k <span className="text-xs font-sans text-slate-400">Liters</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Prevented loss through quick containment</div>
          </div>
        </div>
      </section>

      {/* Differentiator Highlights: Proximity Clustering & Resolution Tracking */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel-elevated p-8 sm:p-12 relative overflow-hidden border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-aqua">
                Key Platform Differentiator
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Repeated-Report Proximity Clustering & Intelligent Dispatch
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                When a major pipe bursts, dozens of citizens often submit separate reports for the same street corner.
                Our spatial engine utilizes MongoDB 2dsphere indexing with a 50-meter radius to detect proximity instantly,
                alert citizens, and cluster reports into a unified incident.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-aqua" />
                  <span>Real-time "Similar report nearby" alerts prevent redundant crew dispatches.</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-aqua" />
                  <span>"I see this too" citizen confirmations dynamically increase priority scores.</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-aqua" />
                  <span>Strict SLA compliance timers hold authorities accountable to 24h & 48h targets.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Cluster Simulation</span>
                </div>
                <span className="text-xs font-mono text-primary-aqua font-bold">50m Radius Match</span>
              </div>
              <div className="p-3.5 rounded-xl bg-background-deep/60 border border-primary-aqua/30">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-white">Market Street & 16th</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">CRITICAL</span>
                </div>
                <p className="text-xs text-slate-400">High pressure pipe burst spraying across pedestrian sidewalk.</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-primary-aqua font-semibold">👥 6 Citizen reports clustered</span>
                  <span className="text-amber-400 font-mono font-bold">Priority Score: 95</span>
                </div>
              </div>
              <Link
                to="/report"
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 text-center block transition-colors"
              >
                Test Proximity Clustering Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Public Map Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Live Incident Map</h2>
            <p className="text-xs text-slate-400">
              Explore active leak clusters, severity tiers, and hotspot density across metropolitan wards.
            </p>
          </div>
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-aqua hover:underline"
          >
            <span>Open Fullscreen Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <IncidentMap incidents={incidents} height="480px" />
      </section>

      {/* Recent Clustered Incidents Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Priority Incidents</h2>
            <p className="text-xs text-slate-400">
              Ranked dynamically by report count, severity tier, and open duration.
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs font-bold text-primary-aqua hover:underline flex items-center gap-1"
          >
            <span>View All ({incidents.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.slice(0, 6).map((incident) => (
            <IncidentCard key={incident._id} incident={incident} />
          ))}
        </div>
      </section>
    </div>
  );
}

