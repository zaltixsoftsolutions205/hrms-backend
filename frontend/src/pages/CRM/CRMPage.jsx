import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';
import { formatDate, formatDateTime } from '../../utils/helpers';

const statusColors = { new: '🆕', interested: '⭐', 'not-interested': '❌', converted: '🎉' };

const CRMPage = () => {
  const [data, setData] = useState({ leads: [], stats: {} });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'other', notes: '' });
  const [activityForm, setActivityForm] = useState({ type: 'call', note: '' });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await api.get(`/leads${statusFilter ? `?status=${statusFilter}` : ''}`);
      setData(res.data);
    } catch {}
  };

  useEffect(() => { fetchLeads(); }, [statusFilter]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', form);
      toast.success('Lead added!');
      setShowAddModal(false);
      setForm({ name: '', phone: '', email: '', source: 'other', notes: '' });
      fetchLeads();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add lead'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (leadId, status) => {
    try {
      const res = await api.put(`/leads/${leadId}/status`, { status });
      setData(d => ({ ...d, leads: d.leads.map(l => l._id === leadId ? res.data : l) }));
      if (selectedLead?._id === leadId) setSelectedLead(res.data);
      toast.success('Status updated!');
      fetchLeads();
    } catch (err) { toast.error('Update failed'); }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.note.trim()) return toast.error('Please enter a note');
    try {
      const res = await api.post(`/leads/${selectedLead._id}/activity`, activityForm);
      setSelectedLead(res.data);
      setActivityForm({ type: 'call', note: '' });
      toast.success('Activity logged!');
    } catch { toast.error('Failed to log activity'); }
  };

  const openLead = async (lead) => {
    try {
      const res = await api.get(`/leads/${lead._id}`);
      setSelectedLead(res.data);
      setShowDetailModal(true);
    } catch { toast.error('Failed to load lead details'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Leads" value={data.stats?.total ?? '—'} icon="👥" color="violet" />
        <KpiCard label="New" value={data.stats?.new ?? '—'} icon="🆕" color="violet" />
        <KpiCard label="Interested" value={data.stats?.interested ?? '—'} icon="⭐" color="golden" />
        <KpiCard label="Converted" value={data.stats?.converted ?? '—'} icon="🎉" color="green" />
        <KpiCard label="Not Interested" value={data.stats?.notInterested ?? '—'} icon="❌" color="red" />
        <KpiCard label="Conversion %" value={data.stats?.conversionRate !== undefined ? `${data.stats.conversionRate}%` : '—'} icon="📈" color="golden" />
      </div>

      {/* List */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-violet-900">Lead Pipeline</h3>
          <div className="flex flex-wrap gap-2">
            {['', 'new', 'interested', 'not-interested', 'converted'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}>
                {s === '' ? 'All' : s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">+ Add Lead</button>
          </div>
        </div>

        {data.leads.length === 0 ? (
          <EmptyState icon="🎯" title="No leads yet" message="Start adding leads to build your pipeline."
            action={{ label: 'Add Lead', onClick: () => setShowAddModal(true) }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th><th>Phone</th><th>Source</th><th>Status</th><th>Added</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map(lead => (
                  <tr key={lead._id} className="cursor-pointer" onClick={() => openLead(lead)}>
                    <td>
                      <div>
                        <p className="font-semibold text-violet-900">{lead.name}</p>
                        {lead.email && <p className="text-xs text-violet-400">{lead.email}</p>}
                      </div>
                    </td>
                    <td>{lead.phone}</td>
                    <td className="capitalize">{lead.source.replace(/-/g, ' ')}</td>
                    <td>
                      <select value={lead.status} onChange={e => { e.stopPropagation(); handleStatusChange(lead._id, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        className="text-xs border border-violet-200 rounded-lg px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-400">
                        <option value="new">New</option>
                        <option value="interested">Interested</option>
                        <option value="not-interested">Not Interested</option>
                        <option value="converted">Converted</option>
                      </select>
                    </td>
                    <td className="text-xs">{formatDate(lead.createdAt)}</td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); openLead(lead); }} className="btn-ghost btn-sm text-xs">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Lead Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Lead">
        <form onSubmit={handleAddLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Full Name *</label>
              <input className="input-field" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lead's name" />
            </div>
            <div>
              <label className="input-label">Phone *</label>
              <input className="input-field" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="input-label">Source</label>
              <select className="input-field" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="cold-call">Cold Call</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Notes</label>
            <textarea className="input-field" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any initial notes about this lead..." />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Adding...' : 'Add Lead'}</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Lead Detail Modal */}
      <Modal isOpen={showDetailModal && !!selectedLead} onClose={() => setShowDetailModal(false)} title="Lead Details" size="lg">
        {selectedLead && (
          <div className="space-y-5">
            {/* Lead Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Name', value: selectedLead.name },
                { label: 'Phone', value: selectedLead.phone },
                { label: 'Email', value: selectedLead.email || '—' },
                { label: 'Source', value: selectedLead.source },
                { label: 'Status', value: selectedLead.status },
                { label: 'Added', value: formatDate(selectedLead.createdAt) },
              ].map(item => (
                <div key={item.label} className="p-3 bg-violet-50 rounded-xl">
                  <p className="text-xs text-violet-500 font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-violet-900 capitalize mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            {selectedLead.notes && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{selectedLead.notes}</p>}

            {/* Change Status */}
            <div>
              <label className="input-label">Update Status</label>
              <div className="flex gap-2 flex-wrap">
                {['new', 'interested', 'not-interested', 'converted'].map(s => (
                  <button key={s} onClick={() => handleStatusChange(selectedLead._id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${selectedLead.status === s ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                    {statusColors[s]} {s.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 className="font-bold text-violet-900 mb-3">Activity Timeline</h4>
              {selectedLead.activities?.length === 0 ? (
                <p className="text-sm text-violet-400 text-center py-4">No activities logged yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...selectedLead.activities].reverse().map((act, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-violet-50 rounded-xl">
                      <span className="text-base">{act.type === 'call' ? '📞' : act.type === 'meeting' ? '🤝' : act.type === 'follow-up' ? '🔁' : '📝'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-violet-900">{act.note}</p>
                        <p className="text-xs text-violet-400 mt-0.5">{formatDateTime(act.date)} · {act.by?.name || 'You'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Activity */}
              <form onSubmit={handleAddActivity} className="mt-3 flex gap-2">
                <select className="input-field w-auto flex-shrink-0" value={activityForm.type}
                  onChange={e => setActivityForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="call">📞 Call</option>
                  <option value="meeting">🤝 Meeting</option>
                  <option value="follow-up">🔁 Follow-up</option>
                  <option value="note">📝 Note</option>
                </select>
                <input className="input-field flex-1" placeholder="Log activity note..."
                  value={activityForm.note} onChange={e => setActivityForm(f => ({ ...f, note: e.target.value }))} />
                <button type="submit" className="btn-primary flex-shrink-0">Log</button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CRMPage;
