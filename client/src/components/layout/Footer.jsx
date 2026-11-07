import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, ShieldCheck, HeartHandshake, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 glass-panel py-10 mt-16 pb-20 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-aqua flex items-center justify-center text-background-deep shadow-glow-aqua">
                <Droplet className="w-4 h-4 fill-background-deep" />
              </div>
              <span className="text-base font-extrabold text-white">WaterLeak Watch</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Real-time community water conservation and leak resolution tracking platform.
              Equipping citizens and municipal repair teams to detect, group, and eliminate water loss faster.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-primary-aqua">
                <ShieldCheck className="w-4 h-4" /> SLA Verified
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <HeartHandshake className="w-4 h-4" /> Community Powered
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/map" className="hover:text-primary-aqua transition-colors">
                  Live Incident Map
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-primary-aqua transition-colors">
                  Report a Water Leak
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-primary-aqua transition-colors">
                  Track Report by ID
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-primary-aqua transition-colors">
                  Resolution Analytics & SLAs
                </Link>
              </li>
            </ul>
          </div>

          {/* SLA Commitments */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Target SLAs</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex justify-between">
                <span>Critical Bursts:</span>
                <span className="font-mono text-red-400 font-bold">&lt; 24h</span>
              </li>
              <li className="flex justify-between">
                <span>High Severity:</span>
                <span className="font-mono text-orange-400 font-bold">&lt; 48h</span>
              </li>
              <li className="flex justify-between">
                <span>Medium Pressure:</span>
                <span className="font-mono text-yellow-400 font-bold">&lt; 5 Days</span>
              </li>
              <li className="flex justify-between">
                <span>Low / Hydrant:</span>
                <span className="font-mono text-emerald-400 font-bold">&lt; 10 Days</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} WaterLeak Watch. Dedicated to public water preservation.</p>
          <div className="flex items-center gap-4">
            <a
              href="http://localhost:5000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary-aqua flex items-center gap-1"
            >
              <span>API Swagger Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span>Version 1.0.0 (Production)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

