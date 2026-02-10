import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import { formatDate, getInitials } from '../../utils/helpers';

const EmployeeProfile = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: user?.phone || '', address: user?.address || '', emergencyContact: user?.emergencyContact || { name: '', phone: '', relation: '' } });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/employees/me/profile', form);
      await refreshUser();
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const info = [
    { label: 'Employee ID', value: user?.employeeId },
    { label: 'Department', value: user?.department?.name || 'Not Assigned' },
    { label: 'Designation', value: user?.designation || '—' },
    { label: 'Role', value: user?.role },
    { label: 'Joining Date', value: formatDate(user?.joiningDate) },
    { label: 'Email', value: user?.email },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-violet-900">{user?.name}</h2>
            <p className="text-violet-500 text-sm">{user?.designation || user?.role} · {user?.department?.name || 'No Department'}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* Info Grid */}
      <Card>
        <h3 className="font-bold text-violet-900 mb-4">Professional Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {info.map(item => (
            <div key={item.label} className="p-3 bg-violet-50/60 rounded-xl">
              <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-semibold text-violet-900 mt-0.5 capitalize">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Editable Info */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-violet-900">Personal Information</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">Edit</button>
          )}
        </div>
        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-violet-50/60 rounded-xl">
              <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Phone</p>
              <p className="text-sm font-semibold text-violet-900 mt-0.5">{user?.phone || '—'}</p>
            </div>
            <div className="p-3 bg-violet-50/60 rounded-xl sm:col-span-1">
              <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Address</p>
              <p className="text-sm font-semibold text-violet-900 mt-0.5">{user?.address || '—'}</p>
            </div>
            <div className="p-3 bg-violet-50/60 rounded-xl">
              <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Emergency Contact</p>
              <p className="text-sm font-semibold text-violet-900 mt-0.5">{user?.emergencyContact?.name || '—'}</p>
              {user?.emergencyContact?.phone && <p className="text-xs text-violet-500">{user.emergencyContact.phone} · {user.emergencyContact.relation}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="input-label">Phone</label>
              <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
            </div>
            <div>
              <label className="input-label">Address</label>
              <textarea className="input-field" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Your address" />
            </div>
            <div>
              <p className="input-label">Emergency Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input className="input-field" placeholder="Name" value={form.emergencyContact.name} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value } }))} />
                <input className="input-field" placeholder="Phone" value={form.emergencyContact.phone} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value } }))} />
                <input className="input-field" placeholder="Relation" value={form.emergencyContact.relation} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, relation: e.target.value } }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeeProfile;
