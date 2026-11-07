import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import SLABadge from '../components/common/SLABadge.jsx';
import { getSeverityColor, getStatusBadge, formatDate } from '../lib/utils.js';
import { FileText, MapPin, PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MyReports() {
  const { user, isAuthenticated } = useAuth();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['my-reports', user?.id],
    queryFn: async () => {
      const res = await api.get('/reports?limit=50');
      return res.data.data;
    }
  });

  const reportList = reports || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">My Leak Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your submissions, community clustering status, and municipal repair verification.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading your report records...</div>
      ) : reportList.length === 0 ? (
        <div className="rounded-2xl glass-panel p-10 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Reports Submitted Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Notice a leaking pipe or dripping hydrant in your neighborhood? Report it to begin tracking resolution.
          </p>
          <Link
            to="/report"
            className="inline-block py-2 px-4 rounded-xl text-xs font-bold bg-primary-aqua text-background-deep"
          >
            File First Report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reportList.map((report) => {
            const severityStyle = getSeverityColor(report.severity);
            const statusBadge = getStatusBadge(report.incidentId?.status || 'reported');

            return (
              <div
                key={report._id}
                className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary-aqua/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary-aqua bg-primary-aqua/10 px-2 py-0.5 rounded border border-primary-aqua/20">
                      {report.trackingId}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${severityStyle.bg}`}>
                      {report.severity.toUpperCase()}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-white line-clamp-1">
                    {report.leakType?.replace('_', ' ').toUpperCase()} at {report.address?.area}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-aqua" />
                      {report.address?.formatted || report.address?.area}
                    </span>
                    <span>• {formatDate(report.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    to={`/track?id=${report.trackingId}`}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

