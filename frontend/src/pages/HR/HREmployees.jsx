import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import { formatDate, getInitials, formatCurrency } from '../../utils/helpers';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const DOC_STATUS_STYLES = {
  pending_upload: 'bg-gray-100 text-gray-600',
  uploaded: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};
const DOC_STATUS_LABEL = {
  pending_upload: 'Pending Upload',
  uploaded: 'Uploaded',
  approved: 'Approved',
  rejected: 'Rejected',
};

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', role: 'employee', departmentId: '', designation: '', phone: '', joiningDate: '', basicSalary: '', employeeType: '' });

  const fetchAll = async () => {
    const [empRes, deptRes] = await Promise.all([api.get('/employees'), api.get('/admin/departments')]).catch(() => [{data:[]},{data:[]}]);
    if (empRes.data) setEmployees(empRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/employees', form);
      toast.success(`Employee created! Temp password: ${res.data.tempPassword}`, { duration: 6000 });
      setShowAddModal(false);
      setForm({ employeeId: '', name: '', email: '', role: 'employee', departmentId: '', designation: '', phone: '', joiningDate: '', basicSalary: '', employeeType: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create employee'); }
    finally { setLoading(false); }
  };

  const sendOffer = async (emp) => {
    try {
      await api.post('/employees/send-offer', { employeeId: emp._id, salary: emp.basicSalary });
      toast.success('Offer letter sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send offer letter'); }
  };

  const sendCreds = async (emp) => {
    try {
      await api.post('/employees/send-credentials', { employeeId: emp._id });
      toast.success('Credentials sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send credentials'); }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Are you sure you want to delete ${emp.name} (${emp.employeeId})? This will disable their login and remove them from active lists.`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success(`${emp.name} has been deleted.`);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete employee'); }
  };

  const openDocs = (emp) => {
    setSelectedEmp(emp);
    setShowDocsModal(true);
  };

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId?.includes(search) || e.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Employee Management</h2><p className="page-subtitle">{employees.length} total employees</p></div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">+ Add Employee</button>
      </div>

      <Card>
        <div className="mb-4">
          <input className="input-field sm:max-w-xs" placeholder="Search by name, ID or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<SI d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={40} color="text-violet-400" />} title="No employees" message="Add your first employee to get started."
            action={{ label: 'Add Employee', onClick: () => setShowAddModal(true) }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th><th>Role</th><th>Type</th><th>Joining</th><th>Salary</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-200 rounded-xl flex items-center justify-center text-violet-800 font-bold text-sm flex-shrink-0">
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-violet-900">{emp.name}</p>
                          <p className="text-xs text-violet-400">{emp.employeeId} · {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department?.name || '—'}</td>
                    <td className="capitalize">{emp.role}</td>
                    <td>
                      {emp.employeeType ? (
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${emp.employeeType === 'fresher' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                          {emp.employeeType}
                        </span>
                      ) : <span className="text-violet-300 text-xs">—</span>}
                    </td>
                    <td>{formatDate(emp.joiningDate)}</td>
                    <td>{emp.basicSalary > 0 ? formatCurrency(emp.basicSalary) : '—'}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => sendOffer(emp)} className="btn-ghost btn-sm text-xs flex items-center gap-1"><SI d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={13} color="text-violet-600" /> Offer</button>
                        <button onClick={() => sendCreds(emp)} className="btn-ghost btn-sm text-xs flex items-center gap-1"><SI d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" size={13} color="text-violet-600" /> Creds</button>
                        {emp.employeeType && (
                          <button onClick={() => openDocs(emp)} className="btn-secondary btn-sm text-xs flex items-center gap-1">
                            <SI d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={13} color="text-violet-600" /> Docs
                          </button>
                        )}
                        <button onClick={() => { setSelectedEmp(emp); setShowEditModal(true); }} className="btn-secondary btn-sm text-xs">Edit</button>
                        <button onClick={() => handleDelete(emp)} className="btn-sm text-xs text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Employee Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="input-label">Employee ID *</label><input className="input-field" required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} placeholder="e.g. EMP0001" /></div>
            <div><label className="input-label">Full Name *</label><input className="input-field" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
            <div><label className="input-label">Email *</label><input type="email" className="input-field" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Role *</label>
              <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="employee">Employee</option>
                <option value="sales">Sales Employee</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <div>
              <label className="input-label">Department</label>
              <select className="input-field" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="input-label">Designation</label><input className="input-field" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Job title" /></div>
            <div><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="input-label">Joining Date</label><input type="date" className="input-field" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} /></div>
            <div><label className="input-label">Basic Salary (₹)</label><input type="number" className="input-field" value={form.basicSalary} onChange={e => setForm(f => ({ ...f, basicSalary: e.target.value }))} placeholder="Monthly basic salary" /></div>
          </div>
          <div>
            <label className="input-label">Employee Type (Onboarding)</label>
            <select className="input-field" value={form.employeeType} onChange={e => setForm(f => ({ ...f, employeeType: e.target.value }))}>
              <option value="">None (skip document onboarding)</option>
              <option value="fresher">Fresher</option>
              <option value="experienced">Experienced</option>
            </select>
            {form.employeeType && (
              <p className="text-xs text-violet-500 mt-1">
                Required documents will be auto-created. Employee must upload and get them approved before downloading payslips.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating...' : 'Create Employee'}</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
          </div>
          <p className="text-xs text-violet-400 text-center">A temporary password will be generated. Use "Send Credentials" to email login details.</p>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      {selectedEmp && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit — ${selectedEmp.name}`} size="lg">
          <EditEmployeeForm emp={selectedEmp} departments={departments} onDone={() => { setShowEditModal(false); fetchAll(); }} />
        </Modal>
      )}

      {/* Document Review Modal */}
      {selectedEmp && (
        <Modal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} title={`Documents — ${selectedEmp.name}`} size="lg">
          <DocumentReviewPanel emp={selectedEmp} />
        </Modal>
      )}
    </div>
  );
};

