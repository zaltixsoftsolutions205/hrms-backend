import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';
import { formatDate, formatDateTime } from '../../utils/helpers';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const statusColors = { new: '+', interested: '*', 'not-interested': 'x', converted: 'v' };

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
    <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Leads" value={data.stats?.total ?? '—'} icon={<SI d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={14} color="text-violet-600" />} color="violet" />
        <KpiCard label="New" value={data.stats?.new ?? '—'} icon={<SI d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" size={14} color="text-violet-600" />} color="violet" />
        <KpiCard label="Interested" value={data.stats?.interested ?? '—'} icon={<SI d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={14} color="text-amber-500" />} color="golden" />
        <KpiCard label="Converted" value={data.stats?.converted ?? '—'} icon={<SI d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" size={14} color="text-green-600" />} color="green" />
        <KpiCard label="Not Interested" value={data.stats?.notInterested ?? '—'} icon={<SI d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" size={14} color="text-red-500" />} color="red" />
        <KpiCard label="Conversion %" value={data.stats?.conversionRate !== undefined ? `${data.stats.conversionRate}%` : '—'} icon={<SI d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" size={14} color="text-amber-500" />} color="golden" />
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
          <EmptyState icon={<SI d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" size={40} color="text-violet-400" />} title="No leads yet" message="Start adding leads to build your pipeline."
            action={{ label: 'Add Lead', onClick: () => setShowAddModal(true) }} />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="data-table min-w-[540px]">
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
                      <span className="flex-shrink-0">{act.type === 'call' ? <SI d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={16} color="text-violet-500" /> : act.type === 'meeting' ? <SI d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={16} color="text-violet-500" /> : act.type === 'follow-up' ? <SI d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={16} color="text-violet-500" /> : <SI d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={16} color="text-violet-500" />}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-violet-900">{act.note}</p>
                        <p className="text-xs text-violet-400 mt-0.5">{formatDateTime(act.date)} · {act.by?.name || 'You'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Activity */}
              <form onSubmit={handleAddActivity} className="mt-3 flex flex-col sm:flex-row gap-2">
                <select className="input-field sm:w-auto flex-shrink-0" value={activityForm.type}
                  onChange={e => setActivityForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="note">Note</option>
                </select>
                <input className="input-field flex-1" placeholder="Log activity note..."
                  value={activityForm.note} onChange={e => setActivityForm(f => ({ ...f, note: e.target.value }))} />
                <button type="submit" className="btn-primary sm:flex-shrink-0">Log</button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CRMPage;
