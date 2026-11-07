import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api from '../lib/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import SLABadge from '../components/common/SLABadge.jsx';
import LiveTimer from '../components/common/LiveTimer.jsx';
import BeforeAfterSlider from '../components/common/BeforeAfterSlider.jsx';
import AnimatedTimeline from '../components/common/AnimatedTimeline.jsx';
import { getSeverityColor, getStatusBadge, formatDate } from '../lib/utils.js';
import toast from 'react-hot-toast';
import {
  MapPin,
  Users,
  ThumbsUp,
  Clock,
  Wrench,
  Shield,
  Upload,
  ArrowLeft,
  Share2,
  FileText
} from 'lucide-react';

const incidentPin = L.divIcon({
  className: 'pin',
  html: `<div style="background:#22D3EE; width:16px; height:16px; border-radius:50%; border:3px solid #FFFFFF; box-shadow:0 0 10px #22D3EE;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function IncidentDetail() {
  const { id } = useParams();
  const { user, isAdmin, isCrew } = useAuth();
  const queryClient = useQueryClient();

  // Status update modal state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // After photo upload state
  const [afterFile, setAfterFile] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: async () => {
      const res = await api.get(`/incidents/${id}`);
      return res.data.data;
    }
  });

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    try {
      setIsUpdatingStatus(true);
      await api.patch(`/incidents/${id}/status`, {
        status: newStatus,
        note: statusNote
      });
      toast.success(`Status updated to ${newStatus}!`);
      setNewStatus('');
      setStatusNote('');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Could not update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUploadAfterPhoto = async (e) => {
    e.preventDefault();
    if (!afterFile) return;

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', afterFile);

      await api.post(`/incidents/${id}/after-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Resolution verification photo uploaded!');
      setAfterFile(null);
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Photo upload failed');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-aqua border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading incident telemetry...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Incident Not Found</h2>
        <p className="text-slate-400 text-sm">This incident cluster does not exist or has been archived.</p>
        <Link to="/map" className="inline-block py-2 px-4 rounded-xl bg-primary-aqua text-background-deep font-bold text-xs">
          Return to Incident Map
        </Link>
      </div>
    );
  }

  const severityStyle = getSeverityColor(incident.severity);
  const statusBadge = getStatusBadge(incident.status);
  const coords = incident.location?.coordinates || [-122.4194, 37.7749];

  const beforePhoto = incident.photos?.[0]?.url;
  const afterPhoto = incident.afterPhotos?.[0]?.url;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Back button and Meta Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map & Incidents</span>
        </Link>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Incident link copied to clipboard!');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass-panel text-slate-300 hover:text-white transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* Incident Header Glass Card */}
      <div className="rounded-3xl glass-panel-elevated p-6 sm:p-8 border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-primary-aqua bg-primary-aqua/10 px-3 py-1 rounded-lg border border-primary-aqua/20">
              {incident.incidentNumber}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${severityStyle.bg}`}>
              {incident.severity.toUpperCase()}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <SLABadge sla={incident.sla} status={incident.status} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{incident.title}</h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300 pt-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-aqua shrink-0" />
            <span>{incident.address?.formatted || incident.address?.area}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary-aqua shrink-0" />
            <span>First Reported: {formatDate(incident.firstReportedAt)}</span>
          </div>

          <div>
            <LiveTimer
              startDate={incident.firstReportedAt}
              isResolved={incident.status === 'resolved'}
              resolvedDate={incident.sla?.resolvedAt}
            />
          </div>
        </div>

        {/* Clustered Reports Banner */}
        {incident.reportCount > 1 && (
          <div className="p-3.5 rounded-xl bg-primary-aqua/10 border border-primary-aqua/30 flex items-center justify-between text-xs text-primary-aqua">
            <div className="flex items-center gap-2 font-medium">
              <Users className="w-4 h-4" />
              <span>
                <strong>{incident.reportCount}</strong> citizen reports automatically grouped into this cluster
              </span>
            </div>
            <span className="font-mono font-bold">Priority: {incident.priorityScore}</span>
          </div>
        )}
      </div>

      {/* Before / After Photo Comparison Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Visual Evidence & Resolution Comparison</h2>
          <span className="text-xs text-slate-400">Drag center handle to compare</span>
        </div>
        <BeforeAfterSlider beforeUrl={beforePhoto} afterUrl={afterPhoto} />
      </div>

      {/* Grid: Resolution Timeline (Left) & Map / Crew Status (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline Column */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Resolution Journey & Audit Trail</span>
          </h2>
          <div className="rounded-2xl glass-panel p-6 border border-white/10">
            <AnimatedTimeline timeline={incident.timeline} />
          </div>
        </div>

        {/* Telemetry / Location Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map Preview */}
          <div className="rounded-2xl overflow-hidden glass-panel border border-white/10 h-64 shadow-xl">
            <MapContainer
              center={[coords[1], coords[0]]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[coords[1], coords[0]]} icon={incidentPin} />
            </MapContainer>
          </div>

          {/* SLA Performance Box */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-aqua" />
              <span>SLA Target Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-background-deep/60">
                <span className="text-slate-400 block mb-1">Target Window:</span>
                <span className="font-mono text-white font-bold">{incident.sla?.targetHours} Hours</span>
              </div>
              <div className="p-3 rounded-xl bg-background-deep/60">
                <span className="text-slate-400 block mb-1">Assigned Crew:</span>
                <span className="font-bold text-primary-aqua truncate block">
                  {incident.assignedCrew?.name || 'Pending Crew'}
                </span>
              </div>
            </div>
          </div>

          {/* Authority / Crew Action Controls */}
          {(isAdmin || isCrew) && incident.status !== 'resolved' && (
            <div className="rounded-2xl glass-panel-elevated p-5 border border-primary-aqua/30 space-y-4">
              <h3 className="text-xs font-bold text-primary-aqua uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                <span>Field Operations Control</span>
              </h3>

              {/* Status Update Form */}
              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transition Incident Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
                  >
                    <option value="">Select next status...</option>
                    {incident.status === 'reported' && <option value="verified">Verified</option>}
                    {incident.status === 'verified' && <option value="assigned">Assigned</option>}
                    {incident.status === 'assigned' && <option value="in_progress">In Progress</option>}
                    {incident.status === 'in_progress' && <option value="resolved">Resolved</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transition Note / Action Taken
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Main isolation valve replaced"
                    className="w-full px-3 py-2 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newStatus || isUpdatingStatus}
                  className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-primary-aqua text-background-deep hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Advance Status'}
                </button>
              </form>

              {/* After Photo Upload (for crew resolution proof) */}
              <div className="pt-3 border-t border-white/10">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Upload Resolution Verification Photo
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAfterFile(e.target.files[0])}
                    className="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleUploadAfterPhoto}
                    disabled={!afterFile || isUploadingPhoto}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shrink-0"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clustered Individual Reports Table */}
      {incident.reports && incident.reports.length > 0 && (
        <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-aqua" />
            <span>Citizen Reports in this Cluster ({incident.reports.length})</span>
          </h2>

          <div className="space-y-3">
            {incident.reports.map((rep) => (
              <div
                key={rep._id}
                className="p-4 rounded-xl bg-background-deep/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-primary-aqua">{rep.trackingId}</span>
                    <span className="text-slate-400">• {rep.reporter?.name || 'Anonymous Citizen'}</span>
                    <span className="text-slate-500 font-mono">{formatDate(rep.createdAt)}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-1">{rep.description || 'No description provided.'}</p>
                </div>

                <Link
                  to={`/track?id=${rep.trackingId}`}
                  className="shrink-0 text-primary-aqua font-semibold hover:underline"
                >
                  View Report Tracker →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