const DocumentReviewPanel = ({ emp }) => {
  const [data, setData] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await api.get(`/documents/employee/${emp._id}`);
      setData(res.data);
    } catch { toast.error('Failed to load documents'); }
  };

  useEffect(() => { fetchDocs(); }, [emp._id]);

  const handleReview = async (docId, status) => {
    setReviewing(docId);
    try {
      await api.patch(`/documents/${docId}/review`, { status, rejectionReason: status === 'rejected' ? rejectReason : '' });
      toast.success(`Document ${status}!`);
      setShowRejectInput(null);
      setRejectReason('');
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.message || 'Review failed'); }
    finally { setReviewing(null); }
  };

  if (!data) return <div className="flex items-center justify-center py-10 text-violet-400 text-sm">Loading documents...</div>;
  if (!data.employeeType) return <div className="text-center py-8 text-violet-400 text-sm">No onboarding type set for this employee.</div>;

  const approvedCount = data.docs.filter(d => d.status === 'approved').length;
  const total = data.docs.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-violet-600 font-medium capitalize">{data.employeeType} — {approvedCount}/{total} approved</span>
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${total > 0 ? (approvedCount / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {data.docs.map((doc, i) => (
          <div key={doc._id || i} className="p-3 border border-violet-100 rounded-xl bg-violet-50/40">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-violet-900">{doc.docType}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${DOC_STATUS_STYLES[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                  {DOC_STATUS_LABEL[doc.status] || doc.status}
                </span>
                {doc.status === 'rejected' && doc.rejectionReason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {doc.rejectionReason}</p>
                )}
                {doc.uploadedAt && (
                  <p className="text-xs text-violet-400 mt-0.5">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.filePath && (
                  <a href={`/${doc.filePath}`} target="_blank" rel="noopener noreferrer"
                    className="btn-ghost btn-sm text-xs flex items-center gap-1">
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </a>
                )}
                {doc._id && doc.status === 'uploaded' && (
                  <>
                    <button onClick={() => handleReview(doc._id, 'approved')} disabled={reviewing === doc._id}
                      className="btn-sm text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg px-2 py-1 font-semibold transition-colors">
                      {reviewing === doc._id ? '...' : 'Approve'}
                    </button>
                    {showRejectInput === doc._id ? (
                      <div className="flex items-center gap-1">
                        <input className="input-field text-xs py-1 w-32" placeholder="Reason (optional)"
                          value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                        <button onClick={() => handleReview(doc._id, 'rejected')} disabled={reviewing === doc._id}
                          className="btn-sm text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-2 py-1 font-semibold transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => setShowRejectInput(null)} className="text-xs text-violet-400 px-1">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setShowRejectInput(doc._id); setRejectReason(''); }}
                        className="btn-sm text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-2 py-1 font-semibold transition-colors">
                        Reject
                      </button>
                    )}
                  </>
                )}
                {doc._id && doc.status === 'approved' && (
                  <button onClick={() => handleReview(doc._id, 'rejected')} disabled={reviewing === doc._id}
                    className="btn-sm text-xs text-red-400 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors">
                    Revoke
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EditEmployeeForm = ({ emp, departments, onDone }) => {
  const [form, setForm] = useState({
    name: emp.name, designation: emp.designation || '', phone: emp.phone || '',
    department: emp.department?._id || '', joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
    basicSalary: emp.basicSalary || 0, role: emp.role,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/employees/${emp._id}`, form);
      toast.success('Employee updated!');
      onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="input-label">Name</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div><label className="input-label">Designation</label><input className="input-field" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div>
          <label className="input-label">Department</label>
          <select className="input-field" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
            <option value="">None</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="input-label">Joining Date</label><input type="date" className="input-field" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} /></div>
        <div><label className="input-label">Basic Salary</label><input type="number" className="input-field" value={form.basicSalary} onChange={e => setForm(f => ({ ...f, basicSalary: parseFloat(e.target.value) }))} /></div>
      </div>
      <div>
        <label className="input-label">Role</label>
        <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="employee">Employee</option>
          <option value="sales">Sales</option>
          <option value="hr">HR</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        <button onClick={onDone} className="btn-secondary flex-1">Cancel</button>
      </div>
    </div>
  );
};

export default HREmployees;
