import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@fic.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e2bfb9] rounded-md shadow-lg overflow-hidden">
        {/* Header Banner with Logo */}
        <div className="bg-[#800000] p-8 text-center text-white relative">
          <img
            src="/logo.png"
            alt="Forge India Connect Logo"
            className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-white/80 shadow-md object-cover"
          />
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">FORGE INDIA CONNECT</h1>
          <p className="text-rose-200 text-xs mt-1 font-semibold">Institutional Assessment Admin Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-[#fff0f0] border border-[#e2bfb9] rounded-md p-4 flex items-start space-x-3 text-[#800000] text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#800000] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider mb-2">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8e706c] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fic.com"
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md pl-10 pr-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5a413d] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8e706c] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md pl-10 pr-4 py-2.5 text-sm text-[#311213] focus:outline-none focus:border-[#800000]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#800000] hover:bg-[#570000] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-md shadow transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to Admin Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
