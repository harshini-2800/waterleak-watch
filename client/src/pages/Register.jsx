import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Droplet, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('citizen');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await register({ name, email, password, phone, role });
      navigate('/');
    } catch {
      // toast in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ocean to-primary-aqua flex items-center justify-center mx-auto shadow-glow-aqua">
          <Droplet className="w-6 h-6 text-white fill-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Create an Account</h1>
        <p className="text-xs text-slate-400">
          Join the community water monitoring network and receive real-time resolution updates.
        </p>
      </div>

      <div className="rounded-3xl glass-panel-elevated p-8 border border-white/10 space-y-5 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
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
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background-deep border border-white/10 text-white text-xs focus:border-primary-aqua focus:outline-none"
            >
              <option value="citizen">Citizen (Reporter & Community Member)</option>
              <option value="crew">Repair Crew (Field Technician)</option>
              <option value="admin">Admin / Municipal Authority</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-xs bg-primary-aqua text-background-deep hover:bg-primary-hover shadow-glow-aqua transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          <span>Already have an account? </span>
          <Link to="/login" className="text-primary-aqua font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

