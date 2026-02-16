import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import { formatDate, getInitials } from '../../utils/helpers';

const DOC_STATUS_STYLES = {
  pending_upload: 'bg-gray-100 text-gray-600',
  uploaded: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};
const DOC_STATUS_LABEL = {
  pending_upload: 'Pending Upload',
  uploaded: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected — Re-upload',
};

const EmployeeProfile = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: user?.phone || '', address: user?.address || '', emergencyContact: user?.emergencyContact || { name: '', phone: '', relation: '' } });
  const [loading, setLoading] = useState(false);

  // Documents state
  const [docsData, setDocsData] = useState(null);
  const [uploading, setUploading] = useState(null);
  const fileInputRefs = useRef({});

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents/my');
      setDocsData(res.data);
    } catch { /* silently ignore */ }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

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

  const handleUpload = async (docType, file) => {
    if (!file) return;
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${docType} uploaded successfully!`);
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(null); }
  };

  const info = [
    { label: 'Employee ID', value: user?.employeeId },
    { label: 'Department', value: user?.department?.name || 'Not Assigned' },
    { label: 'Designation', value: user?.designation || '—' },
    { label: 'Role', value: user?.role },
    { label: 'Joining Date', value: formatDate(user?.joiningDate) },
    { label: 'Email', value: user?.email },
  ];

  const approvedCount = docsData?.docs?.filter(d => d.status === 'approved').length ?? 0;
  const totalDocs = docsData?.docs?.length ?? 0;
  const allApproved = totalDocs > 0 && approvedCount === totalDocs;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-violet-900 truncate">{user?.name}</h2>
            <p className="text-violet-500 text-xs sm:text-sm truncate">{user?.designation || user?.role} · {user?.department?.name || 'No Department'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
              </span>
              {docsData?.employeeType && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${docsData.employeeType === 'fresher' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                  {docsData.employeeType}
                </span>
              )}
            </div>
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

      {/* Documents Section — only shown if employee has onboarding type */}
      {docsData?.employeeType && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-violet-900">Onboarding Documents</h3>
              <p className="text-xs text-violet-400 mt-0.5">
                {allApproved
                  ? 'All documents approved! You can now download your payslips.'
                  : `${approvedCount}/${totalDocs} approved — upload all required documents to unlock payslip downloads.`}
              </p>
            </div>
            <div className="text-right">
              <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${totalDocs > 0 ? (approvedCount / totalDocs) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-violet-500 mt-1">{Math.round(totalDocs > 0 ? (approvedCount / totalDocs) * 100 : 0)}%</p>
            </div>
          </div>

          {!allApproved && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              Payslip downloads are locked until all documents are approved by HR.
            </div>
          )}

          <div className="space-y-3">
            {docsData.docs.map((doc, i) => (
              <div key={doc._id || i} className="p-3 border border-violet-100 rounded-xl bg-violet-50/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-violet-900">{doc.docType}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${DOC_STATUS_STYLES[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                      {DOC_STATUS_LABEL[doc.status] || doc.status}
                    </span>
                    {doc.status === 'rejected' && doc.rejectionReason && (
                      <p className="text-xs text-red-500 mt-0.5">{doc.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.status === 'approved' && (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {(doc.status === 'pending_upload' || doc.status === 'rejected' || doc.status === 'uploaded') && (
                      <>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          ref={el => { fileInputRefs.current[doc.docType] = el; }}
                          onChange={e => { handleUpload(doc.docType, e.target.files[0]); e.target.value = ''; }}
                        />
                        <button
                          onClick={() => fileInputRefs.current[doc.docType]?.click()}
                          disabled={uploading === doc.docType}
                          className={`btn-sm text-xs flex items-center gap-1 ${doc.status === 'uploaded' ? 'btn-secondary' : 'btn-primary'}`}>
                          {uploading === doc.docType ? 'Uploading...' : (
                            <>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              {doc.status === 'uploaded' ? 'Re-upload' : 'Upload'}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EmployeeProfile;
