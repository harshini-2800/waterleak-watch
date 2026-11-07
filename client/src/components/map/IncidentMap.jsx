import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapPin, Users, Flame, Layers } from 'lucide-react';
import SLABadge from '../common/SLABadge.jsx';
import { getSeverityColor } from '../../lib/utils.js';

// Custom SVG map marker generator
function createCustomIcon(severity, reportCount) {
  let color = '#22C55E';
  let pulse = false;

  if (severity === 'critical') {
    color = '#EF4444';
    pulse = true;
  } else if (severity === 'high') {
    color = '#FB923C';
  } else if (severity === 'medium') {
    color = '#FACC15';
  }

  const badgeHtml =
    reportCount > 1
      ? `<span style="position:absolute; top:-6px; right:-8px; background:#22D3EE; color:#050B18; font-weight:800; font-size:10px; border-radius:9999px; padding:1px 5px; box-shadow:0 0 8px rgba(34,211,238,0.8);">${reportCount}</span>`
      : '';

  const pulseHtml = pulse
    ? `<span style="position:absolute; inset:-4px; border-radius:50%; background:rgba(239,68,68,0.4); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : '';

  const svg = `
    <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
      ${pulseHtml}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
      </svg>
      ${badgeHtml}
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
}

export default function IncidentMap({ incidents = [], center = [37.7749, -122.4194], zoom = 13, height = '550px' }) {
  const [showHeatmap, setShowHeatmap] = useState(false);

  return (
    <div className="relative rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
      {/* Map Control Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all backdrop-blur-md border shadow-lg ${
            showHeatmap
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-critical'
              : 'bg-background-deep/80 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{showHeatmap ? 'Hotspots Active' : 'Show Hotspots'}</span>
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hotspots Density Layer */}
        {showHeatmap &&
          incidents.map((inc) => {
            const coords = inc.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            const radius = Math.min(250, (inc.reportCount || 1) * 35);
            return (
              <Circle
                key={`heat-${inc._id}`}
                center={[coords[1], coords[0]]}
                radius={radius}
                pathOptions={{
                  fillColor: inc.severity === 'critical' ? '#EF4444' : '#FB923C',
                  fillOpacity: 0.35,
                  color: '#EF4444',
                  weight: 1
                }}
              />
            );
          })}

        {/* Incident Markers */}
        {incidents.map((incident) => {
          const coords = incident.location?.coordinates;
          if (!coords || coords.length < 2) return null;

          const lat = coords[1];
          const lng = coords[0];
          const icon = createCustomIcon(incident.severity, incident.reportCount);
          const primaryPhoto = incident.photos?.[0]?.url || incident.afterPhotos?.[0]?.url;

          return (
            <Marker key={incident._id} position={[lat, lng]} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-1 min-w-[220px] max-w-[260px] text-slate-900">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] font-bold text-sky-700">
                      {incident.incidentNumber}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200">
                      {incident.severity}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs mb-1 line-clamp-1">{incident.title}</h4>

                  {primaryPhoto && (
                    <img
                      src={primaryPhoto}
                      alt={incident.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}

                  <p className="text-[11px] text-slate-600 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                    <span className="truncate">{incident.address?.formatted || incident.address?.area}</span>
                  </p>

                  {incident.reportCount > 1 && (
                    <div className="text-[10px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {incident.reportCount} reports in cluster
                    </div>
                  )}

                  <Link
                    to={`/incidents/${incident._id}`}
                    className="block text-center w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors"
                  >
                    View Resolution Tracker
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

