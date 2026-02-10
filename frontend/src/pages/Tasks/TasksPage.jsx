import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';
import { formatDate, daysUntil } from '../../utils/helpers';

const priorityColors = { low: 'text-gray-500', medium: 'text-golden-600', high: 'text-red-600' };

const TasksPage = () => {
  const [data, setData] = useState({ tasks: [], kpi: {} });
  const [selected, setSelected] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '' });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/tasks/my').then(r => setData(r.data)).catch(() => {});
  }, []);

  const filteredTasks = filter ? data.tasks.filter(t => t.status === filter) : data.tasks;

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/tasks/${selected._id}/status`, statusForm);
      setData(d => ({ ...d, tasks: d.tasks.map(t => t._id === res.data._id ? res.data : t) }));
      toast.success('Task updated!');
      setSelected(null);
      // Refresh KPI
      api.get('/tasks/my').then(r => setData(r.data)).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <KpiCard label="Total Tasks" value={data.kpi?.total ?? '—'} icon="📋" color="violet" />
        <KpiCard label="Completed" value={data.kpi?.completed ?? '—'} icon="✅" color="green" />
        <KpiCard label="In Progress" value={data.kpi?.inProgress ?? '—'} icon="🔄" color="golden" />
        <KpiCard label="Not Started" value={data.kpi?.notStarted ?? '—'} icon="⏳" color="violet" />
        <KpiCard label="Completion %" value={data.kpi?.completionRate !== undefined ? `${data.kpi.completionRate}%` : '—'} icon="📈" color="golden" />
      </div>

      {/* List */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-violet-900">My Tasks</h3>
          <div className="flex gap-2">
            {['', 'not-started', 'in-progress', 'completed'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? 'bg-violet-700 text-white' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}>
                {s === '' ? 'All' : s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState icon="✅" title="No tasks" message="You have no tasks assigned yet." />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const daysLeft = daysUntil(task.deadline);
              return (
                <motion.div key={task._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 border border-violet-100 rounded-xl hover:border-violet-300 transition-all cursor-pointer"
                  onClick={() => { setSelected(task); setStatusForm({ status: task.status, remarks: task.remarks || '' }); }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-violet-900 truncate">{task.title}</h4>
                        <Badge status={task.status} />
                        <span className={`text-xs font-semibold capitalize ${priorityColors[task.priority]}`}>↑ {task.priority}</span>
                      </div>
                      {task.description && <p className="text-sm text-gray-600 mb-2 line-clamp-1">{task.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-violet-500">
                        <span>Assigned by: {task.assignedBy?.name}</span>
                        <span>Due: {formatDate(task.deadline)}</span>
                        {daysLeft !== undefined && (
                          <span className={`font-semibold ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 2 ? 'text-golden-600' : 'text-green-600'}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today!' : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="btn-secondary btn-sm text-xs flex-shrink-0" onClick={e => { e.stopPropagation(); setSelected(task); setStatusForm({ status: task.status, remarks: task.remarks || '' }); }}>
                      Update
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Update Status Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Update Task'}>
        {selected && (
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            {selected.description && <p className="text-sm text-gray-600 bg-violet-50 p-3 rounded-xl">{selected.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-violet-50 rounded-xl"><p className="text-xs text-violet-500">Priority</p><p className="font-semibold capitalize mt-0.5">{selected.priority}</p></div>
              <div className="p-3 bg-violet-50 rounded-xl"><p className="text-xs text-violet-500">Deadline</p><p className="font-semibold mt-0.5">{formatDate(selected.deadline)}</p></div>
            </div>
            <div>
              <label className="input-label">Status</label>
              <select className="input-field" value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="input-label">Remarks (Optional)</label>
              <textarea className="input-field" rows={3} value={statusForm.remarks}
                onChange={e => setStatusForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Add any notes or progress update..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Update Task'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default TasksPage;
