import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

const priorityStyle = {
  high:   { bg: 'bg-gray-100',   text: 'text-gray-900',   label: 'High' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  low:    { bg: 'bg-gray-100',  text: 'text-gray-600',  label: 'Low' },
};

const statusCycle = { 'not-started': 'in-progress', 'in-progress': 'completed', 'completed': 'not-started' };
const statusStyle = {
  'not-started': { dot: 'bg-gray-300',  label: 'To Do',       ring: 'ring-gray-300' },
  'in-progress': { dot: 'bg-amber-400', label: 'In Progress', ring: 'ring-amber-400' },
  'completed':   { dot: 'bg-violet-500', label: 'Done',        ring: 'ring-violet-500' },
};

const trashD = "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
const clipboardD = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
const bellD = "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";

const DI = ({ d, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const AdminMyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium', deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reminding, setReminding] = useState(null);

  const fetchTasks = () => {
    api.get('/tasks/my')
      .then(r => setTasks(r.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.deadline) return toast.error('Title and deadline required');
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        title: form.title,
        priority: form.priority,
        deadline: form.deadline,
        assignedTo: user._id,
        description: '',
      });
      toast.success('Task added');
      setForm({ title: '', priority: 'medium', deadline: '' });
      setShowForm(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (task) => {
    const next = statusCycle[task.status];
    try {
      await api.put(`/tasks/${task._id}/status`, { status: next });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: next } : t));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleRemind = async (task) => {
    setReminding(task._id);
    try {
      const res = await api.post(`/tasks/${task._id}/reminder`);
      toast.success(res.data.message || 'Reminder sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setReminding(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const isOverdue = (t) => t.status !== 'completed' && new Date(t.deadline) < new Date();

  const tabs = [
    { key: 'active',    label: 'Active',    count: tasks.filter(t => t.status !== 'completed').length },
    { key: 'completed', label: 'Done',      count: tasks.filter(t => t.status === 'completed').length },
    { key: 'all',       label: 'All',       count: tasks.length },
  ];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Tasks</h2>
          <p className="page-subtitle">
            {tasks.filter(t => t.status !== 'completed').length} active &middot; {tasks.filter(t => t.status === 'completed').length} completed
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary btn-sm">
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-card p-4">
            <h3 className="font-bold text-violet-900 mb-4">New Task</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label-text">Title *</label>
                <input
                  className="input-field"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Priority</label>
                  <select className="input-field" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Deadline *</label>
                  <input type="date" className="input-field" value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active',      count: tasks.filter(t => t.status !== 'completed').length, bg: 'bg-violet-50', text: 'text-violet-700' },
          { label: 'Completed',   count: tasks.filter(t => t.status === 'completed').length, bg: 'bg-violet-50',  text: 'text-violet-700' },
          { label: 'Overdue',     count: tasks.filter(t => isOverdue(t)).length,              bg: 'bg-gray-100',    text: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.bg} flex items-center justify-between`}>
            <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
            <span className={`text-xl font-bold ${s.text}`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs + task list */}
      <div className="glass-card p-4 sm:p-5">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-100 pb-3">
          {tabs.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-violet-600 text-white' : 'text-violet-500 hover:bg-violet-50'
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f.key ? 'bg-white/20' : 'bg-violet-100 text-violet-600'
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-sm text-violet-400 py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-violet-400">
            <DI d={clipboardD} size={36} className="mx-auto mb-2 text-violet-200" />
            <p className="text-sm">{filter === 'completed' ? 'No completed tasks yet' : 'No active tasks — add one!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map(task => {
                const st = statusStyle[task.status];
                const pr = priorityStyle[task.priority] || priorityStyle.medium;
                const overdue = isOverdue(task);
                return (
                  <motion.div key={task._id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      task.status === 'completed'
                        ? 'bg-gray-50 border-gray-100 opacity-70'
                        : overdue
                        ? 'bg-gray-100 border-gray-100'
                        : 'bg-white border-gray-100 hover:bg-violet-50/40'
                    }`}
                  >
                    {/* Status toggle */}
                    <button
                      onClick={() => handleStatusToggle(task)}
                      title={`${st.label} — click to advance`}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all hover:ring-2 ring-offset-1 ${st.ring} ${
                        task.status === 'completed' ? 'bg-violet-500 border-violet-500' : 'bg-white border-gray-300'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {task.status === 'in-progress' && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </button>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-violet-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${pr.bg} ${pr.text}`}>
                          {pr.label}
                        </span>
                        <span className={`text-[10px] ${overdue ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                          {overdue ? '⚠ Overdue · ' : ''}{formatDate(task.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Status pill */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-violet-100 text-violet-700' :
                      task.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {st.label}
                    </span>

                    {/* Remind */}
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleRemind(task)}
                        disabled={reminding === task._id}
                        title="Send reminder notification"
                        className="text-gray-300 hover:text-amber-500 transition-colors flex-shrink-0 disabled:opacity-40"
                      >
                        <DI d={bellD} size={14} className={reminding === task._id ? 'animate-pulse text-amber-400' : ''} />
                      </button>
                    )}

                    {/* Delete */}
                    <button onClick={() => handleDelete(task._id)}
                      className="text-gray-300 hover:text-gray-900 transition-colors flex-shrink-0 ml-1">
                      <DI d={trashD} size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMyTasks;
