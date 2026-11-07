import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, Plus, Search, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MobileNav() {
  const { isCrew } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background-surface/90 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-primary-aqua font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/map"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-primary-aqua font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Map className="w-5 h-5" />
        <span>Map</span>
      </NavLink>

      {/* Floating center Report Action button */}
      <NavLink
        to="/report"
        className="relative -top-5 w-12 h-12 rounded-full bg-gradient-to-tr from-ocean to-primary-aqua flex items-center justify-center text-background-deep shadow-glow-aqua active:scale-95 transition-transform"
        aria-label="Report a leak"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </NavLink>

      <NavLink
        to="/track"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-primary-aqua font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <Search className="w-5 h-5" />
        <span>Track</span>
      </NavLink>

      <NavLink
        to={isCrew ? '/crew' : '/my-reports'}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            isActive ? 'text-primary-aqua font-bold' : 'text-slate-400 hover:text-slate-200'
          }`
        }
      >
        <UserCheck className="w-5 h-5" />
        <span>{isCrew ? 'Crew' : 'Activity'}</span>
      </NavLink>
    </nav>
  );
}

