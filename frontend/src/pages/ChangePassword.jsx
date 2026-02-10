import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';

const ChangePassword = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    if (form.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully!');
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {user?.isFirstLogin && (
          <div className="mb-6 p-4 bg-golden-50 border border-golden-200 rounded-xl">
            <p className="text-sm font-medium text-golden-800">⚠️ First Login Detected</p>
            <p className="text-xs text-golden-600 mt-1">You must change your password before continuing.</p>
          </div>
        )}

        <Card>
          <h2 className="text-lg font-bold text-violet-900 mb-5">Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Current Password</label>
              <input type="password" className="input-field" placeholder="Enter current password"
                value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">New Password</label>
              <input type="password" className="input-field" placeholder="Minimum 6 characters"
                value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
            </div>
            <div>
              <label className="input-label">Confirm New Password</label>
              <input type="password" className="input-field" placeholder="Re-enter new password"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
