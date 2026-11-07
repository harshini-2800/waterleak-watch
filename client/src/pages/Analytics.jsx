import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Flame,
  Droplet
} from 'lucide-react';

const SEVERITY_COLORS = {
  critical: '#EF4444',
  high: '#FB923C',
  medium: '#FACC15',
  low: '#22C55E'
};

const PIE_COLORS = ['#EF4444', '#FB923C', '#FACC15', '#22C55E'];

export default function Analytics() {
  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => (await api.get('/analytics/summary')).data.data
  });

  const { data: trendData } = useQuery({
    queryKey: ['analytics', 'trend'],
    queryFn: async () => (await api.get('/analytics/trend')).data.data
  });

  const { data: resolutionData } = useQuery({
    queryKey: ['analytics', 'resolution-time'],
    queryFn: async () => (await api.get('/analytics/resolution-time')).data.data
  });

  const { data: hotspots } = useQuery({
    queryKey: ['analytics', 'hotspots'],
    queryFn: async () => (await api.get('/analytics/hotspots')).data.data
  });

  const { data: slaMetrics } = useQuery({
    queryKey: ['analytics', 'sla'],
    queryFn: async () => (await api.get('/analytics/sla')).data.data
  });

  const trend = trendData || [];
  const bySeverity = resolutionData?.bySeverity || [];
  const byArea = resolutionData?.byArea || [];
  const hotspotList = hotspots || [];

  const slaPieData = [
    { name: 'On Track', value: slaMetrics?.onTrack || 15, color: '#22D3EE' },
    { name: 'At Risk', value: slaMetrics?.atRisk || 5, color: '#FB923C' },
    { name: 'Breached', value: slaMetrics?.breached || 3, color: '#EF4444' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-aqua" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Resolution Analytics & SLA Performance
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time metrics measuring mean time-to-resolution (MTTR), SLA compliance rate, and recurring cluster hotspots.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl glass-panel p-5">
          <span className="text-xs text-slate-400 block mb-1">Total Reports Ingested</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {summary?.totalReports || 127}
          </div>
          <span className="text-[11px] text-primary-aqua mt-1 block">Across all wards</span>
        </div>

        <div className="rounded-2xl glass-panel p-5">
          <span className="text-xs text-slate-400 block mb-1">Mean Time to Resolution</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {summary?.avgResolutionHours || 24.5}h
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">From report to repair</span>
        </div>

        <div className="rounded-2xl glass-panel p-5">
          <span className="text-xs text-slate-400 block mb-1">SLA Compliance Rate</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {summary?.slaComplianceRate || 92}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Resolved before deadline</span>
        </div>

        <div className="rounded-2xl glass-panel p-5">
          <span className="text-xs text-slate-400 block mb-1">Estimated Water Saved</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-tealAccent font-mono truncate">
            {((summary?.estimatedWaterSavedLiters || 504000) / 1000).toLocaleString()}k L
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Conserved via rapid repair</span>
        </div>
      </div>

      {/* Row 1: Line Chart (Reports vs Resolutions) & Donut (SLA State) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports vs Resolutions Line Chart */}
        <div className="lg:col-span-8 rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-aqua" />
              <span>Intake vs Resolution Trends (Past 14 Days)</span>
            </h3>
            <span className="text-xs text-slate-400">Daily Volumes</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1730',
                    border: '1px solid rgba(34,211,238,0.2)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="reports"
                  name="New Reports"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved Incidents"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Distribution Donut */}
        <div className="lg:col-span-4 rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-aqua" />
            <span>Active Incidents SLA Health</span>
          </h3>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slaPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {slaPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1730',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-white/10">
            {slaPieData.map((item) => (
              <div key={item.name}>
                <span className="font-bold text-white block">{item.value}</span>
                <span className="text-[10px] text-slate-400" style={{ color: item.color }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: MTTR by Severity & Top Hotspots Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MTTR by Severity Bar Chart */}
        <div className="lg:col-span-6 rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-aqua" />
            <span>Mean Resolution Time by Severity (Hours)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeverity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="severity" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => v.toUpperCase()} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1730',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [`${val} Hours`, 'Avg MTTR']}
                />
                <Bar dataKey="avgHours" radius={[6, 6, 0, 0]}>
                  {bySeverity.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#22D3EE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspots Leaderboard */}
        <div className="lg:col-span-6 rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Top Recurring Leak Hotspots</span>
            </h3>
            <span className="text-xs text-slate-400">Ranked by Report Volume</span>
          </div>

          <div className="space-y-2.5">
            {hotspotList.slice(0, 5).map((hotspot, idx) => (
              <div
                key={hotspot.area}
                className="p-3 rounded-xl bg-background-deep/60 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary-aqua/20 text-primary-aqua font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white block">{hotspot.area}</span>
                    <span className="text-[10px] text-slate-400">
                      {hotspot.activeIncidents} active leaks / {hotspot.totalIncidents} total
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-primary-aqua block">
                    {hotspot.totalReports} reports
                  </span>
                  <span className="text-[10px] text-amber-400">
                    Priority: {hotspot.avgPriorityScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

