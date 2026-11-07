import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LocationPickerMap from '../components/map/LocationPickerMap.jsx';
import PhotoUploader from '../components/report/PhotoUploader.jsx';
import NearbySimilarCard from '../components/report/NearbySimilarCard.jsx';
import api from '../lib/axios.js';
import toast from 'react-hot-toast';
import {
  MapPin,
  Camera,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  ShieldCheck,
  Flame,
  Droplet
} from 'lucide-react';

const SEVERITY_OPTIONS = [
  {
    id: 'low',
    name: 'Low Severity',
    sla: 'SLA: 10 Days',
    desc: 'Minor dripping hydrant, slow tap drip, small pooling without pressure.',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
  },
  {
    id: 'medium',
    name: 'Medium Severity',
    sla: 'SLA: 5 Days',
    desc: 'Continuous flow, pressure valve leak, water running along roadside curb.',
    color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
  },
  {
    id: 'high',
    name: 'High Severity',
    sla: 'SLA: 48 Hours',
    desc: 'Gushing pipe, street flooding, substantial clean water wastage or property risk.',
    color: 'border-orange-500/40 bg-orange-500/10 text-orange-400'
  },
  {
    id: 'critical',
    name: 'Critical Burst',
    sla: 'SLA: 24 Hours',
    desc: 'High-pressure water geyser, structural foundation hazard, full road inundation.',
    color: 'border-red-500/50 bg-red-500/15 text-red-400'
  }
];

const LEAK_TYPES = [
  { id: 'pipe_burst', label: 'Main Pipe Burst' },
  { id: 'dripping_tap', label: 'Public Tap / Hydrant Drip' },
  { id: 'valve_leak', label: 'Pressure Valve Leak' },
  { id: 'sewage_overflow', label: 'Sewage / Water Overflow' },
  { id: 'other', label: 'Other Infrastructure Leak' }
];

