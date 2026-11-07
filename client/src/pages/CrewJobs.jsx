import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import SLABadge from '../components/common/SLABadge.jsx';
import LiveTimer from '../components/common/LiveTimer.jsx';
import BeforeAfterSlider from '../components/common/BeforeAfterSlider.jsx';
import { getSeverityColor, getStatusBadge, formatDate } from '../lib/utils.js';
import toast from 'react-hot-toast';
import {
  Wrench,
  Navigation,
  CheckCircle2,
  Camera,
  Play,
  Clock,
  MapPin,
  ExternalLink,
  Users
} from 'lucide-react';

export default function CrewJobs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeUploadIncidentId, setActiveUploadIncidentId] = useState(null);
  const [afterPhotoFile, setAfterPhotoFile] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Fetch jobs assigned to current crew
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['crew-jobs', user?.id],
    queryFn: async () => {
      // In dev or demo, if crew has specific ID fetch assigned, or fetch all assigned
      const res = await api.get(`/incidents?assignedCrew=${user?.id || ''}&limit=30`);
      return res.data.data;
    }
  });

  // Advance status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, note }) => {
      return api.patch(`/incidents/${id}/status`, { status, note });
    },
    onSuccess: () => {
      toast.success('Job status updated!');
      queryClient.invalidateQueries({ queryKey: ['crew-jobs'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Status update failed');
    }
  });

  // Upload after photo & resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, photo, note }) => {
      const formData = new FormData();
      formData.append('photo', photo);
      await api.post(`/incidents/${id}/after-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return api.patch(`/incidents/${id}/status`, {
        status: 'resolved',
        note: note || 'Repaired and pressure tested by field crew'
      });
    },
    onSuccess: () => {
      toast.success('Job marked as Resolved with verification photo!');
      setActiveUploadIncidentId(null);
      setAfterPhotoFile(null);
      setResolutionNote('');
      queryClient.invalidateQueries({ queryKey: ['crew-jobs'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Resolution failed');
    }
  });

  const jobList = jobs || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white">Repair Crew Job Queue</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mobile dispatch cockpit. Follow directions, update status on-site, and upload after-repair photos.
          </p>
        </div>
        <div className="text-xs text-slate-300 font-medium px-3 py-1.5 rounded-xl glass-panel self-start sm:self-auto">
          Crew Member: <span className="text-primary-aqua font-bold">{user?.name || 'Field Specialist'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading assigned work orders...</div>
      ) : jobList.length === 0 ? (
        <div className="rounded-2xl glass-panel p-10 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Open Dispatches Assigned</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are all caught up! Check back when administrators dispatch new leak clusters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobList.map((job) => {
            const severityStyle = getSeverityColor(job.severity);
            const statusBadge = getStatusBadge(job.status);
            const coords = job.location?.coordinates || [-122.4194, 37.7749];
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`;

            return (
              <div
                key={job._id}
                className="rounded-2xl glass-panel-elevated p-5 sm:p-6 border border-white/10 space-y-4 hover:border-amber-400/40 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary-aqua bg-primary-aqua/10 px-2 py-0.5 rounded border border-primary-aqua/20">
                      {job.incidentNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${severityStyle.bg}`}>
                      {job.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <SLABadge sla={job.sla} status={job.status} />
                </div>

                {/* Job Title & Location */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{job.title}</h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-aqua shrink-0" />
                    <span>{job.address?.formatted || job.address?.area}</span>
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                    <LiveTimer
                      startDate={job.firstReportedAt}
                      isResolved={job.status === 'resolved'}
                      resolvedDate={job.sla?.resolvedAt}
                    />
                    {job.reportCount > 1 && (
                      <span className="text-primary-aqua font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {job.reportCount} reports in cluster
                      </span>
                    )}
                  </div>
                </div>

                {/* Initial Photo preview */}
                {job.photos?.[0]?.url && (
                  <div className="h-40 rounded-xl overflow-hidden border border-white/10 relative">
                    <img
                      src={job.photos[0].url}
                      alt="Reported leak preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-black/70 text-white font-medium">
                      Reported Issue Photo
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2.5 items-center justify-between">
                  {/* Google Maps Nav Button */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-primary-aqua" />
                    <span>Open in Maps</span>
                  </a>

                  {/* Status Progression */}
                  <div className="flex gap-2">
                    {job.status === 'assigned' && (
                      <button
                        onClick={() =>
                          statusMutation.mutate({
                            id: job._id,
                            status: 'in_progress',
                            note: 'Crew arrived on site. Commencing repair works.'
                          })
                        }
                        disabled={statusMutation.isPending}
                        className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-lg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Start Work (In Progress)</span>
                      </button>
                    )}

                    {job.status === 'in_progress' && (
                      <button
                        onClick={() => setActiveUploadIncidentId(job._id)}
                        className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload After Photo & Resolve</span>
                      </button>
                    )}

                    <Link
                      to={`/incidents/${job._id}`}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold glass-panel text-slate-300 hover:text-white transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>

                {/* Inline Resolve Modal */}
                {activeUploadIncidentId === job._id && (
                  <div className="p-4 rounded-xl bg-background-deep/90 border border-emerald-500/40 space-y-3 pt-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Resolution Proof Upload</span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Snap or upload a photo showing the finished repair (valve replaced, pavement dry) to fulfill SLA.
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setAfterPhotoFile(e.target.files[0])}
                      className="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white"
                    />

                    <input
                      type="text"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="e.g. 2-inch pipe coupling replaced, pressure normal"
                      className="w-full px-3 py-2 rounded-xl bg-background-elevated border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveUploadIncidentId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold glass-panel text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!afterPhotoFile || resolveMutation.isPending}
                        onClick={() =>
                          resolveMutation.mutate({
                            id: job._id,
                            photo: afterPhotoFile,
                            note: resolutionNote
                          })
                        }
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {resolveMutation.isPending ? 'Verifying...' : 'Complete & Close Job'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

