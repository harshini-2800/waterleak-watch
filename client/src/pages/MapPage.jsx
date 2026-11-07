import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios.js';
import IncidentMap from '../components/map/IncidentMap.jsx';
import IncidentCard from '../components/common/IncidentCard.jsx';
import { Filter, Search, Layers, Flame } from 'lucide-react';

export default function MapPage() {
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['incidents', severityFilter, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter) params.append('severity', severityFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const res = await api.get(`/incidents?${params.toString()}`);
      return res.data.data;
    }
  });

  const incidents = incidentsData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Filters Bar */}
      <div className="rounded-2xl glass-panel p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search area, street, ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Severity selector */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Map */}
      <IncidentMap incidents={incidents} height="520px" />

      {/* Results List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Matching Incidents ({incidents.length})
          </h2>
          <span className="text-xs text-slate-400">Click any card to inspect SLA journey</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {incidents.map((incident) => (
            <IncidentCard key={incident._id} incident={incident} />
          ))}
        </div>
      </div>
    </div>
  );
}

