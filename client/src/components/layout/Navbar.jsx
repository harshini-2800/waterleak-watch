import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  Droplet,
  Map,
  Search,
  BarChart3,
  Shield,
  Wrench,
  User,
  LogOut,
  Sun,
  Moon,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, isCrew } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ocean-dark to-primary-aqua flex items-center justify-center shadow-glow-aqua group-hover:scale-105 transition-transform">
            <Droplet className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-primary-aqua bg-clip-text text-transparent">
              WaterLeak<span className="text-primary-aqua font-light">Watch</span>
            </span>
            <span className="hidden sm:block text-[10px] tracking-widest uppercase text-primary-aqua/70 font-semibold">
              Community Infrastructure
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link
            to="/map"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Map className="w-4 h-4 text-primary-aqua" />
            <span>Live Map</span>
          </Link>
          <Link
            to="/track"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Search className="w-4 h-4 text-primary-aqua" />
            <span>Track Report</span>
          </Link>
          <Link
            to="/analytics"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-primary-aqua" />
            <span>Analytics & SLA</span>
          </Link>

          {isCrew && (
            <Link
              to="/crew"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              <span>Crew Jobs</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Right CTA / Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Report Leak Action */}
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Leak</span>
          </Link>

          {/* User Menu / Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <Link
                to="/my-reports"
                className="hidden lg:flex flex-col text-right hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.name}</span>
                <span className="text-[10px] uppercase font-semibold text-primary-aqua tracking-wider">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-white/10">
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 glass-panel-elevated p-4 space-y-2">
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            <Map className="w-4 h-4 text-primary-aqua" />
            <span>Live Map & Clusters</span>
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            <Search className="w-4 h-4 text-primary-aqua" />
            <span>Track My Report</span>
          </Link>
          <Link
            to="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            <BarChart3 className="w-4 h-4 text-primary-aqua" />
            <span>Analytics & Resolution Times</span>
          </Link>
          {isCrew && (
            <Link
              to="/crew"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-amber-300 bg-amber-500/10"
            >
              <Wrench className="w-4 h-4" />
              <span>Assigned Crew Jobs</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-cyan-300 bg-cyan-500/10"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Management</span>
            </Link>
          )}
          <div className="pt-2 border-t border-white/10 flex justify-between items-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-primary-aqua"
                >
                  My Reports ({user.name})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 font-semibold"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-white/5 text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-primary-aqua text-background-deep font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

