import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios.js';
import SLABadge from '../components/common/SLABadge.jsx';
import { getSeverityColor, getStatusBadge, formatDate } from '../lib/utils.js';
import toast from 'react-hot-toast';
import {
  Shield,
  Search,
  Filter,
  Download,
  Users,
  CheckCircle,
  Wrench,
  AlertTriangle,
  GitMerge,
  ArrowUpDown,
  History
} from 'lucide-react';

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [slaFilter, setSlaFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIncidents, setSelectedIncidents] = useState([]);

  // Assign Modal State
  const [assignModalIncident, setAssignModalIncident] = useState(null);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // Merge Modal State
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [primaryMergeId, setPrimaryMergeId] = useState('');

  // Active Tab
  const [tab, setTab] = useState('incidents'); // 'incidents' | 'audit'

  // Fetch Incidents
  const { data: incidentsResponse, isLoading } = useQuery({
    queryKey: ['admin-incidents', statusFilter, severityFilter, slaFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (slaFilter) params.append('slaState', slaFilter);
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('limit', '15');

      const res = await api.get(`/incidents?${params.toString()}`);
      return res.data;
    }
  });

  // Fetch Crew Users
  const { data: crewUsersResponse } = useQuery({
    queryKey: ['crew-users'],
    queryFn: async () => {
      const res = await api.get('/users?role=crew');
      return res.data.data;
    }
  });

  // Fetch Audit Logs
  const { data: auditLogsResponse } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/users/audit-logs');
      return res.data.data;
    },
    enabled: tab === 'audit'
  });

  const incidents = incidentsResponse?.data || [];
  const meta = incidentsResponse?.meta || { total: 0, totalPages: 1 };
  const crewUsers = crewUsersResponse || [];
  const auditLogs = auditLogsResponse || [];

  // Assign Crew Mutation
  const assignMutation = useMutation({
    mutationFn: async ({ incidentId, crewId, note }) => {
      return api.patch(`/incidents/${incidentId}/assign`, { crewId, note });
    },
    onSuccess: () => {
      toast.success('Assigned crew successfully!');
      setAssignModalIncident(null);
      setSelectedCrewId('');
      setAssignNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Assignment failed');
    }
  });

  // Merge Incidents Mutation
  const mergeMutation = useMutation({
    mutationFn: async ({ primaryId, duplicateIds }) => {
      return api.post('/incidents/merge', {
        primaryIncidentId: primaryId,
        duplicateIncidentIds: duplicateIds,
        note: 'Admin clustered duplicates into single incident'
      });
    },
    onSuccess: () => {
      toast.success('Incidents successfully merged into unified cluster!');
      setShowMergeModal(false);
      setSelectedIncidents([]);
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Merge failed');
    }
  });

  // Export to CSV
  const exportToCSV = () => {
    if (!incidents.length) return;
    const headers = ['Incident Number,Title,Area,Severity,Status,Report Count,SLA State,Created At'];
    const rows = incidents.map((inc) =>
      [
        inc.incidentNumber,
        `"${inc.title.replace(/"/g, '""')}"`,
        `"${inc.address?.area || ''}"`,
        inc.severity,
        inc.status,
        inc.reportCount,
        inc.sla?.state || 'on_track',
        new Date(inc.firstReportedAt).toISOString()
      ].join(',')
    );

    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `waterleak_incidents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported incidents to CSV!');
  };

  const toggleSelectIncident = (id) => {
    setSelectedIncidents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-aqua" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Authority & Admin Portal</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dispatch repair crews, verify SLA compliance, merge repeat incident clusters, and review audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('incidents')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              tab === 'incidents'
                ? 'bg-primary-aqua text-background-deep shadow-glow-aqua'
                : 'glass-panel text-slate-300'
            }`}
          >
            Incidents Manager
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              tab === 'audit'
                ? 'bg-primary-aqua text-background-deep shadow-glow-aqua'
                : 'glass-panel text-slate-300'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {tab === 'incidents' ? (
        <>
          {/* Controls Bar */}
          <div className="rounded-2xl glass-panel p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search number, street, area..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
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
                <option value="duplicate">Duplicate</option>
              </select>

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

              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              >
                <option value="">All SLA States</option>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="breached">Breached</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
                title="Export filtered list to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {selectedIncidents.length > 1 && (
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-500 text-white hover:bg-purple-600 transition-colors shadow-lg"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Merge Clusters ({selectedIncidents.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Incidents Table */}
          <div className="rounded-2xl glass-panel-elevated overflow-hidden border border-white/10 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background-deep/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIncidents.length === incidents.length && incidents.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIncidents(incidents.map((i) => i._id));
                          else setSelectedIncidents([]);
                        }}
                        className="rounded accent-primary-aqua"
                      />
                    </th>
                    <th className="p-3">Incident</th>
                    <th className="p-3">Location & Ward</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Cluster</th>
                    <th className="p-3">SLA Status</th>
                    <th className="p-3">Crew</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {incidents.map((incident) => {
                    const severityStyle = getSeverityColor(incident.severity);
                    const statusBadge = getStatusBadge(incident.status);
                    const isSelected = selectedIncidents.includes(incident._id);

                    return (
                      <tr
                        key={incident._id}
                        className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-primary-aqua/5' : ''}`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectIncident(incident._id)}
                            className="rounded accent-primary-aqua"
                          />
                        </td>
                        <td className="p-3 font-medium">
                          <Link
                            to={`/incidents/${incident._id}`}
                            className="font-mono font-bold text-primary-aqua hover:underline block"
                          >
                            {incident.incidentNumber}
                          </Link>
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {incident.title}
                          </span>
                        </td>
                        <td className="p-3 truncate max-w-[180px]">
                          <span className="text-white font-medium block">
                            {incident.address?.area}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {incident.address?.street || 'Unspecified'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${severityStyle.bg}`}>
                            {incident.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-white flex items-center gap-1">
                            <Users className="w-3 h-3 text-primary-aqua" />
                            {incident.reportCount}
                          </span>
                        </td>
                        <td className="p-3">
                          <SLABadge sla={incident.sla} status={incident.status} />
                        </td>
                        <td className="p-3">
                          {incident.assignedCrew?.name ? (
                            <span className="font-medium text-emerald-400 flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              {incident.assignedCrew.name}
                            </span>
                          ) : (
                            <button
                              onClick={() => setAssignModalIncident(incident)}
                              className="text-xs font-semibold text-primary-aqua hover:underline"
                            >
                              + Assign Crew
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            to={`/incidents/${incident._id}`}
                            className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-primary-aqua font-semibold text-[11px] transition-colors"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 bg-background-deep/60 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {meta.totalPages} ({meta.total} total incidents)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg glass-panel hover:bg-white/10 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg glass-panel hover:bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Audit Trail Tab */
        <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-4 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-primary-aqua" />
            <span>Administrative Action Audit Log</span>
          </h2>

          <div className="divide-y divide-white/5">
            {auditLogs.map((log) => (
              <div key={log._id} className="py-3 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-primary-aqua uppercase font-mono">{log.action}</span>
                    <span className="text-slate-400">• By {log.performedBy?.name || 'Authority'} ({log.performerRole})</span>
                    <span className="text-slate-500 font-mono">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="text-slate-300">
                    Target: <span className="text-white font-semibold">{log.targetEntity}</span> ({log.targetId})
                  </p>
                  {log.details && (
                    <pre className="mt-1 p-2 rounded bg-black/40 text-[10px] text-slate-400 overflow-x-auto max-w-xl">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Crew Modal */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl glass-panel-elevated p-6 max-w-md w-full border border-primary-aqua/40 space-y-4 shadow-glow-aqua animate-float">
            <h3 className="text-lg font-bold text-white">
              Assign Crew: {assignModalIncident.incidentNumber}
            </h3>
            <p className="text-xs text-slate-300">
              Select an available municipal repair crew to dispatch to {assignModalIncident.address?.area}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Repair Crew</label>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              >
                <option value="">Select crew member...</option>
                {crewUsers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.assignedWard || 'All Wards'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dispatch Note</label>
              <input
                type="text"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="e.g. High priority pipe replacement requested"
                className="w-full px-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAssignModalIncident(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedCrewId || assignMutation.isPending}
                onClick={() =>
                  assignMutation.mutate({
                    incidentId: assignModalIncident._id,
                    crewId: selectedCrewId,
                    note: assignNote
                  })
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Incidents Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl glass-panel-elevated p-6 max-w-lg w-full border border-purple-500/40 space-y-4 shadow-2xl animate-float">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-purple-400" />
              <span>Merge Selected Incident Clusters</span>
            </h3>
            <p className="text-xs text-slate-300">
              Combine multiple reports into one primary incident. Duplicate incidents will be archived and linked.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Choose Primary Incident (Will absorb reports and preserve timeline)
              </label>
              <select
                value={primaryMergeId}
                onChange={(e) => setPrimaryMergeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-purple-400 focus:outline-none"
              >
                <option value="">Select primary...</option>
                {selectedIncidents.map((id) => {
                  const inc = incidents.find((i) => i._id === id);
                  return (
                    <option key={id} value={id}>
                      {inc?.incidentNumber} — {inc?.title} ({inc?.address?.area})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!primaryMergeId || mergeMutation.isPending}
                onClick={() => {
                  const duplicateIds = selectedIncidents.filter((id) => id !== primaryMergeId);
                  mergeMutation.mutate({ primaryId: primaryMergeId, duplicateIds });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 text-white hover:bg-purple-600 shadow-lg disabled:opacity-50"
              >
                {mergeMutation.isPending ? 'Merging...' : 'Confirm Cluster Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

