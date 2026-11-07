import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Droplet, Lock, Mail, ArrowRight, Shield, Wrench, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'crew') navigate('/crew');
      else navigate('/');
    } catch {
      // toast shown in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ocean to-primary-aqua flex items-center justify-center mx-auto shadow-glow-aqua">
          <Droplet className="w-6 h-6 text-white fill-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Sign In to WaterLeak Watch</h1>
        <p className="text-xs text-slate-400">
          Access your community dispatch, reporting activity, or administrator dashboard.
        </p>
      </div>

      <div className="rounded-3xl glass-panel-elevated p-8 border border-white/10 space-y-5 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-xs bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Logins Pill Box */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 block text-center uppercase tracking-wider">
            Quick Fill Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@waterleakwatch.org', 'AdminPass123!')}
              className="py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold border border-cyan-500/20 flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('crew@waterleakwatch.org', 'CrewPass123!')}
              className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/20 flex items-center justify-center gap-1"
            >
              <Wrench className="w-3 h-3" />
              Crew
            </button>
            <button
              type="button"
              onClick={() => fillDemo('citizen@waterleakwatch.org', 'CitizenPass123!')}
              className="py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20 flex items-center justify-center gap-1"
            >
              <User className="w-3 h-3" />
              Citizen
            </button>
          </div>
        </div>

        <div className="text-center pt-2 text-xs text-slate-400">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-primary-aqua font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

