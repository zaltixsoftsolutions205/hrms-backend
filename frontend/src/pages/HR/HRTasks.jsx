import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';
import { formatDate } from '../../utils/helpers';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const HRTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminding, setReminding] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' });
  const [filterEmp, setFilterEmp] = useState('');

  const fetch = async () => {
    const [tasksRes, kpiRes, empRes] = await Promise.all([
      api.get(`/tasks${filterEmp ? `?employeeId=${filterEmp}` : ''}`).catch(() => ({ data: [] })),
      api.get('/tasks/kpi').catch(() => ({ data: [] })),
      api.get('/employees').catch(() => ({ data: [] })),
    ]);
    setTasks(tasksRes.data);
    setKpiData(kpiRes.data);
    setEmployees(empRes.data);
  };

  useEffect(() => { fetch(); }, [filterEmp]);

  const handleRemind = async (taskId) => {
    setReminding(taskId);
    try {
      const res = await api.post(`/tasks/${taskId}/reminder`);
      toast.success(res.data.message || 'Reminder sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send reminder'); }
    finally { setReminding(null); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tasks', form);
      toast.success('Task assigned!');
      setShowModal(false);
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Work & KPI Management</h2></div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Assign Task</button>
      </div>

      <div className="flex gap-2">
        {['tasks', 'kpi'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === t ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}>
            {t === 'tasks' ? <span className="flex items-center gap-1.5"><SI d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" size={14} /> Task List</span> : <span className="flex items-center gap-1.5"><SI d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" size={14} /> KPI Overview</span>}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' ? (
        <Card>
          <div className="flex flex-wrap gap-3 mb-4">
            <select className="input-field w-auto" value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
          {tasks.length === 0 ? (
            <EmptyState icon={<SI d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" size={40} color="text-violet-400" />} title="No tasks" message="Assign work to employees."
              action={{ label: 'Assign Task', onClick: () => setShowModal(true) }} />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Deadline</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t._id}>
                      <td>
                        <p className="font-medium text-violet-900">{t.title}</p>
                        {t.description && <p className="text-xs text-violet-400 mt-0.5 truncate max-w-xs">{t.description}</p>}
                      </td>
                      <td>
                        <p className="font-medium">{t.assignedTo?.name}</p>
                        <p className="text-xs text-violet-400">{t.assignedTo?.employeeId}</p>
                      </td>
                      <td><Badge status={t.priority} /></td>
                      <td>{formatDate(t.deadline)}</td>
                      <td><Badge status={t.status} /></td>
                      <td>
                        {t.status !== 'completed' && (
                          <button
                            onClick={() => handleRemind(t._id)}
                            disabled={reminding === t._id}
                            title="Send reminder to employee"
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                          >
                            <SI d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={13} />
                            {reminding === t._id ? 'Sending...' : 'Remind'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {kpiData.length === 0 ? (
            <EmptyState icon={<SI d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" size={40} color="text-violet-400" />} title="No KPI data" message="Assign tasks to employees to see KPI overview." />
          ) : (
            kpiData.map(item => (
              <div key={item.employee._id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-violet-900">{item.employee.name}</p>
                    <p className="text-xs text-violet-500">{item.employee.employeeId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-bold text-golden-600">{item.completionRate}%</p>
                    <p className="text-xs text-violet-500">completion rate</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-violet-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-golden-500 rounded-full transition-all duration-700"
                    style={{ width: `${item.completionRate}%` }} />
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="text-violet-500">Total: <strong className="text-violet-900">{item.total}</strong></span>
                  <span className="text-green-600">Done: <strong>{item.completed}</strong></span>
                  <span className="text-golden-600">Active: <strong>{item.inProgress}</strong></span>
                  {item.overdue > 0 && <span className="text-red-600">Overdue: <strong>{item.overdue}</strong></span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign New Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="input-label">Task Title *</label>
            <input className="input-field" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Assign To *</label>
              <select className="input-field" required value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Deadline *</label>
            <input type="date" className="input-field" required value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Assigning...' : 'Assign Task'}</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRTasks;