export default function Report() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Wizard Step (1 to 6)
  const [step, setStep] = useState(1);

  // Form State
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [area, setArea] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');

  const [severity, setSeverity] = useState('medium');
  const [leakType, setLeakType] = useState('pipe_burst');

  const [photos, setPhotos] = useState([]); // [{ file, previewUrl }]
  const [description, setDescription] = useState('');

  const [reporterName, setReporterName] = useState(user?.name || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');
  const [reporterPhone, setReporterPhone] = useState(user?.phone || '');
  const [isAnonymous, setIsAnonymous] = useState(!isAuthenticated);

  // Proximity clustering state
  const [nearbyIncident, setNearbyIncident] = useState(null);
  const [existingIncidentId, setExistingIncidentId] = useState(null);
  const [dismissedNearby, setDismissedNearby] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Draft autosave to localStorage
  useEffect(() => {
    const draft = localStorage.getItem('wlw-report-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.area) setArea(parsed.area);
        if (parsed.street) setStreet(parsed.street);
        if (parsed.landmark) setLandmark(parsed.landmark);
        if (parsed.severity) setSeverity(parsed.severity);
        if (parsed.leakType) setLeakType(parsed.leakType);
        if (parsed.description) setDescription(parsed.description);
      } catch {}
    }
  }, []);

  const saveDraft = () => {
    const draft = { area, street, landmark, severity, leakType, description };
    localStorage.setItem('wlw-report-draft', JSON.stringify(draft));
  };

  const handleLocationPicked = async (loc) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setArea(loc.area);
    setWard(loc.ward);
    setStreet(loc.street);
    setFormattedAddress(loc.formattedAddress);

    // Check proximity within 50m for repeated leaks
    try {
      const res = await api.get(`/reports/nearby?lat=${loc.latitude}&lng=${loc.longitude}&radius=50`);
      if (res.data.data && res.data.data.length > 0 && !dismissedNearby) {
        setNearbyIncident(res.data.data[0]);
      } else {
        setNearbyIncident(null);
      }
    } catch {
      // Proximity check optional
    }
  };

  const handleJoinIncident = (incidentId) => {
    setExistingIncidentId(incidentId);
    toast.success('Attached to existing incident cluster!');
    setNearbyIncident(null);
  };

  const handleReportSeparate = () => {
    setExistingIncidentId(null);
    setDismissedNearby(true);
    setNearbyIncident(null);
    toast('Proceeding as separate leak report.');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('area', area || 'General Metropolitan Area');
      formData.append('ward', ward || 'Ward 1');
      formData.append('street', street || '');
      formData.append('landmark', landmark || '');
      formData.append('formattedAddress', formattedAddress || '');
      formData.append('severity', severity);
      formData.append('leakType', leakType);
      formData.append('description', description);
      formData.append('isAnonymous', String(isAnonymous));
      formData.append('reporterName', isAnonymous ? 'Anonymous Citizen' : reporterName);
      formData.append('reporterEmail', reporterEmail);
      formData.append('reporterPhone', reporterPhone);

      if (existingIncidentId) {
        formData.append('existingIncidentId', existingIncidentId);
      }

      // Append photo files
      for (const item of photos) {
        formData.append('photos', item.file);
      }

      const res = await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmittedData(res.data.data);
      localStorage.removeItem('wlw-report-draft');
      toast.success('Leak report registered successfully!');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to submit report';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedData) {
    const { report, incident } = submittedData;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-3xl glass-panel-elevated p-8 sm:p-10 border border-primary-aqua/40 text-center space-y-6 shadow-glow-aqua">
          <div className="w-16 h-16 rounded-2xl bg-primary-aqua/20 text-primary-aqua flex items-center justify-center mx-auto border border-primary-aqua/30">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Report Successfully Filed!</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Thank you for protecting our municipal water infrastructure. Your report has been dispatched to authorities.
            </p>
          </div>

          {/* Tracking ID Badge */}
          <div className="p-4 rounded-2xl bg-background-deep/80 border border-primary-aqua/30 max-w-md mx-auto">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Your Public Tracking ID</span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-black text-primary-aqua tracking-wider">
                {report.trackingId}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(report.trackingId);
                  toast.success('Tracking ID copied to clipboard!');
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                title="Copy ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Save this ID to check real-time resolution progress on the public tracker.
            </p>
          </div>

          {/* Clustered status note */}
          {incident?.reportCount > 1 && (
            <div className="p-3 rounded-xl bg-primary-aqua/10 border border-primary-aqua/20 text-xs text-primary-aqua font-medium">
              ✨ Clustered with {incident.reportCount - 1} other report(s) at this location. Priority escalated!
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to={`/track?id=${report.trackingId}`}
              className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-transform hover:scale-105"
            >
              Track Report Status Now
            </Link>
            <Link
              to="/map"
              className="py-3 px-6 rounded-xl font-semibold text-xs sm:text-sm glass-panel text-slate-200 hover:text-white transition-colors"
            >
              Return to Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header and Step Indicator */}
      <div className="mb-8 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Report a Water Leak</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Follow the 6 steps below. Our spatial engine checks for repeated reports and triggers SLA resolution.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-aqua transition-all duration-300 -z-0"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          />

          {[
            { num: 1, label: 'Location' },
            { num: 2, label: 'Area' },
            { num: 3, label: 'Severity' },
            { num: 4, label: 'Photos' },
            { num: 5, label: 'Details' },
            { num: 6, label: 'Review' }
          ].map((item) => (
            <div key={item.num} className="flex flex-col items-center gap-1 z-10">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === item.num
                    ? 'bg-primary-aqua text-background-deep shadow-glow-aqua scale-110'
                    : step > item.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-background-elevated border border-white/20 text-slate-400'
                }`}
              >
                {step > item.num ? '✓' : item.num}
              </div>
              <span className="hidden sm:block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Proximity Warning Banner if match nearby */}
      {nearbyIncident && (
        <div className="mb-6">
          <NearbySimilarCard
            nearbyIncident={nearbyIncident}
            onJoinIncident={handleJoinIncident}
            onReportSeparate={handleReportSeparate}
          />
        </div>
      )}

      {/* Step Container Card */}
      <div className="rounded-2xl glass-panel-elevated p-6 sm:p-8 border border-white/10 space-y-6">
        {/* STEP 1: Pin Location */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-aqua" />
              <h2 className="text-lg font-bold text-white">Step 1: Pin Location on Map</h2>
            </div>
            <p className="text-xs text-slate-300">
              Drag or click the map pin directly above the leak site, or use current GPS location.
            </p>
            <LocationPickerMap
              initialLat={latitude}
              initialLng={longitude}
              onLocationSelected={handleLocationPicked}
            />
          </div>
        )}

        {/* STEP 2: Area / Street / Ward Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-aqua" />
              <h2 className="text-lg font-bold text-white">Step 2: Area & Landmark Details</h2>
            </div>
            <p className="text-xs text-slate-300">
              Confirm or refine the neighborhood and nearby landmark to help repair crews find the leak quickly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Area / Neighborhood *
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => { setArea(e.target.value); saveDraft(); }}
                  placeholder="e.g. Downtown Metro"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-background-deep/80 border border-white/10 text-white text-sm focus:border-primary-aqua focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ward / District
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => { setWard(e.target.value); saveDraft(); }}
                  placeholder="e.g. Ward 3"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-deep/80 border border-white/10 text-white text-sm focus:border-primary-aqua focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Street Address / Intersection
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => { setStreet(e.target.value); saveDraft(); }}
                  placeholder="e.g. Market St & 4th Ave"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-deep/80 border border-white/10 text-white text-sm focus:border-primary-aqua focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Landmark Note
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => { setLandmark(e.target.value); saveDraft(); }}
                  placeholder="e.g. In front of public library steps"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-deep/80 border border-white/10 text-white text-sm focus:border-primary-aqua focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Severity & Leak Type */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 3: Severity & Leak Type</h2>
              <p className="text-xs text-slate-300">
                Choose the severity level to calibrate the emergency SLA response window.
              </p>
            </div>

            {/* Severity Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEVERITY_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setSeverity(opt.id); saveDraft(); }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    severity === opt.id
                      ? `${opt.color} shadow-lg scale-[1.02]`
                      : 'border-white/10 bg-background-deep/50 hover:border-white/30 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-white">{opt.name}</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40">
                      {opt.sla}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>

            {/* Leak Type Radio/Select */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Type of Water Infrastructure Leak *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LEAK_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setLeakType(t.id); saveDraft(); }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                      leakType === t.id
                        ? 'border-primary-aqua bg-primary-aqua/20 text-white font-bold'
                        : 'border-white/10 bg-background-deep/40 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Photo Uploads */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-aqua" />
              <h2 className="text-lg font-bold text-white">Step 4: Upload Photos (1 to 4)</h2>
            </div>
            <p className="text-xs text-slate-300">
              Clear photos enable repair crews to prepare the right tools and replacement parts before dispatching.
            </p>
            <PhotoUploader files={photos} onFilesChange={setPhotos} maxFiles={4} />
          </div>
        )}

        {/* STEP 5: Description & Reporter Information */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 5: Description & Contact</h2>
              <p className="text-xs text-slate-300">
                Provide details and decide whether to file anonymously or receive status updates.
              </p>
            </div>

            {/* Description with character counter */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Incident Description
                </label>
                <span className="text-xs font-mono text-slate-400">
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setDescription(e.target.value);
                    saveDraft();
                  }
                }}
                rows={3}
                placeholder="Describe what you see: estimated flow rate, bubbling pavement, water color, nearby damage..."
                className="w-full px-4 py-2.5 rounded-xl bg-background-deep/80 border border-white/10 text-white text-sm focus:border-primary-aqua focus:outline-none"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="p-3.5 rounded-xl glass-panel flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">File Anonymously</span>
                <span className="text-[11px] text-slate-400">
                  Your name and contact info will not be attached to the public report.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 accent-primary-aqua rounded cursor-pointer"
              />
            </div>

            {/* Reporter details if not anonymous */}
            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 rounded-xl bg-background-deep/80 border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-background-deep/80 border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="+1 555-0123"
                    className="w-full px-3 py-2 rounded-xl bg-background-deep/80 border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Review & Submit */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Step 6: Review & Confirm Submission</h2>
              <p className="text-xs text-slate-300">
                Please verify the summary below before sending to municipal repair crews.
              </p>
            </div>

            <div className="rounded-2xl bg-background-deep/80 p-4 border border-white/10 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-white text-right truncate max-w-xs">
                  {formattedAddress || `${street}, ${area}`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Severity Tier:</span>
                <span className="font-bold text-primary-aqua uppercase">{severity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Leak Type:</span>
                <span className="font-semibold text-white">{leakType.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Photos Attached:</span>
                <span className="font-semibold text-white">{photos.length} photo(s)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Reporter:</span>
                <span className="font-semibold text-white">
                  {isAnonymous ? 'Anonymous' : reporterName || 'Citizen Witness'}
                </span>
              </div>
              {existingIncidentId && (
                <div className="p-2 rounded bg-primary-aqua/10 text-primary-aqua font-semibold">
                  🔗 Will cluster into existing active incident ({existingIncidentId})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white glass-panel transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !area) {
                  toast.error('Please enter the area/neighborhood.');
                  return;
                }
                setStep(step + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-transform hover:scale-105"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-primary-aqua to-tealAccent text-background-deep shadow-glow-aqua transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Registering Report...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Submit Leak Report</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

