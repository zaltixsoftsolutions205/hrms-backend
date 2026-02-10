import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', headOf: '' });

  const fetch = async () => {
    const [dRes, eRes] = await Promise.all([api.get('/admin/departments'), api.get('/employees')]).catch(() => [{ data: [] }, { data: [] }]);
    if (dRes.data) setDepartments(dRes.data);
    if (eRes.data) setEmployees(eRes.data);
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode) {
        await api.put(`/admin/departments/${selected._id}`, form);
        toast.success('Department updated!');
      } else {
        await api.post('/admin/departments', form);
        toast.success('Department created!');
      }
      setShowModal(false); setForm({ name: '', description: '', headOf: '' }); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success('Deleted!');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const openEdit = (dept) => {
    setSelected(dept); setEditMode(true);
    setForm({ name: dept.name, description: dept.description || '', headOf: dept.headOf?._id || '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Departments</h2><p className="page-subtitle">{departments.length} departments</p></div>
        <button onClick={() => { setEditMode(false); setForm({ name: '', description: '', headOf: '' }); setShowModal(true); }} className="btn-primary">
          + Create Department
        </button>
      </div>

      {departments.length === 0 ? (
        <EmptyState icon="🏢" title="No departments" message="Create your first department."
          action={{ label: 'Create', onClick: () => setShowModal(true) }} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <motion.div key={dept._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  🏢
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(dept)} className="btn-ghost btn-sm text-xs">Edit</button>
                  <button onClick={() => handleDelete(dept._id)} className="btn-ghost btn-sm text-xs text-red-500 hover:text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
              <h3 className="font-bold text-violet-900 text-lg">{dept.name}</h3>
              {dept.description && <p className="text-sm text-violet-500 mt-1">{dept.description}</p>}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-violet-500">Head: <span className="font-medium text-violet-900">{dept.headOf?.name || 'Not assigned'}</span></span>
                <span className="badge-purple">{dept.employeeCount || 0} employees</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? 'Edit Department' : 'Create Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Department Name *</label>
            <input className="input-field" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering" />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Department description" />
          </div>
          <div>
            <label className="input-label">Department Head</label>
            <select className="input-field" value={form.headOf} onChange={e => setForm(f => ({ ...f, headOf: e.target.value }))}>
              <option value="">Not assigned</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : editMode ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDepartments;
