import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';
import { formatDate } from '../../utils/helpers';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const HRLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  const fetch = async () => {
    try {
      const res = await api.get(`/leaves${filter ? `?status=${filter}` : ''}`);
      setLeaves(res.data);
    } catch {}
  };
  useEffect(() => { fetch(); }, [filter]);

  const handleAction = async (status) => {
    setLoading(true);
    try {
      await api.put(`/leaves/${selected._id}/status`, { status, comments });
      toast.success(`Leave ${status} successfully!`);
      setSelected(null);
      setComments('');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Leave Approvals</h2><p className="page-subtitle">Review and manage employee leave requests</p></div>
      </div>

      <Card>
        <div className="flex gap-2 mb-5">
          {['pending', 'approved', 'rejected', ''].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {leaves.length === 0 ? (
          <EmptyState icon={<SI d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={40} color="text-violet-400" />} title="No leave requests" message={`No ${filter || ''} leave requests found.`} />
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => (
              <div key={leave._id} className="p-4 border border-violet-100 rounded-xl hover:border-violet-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-violet-900">{leave.employee?.name}</p>
                      <span className="text-xs text-violet-400">{leave.employee?.employeeId}</span>
                      <Badge status={leave.status} />
                    </div>
                    <p className="text-sm text-violet-700 capitalize">{leave.type} Leave · {leave.totalDays} day(s)</p>
                    <p className="text-sm text-violet-500">{formatDate(leave.fromDate)} → {formatDate(leave.toDate)}</p>
                    <p className="text-sm text-gray-600 mt-1">Reason: {leave.reason}</p>
                    {leave.approverComments && (
                      <p className="text-xs text-violet-400 mt-1 italic">HR Note: {leave.approverComments}</p>
                    )}
                    {leave.approvedBy && (
                      <p className="text-xs text-violet-400 mt-1">Reviewed by: {leave.approvedBy?.name} on {formatDate(leave.approvalDate)}</p>
                    )}
                  </div>
                  {leave.status === 'pending' && (
                    <button onClick={() => { setSelected(leave); setComments(''); }} className="btn-primary btn-sm flex-shrink-0">
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Review Leave Request">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Employee', value: selected.employee?.name },
                { label: 'Type', value: selected.type + ' leave' },
                { label: 'From', value: formatDate(selected.fromDate) },
                { label: 'To', value: formatDate(selected.toDate) },
                { label: 'Total Days', value: `${selected.totalDays} day(s)` },
              ].map(item => (
                <div key={item.label} className="p-3 bg-violet-50 rounded-xl">
                  <p className="text-xs text-violet-500">{item.label}</p>
                  <p className="text-sm font-semibold text-violet-900 capitalize mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-violet-500 mb-1">Reason</p>
              <p className="text-sm text-gray-700">{selected.reason}</p>
            </div>
            <div>
              <label className="input-label">Comments (Optional)</label>
              <textarea className="input-field" rows={2} value={comments}
                onChange={e => setComments(e.target.value)} placeholder="Add a note for the employee..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAction('approved')} disabled={loading} className="btn-primary flex-1 bg-green-600 hover:bg-green-700">
                <span className="flex items-center justify-center gap-1.5"><SI d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color="text-white" /> Approve</span>
              </button>
              <button onClick={() => handleAction('rejected')} disabled={loading} className="btn-danger flex-1">
                <span className="flex items-center justify-center gap-1.5"><SI d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color="text-white" /> Reject</span>
              </button>
              <button onClick={() => setSelected(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HRLeaves;
