import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Toaster } from 'react-hot-toast';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.isFirstLogin) {
        toast.success('Welcome! Please change your password.');
        navigate('/change-password');
      } else {
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset email sent!');
      setMode('login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-violet-900 to-violet-800 flex items-center justify-center p-4">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#fff', border: '1px solid #DDD6FE', color: '#4C1D95', fontSize: '14px', borderRadius: '12px' },
      }} />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-700/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-golden-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-golden-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl mx-auto mb-3">
            HR
          </div>
          <h1 className="text-2xl font-bold text-white">HRMS System</h1>
          <p className="text-violet-300 text-sm mt-1">Human Resource & CRM Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {mode === 'login' ? (
            <>
              <h2 className="text-lg font-bold text-white mb-6">Sign in to your account</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-violet-200 mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-golden-400 focus:border-transparent text-sm transition-all"
                    placeholder="you@company.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-violet-200 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-golden-400 focus:border-transparent text-sm transition-all"
                      placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-300 hover:text-white text-sm">
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => setMode('forgot')} className="text-xs text-golden-300 hover:text-golden-200 font-medium">
                  Forgot password?
                </button>
                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                  className="w-full bg-golden-500 hover:bg-golden-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-golden-500/30 disabled:opacity-60 mt-2">
                  {loading ? 'Signing in...' : 'Sign In'}
                </motion.button>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => setMode('login')} className="flex items-center gap-2 text-violet-300 hover:text-white text-sm mb-5 transition-colors">
                ← Back to login
              </button>
              <h2 className="text-lg font-bold text-white mb-2">Reset Password</h2>
              <p className="text-violet-300 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-violet-200 mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-golden-400 text-sm transition-all"
                    placeholder="you@company.com" />
                </div>
                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                  className="w-full bg-golden-500 hover:bg-golden-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-60">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
