import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';
import { formatDate, capitalize } from '../../utils/helpers';

const LeavePage = () => {
  const [data, setData] = useState({ leaves: [], balance: {} });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'casual', fromDate: '', toDate: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get('/leaves/my');
      setData(res.data);
    } catch {}
  };
  useEffect(() => { fetch(); }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave request submitted!');
      setShowModal(false);
      setForm({ type: 'casual', fromDate: '', toDate: '', reason: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  const balanceColors = { casual: 'violet', sick: 'blue', other: 'golden' };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Leave Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(data.balance).map(([type, bal]) => (
          <motion.div key={type} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5">
            <p className="kpi-label capitalize">{type} Leave</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-2xl font-bold text-violet-900">{bal.remaining}</p>
              <p className="text-xs text-violet-500">{bal.used}/{bal.total} used</p>
            </div>
            <div className="h-1.5 bg-violet-200 rounded-full mt-3 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${bal.total > 0 ? (bal.used / bal.total) * 100 : 0}%` }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="h-full bg-violet-600 rounded-full" />
            </div>
            <p className="text-xs text-green-600 font-medium mt-1">{bal.remaining} remaining</p>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Leave Requests</h2>
          <p className="page-subtitle">Manage and track your leave applications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Apply Leave
        </button>
      </div>

      {/* Leave List */}
      <Card>
        {data.leaves.length === 0 ? (
          <EmptyState icon="🌿" title="No leave requests" message="You haven't applied for any leaves yet."
            action={{ label: 'Apply Leave', onClick: () => setShowModal(true) }} />
        ) : (
          <div className="space-y-3">
            {data.leaves.map(leave => (
              <motion.div key={leave._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 border border-violet-100 rounded-xl hover:bg-violet-50/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-violet-900 capitalize">{leave.type} Leave</span>
                      <Badge status={leave.status} />
                    </div>
                    <p className="text-sm text-violet-600">{formatDate(leave.fromDate)} → {formatDate(leave.toDate)}
                      <span className="ml-2 text-xs text-violet-400">({leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''})</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                    {leave.approverComments && (
                      <p className="text-xs text-violet-500 mt-1 italic">Note: {leave.approverComments}</p>
                    )}
                  </div>
                  <p className="text-xs text-violet-400 whitespace-nowrap">{formatDate(leave.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Apply Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="input-label">Leave Type</label>
            <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="other">Other Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">From Date</label>
              <input type="date" className="input-field" required value={form.fromDate}
                onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="input-label">To Date</label>
              <input type="date" className="input-field" required value={form.toDate}
                onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} min={form.fromDate || new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <label className="input-label">Reason</label>
            <textarea className="input-field" rows={3} required value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Explain the reason for your leave..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeavePage;
