import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

// ── Duration presets ──────────────────────────────────────────────────────────
const DURATION_OPTS = [
  { label: 'No timer',  value: '' },
  { label: '15 min',    value: 15 },
  { label: '30 min',    value: 30 },
  { label: '1 hour',    value: 60 },
  { label: '2 hours',   value: 120 },
  { label: '4 hours',   value: 240 },
  { label: '8 hours',   value: 480 },
  { label: '1 day',     value: 1440 },
  { label: '2 days',    value: 2880 },
  { label: '3 days',    value: 4320 },
  { label: '1 week',    value: 10080 },
];

const fmtDuration = (mins) => {
  if (!mins) return null;
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${mins / 60}h`;
  return `${Math.round(mins / 1440)}d`;
};

// ── Live countdown ─────────────────────────────────────────────────────────────
function useCountdown(startedAt, durationMins) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!startedAt || !durationMins) { setRemaining(null); return; }
    const tick = () => {
      const endsAt = new Date(startedAt).getTime() + durationMins * 60000;
      const diff = endsAt - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [startedAt, durationMins]);
  return remaining;
}

function CountdownBadge({ startedAt, durationMins }) {
  const ms = useCountdown(startedAt, durationMins);
  if (ms === null) return null;
  if (ms === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">Expired</span>;
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pct = Math.max(0, (ms / (durationMins * 60000)) * 100);
  const urgent = pct < 20;
  const label = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${urgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-violet-100 text-violet-700'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-2.5 h-2.5"><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg>
      {label}
    </span>
  );
}

// ── Style maps ─────────────────────────────────────────────────────────────────
const priorityStyle = {
  high:   { bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-400',    label: 'High' },
  medium: { bg: 'bg-amber-50',  text: 'text-amber-700', dot: 'bg-amber-400',  label: 'Medium' },
  low:    { bg: 'bg-gray-100',  text: 'text-gray-500',  dot: 'bg-gray-300',   label: 'Low' },
};
const statusStyle = {
  'not-started': { dot: 'bg-gray-300',   label: 'To Do',       ring: 'ring-gray-300',  pill: 'bg-gray-100 text-gray-500' },
  'in-progress': { dot: 'bg-amber-400',  label: 'In Progress', ring: 'ring-amber-400', pill: 'bg-amber-100 text-amber-700' },
  'completed':   { dot: 'bg-violet-500', label: 'Done',        ring: 'ring-violet-500',pill: 'bg-violet-100 text-violet-700' },
};
const statusCycle = { 'not-started': 'in-progress', 'in-progress': 'completed', 'completed': 'not-started' };

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
  const [form, setForm] = useState({ title: '', priority: 'medium', deadline: '', duration: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reminding, setReminding] = useState(null);
  const [activeFocus, setActiveFocus] = useState(null); // currently locked timed task

  const fetchTasks = () => {
    api.get('/tasks/my')
      .then(r => setTasks(r.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchActiveFocus = () => {
    api.get('/tasks/active-self').then(r => setActiveFocus(r.data.active)).catch(() => {});
  };

  useEffect(() => {
    fetchTasks();
    fetchActiveFocus();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.deadline) return toast.error('Title and deadline required');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        priority: form.priority,
        deadline: form.deadline,
        assignedTo: user._id,
        description: '',
      };
      if (form.duration) payload.duration = Number(form.duration);

      await api.post('/tasks', payload);
      toast.success(form.duration ? `Task started with ${fmtDuration(Number(form.duration))} timer!` : 'Task added');
      setForm({ title: '', priority: 'medium', deadline: '', duration: '' });
      setShowForm(false);
      fetchTasks();
      fetchActiveFocus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add task';
      toast.error(msg, { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (task) => {
    const next = statusCycle[task.status];
    try {
      await api.put(`/tasks/${task._id}/status`, { status: next });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: next, startedAt: next === 'in-progress' && !t.startedAt ? new Date().toISOString() : t.startedAt } : t));
      if (next === 'completed' && activeFocus?._id === task._id) fetchActiveFocus();
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
    } finally { setReminding(null); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      if (activeFocus?._id === id) setActiveFocus(null);
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
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

  const focusLocked = !!activeFocus && form.duration !== '';

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4 animate-fade-in">

      {/* Focus Lock Banner */}
      <AnimatePresence>
        {activeFocus && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 truncate">Focus: {activeFocus.title}</p>
              <p className="text-xs text-amber-600">Timer active — complete this before starting a new timed task</p>
            </div>
            <CountdownBadge startedAt={activeFocus.startedAt} durationMins={activeFocus.duration} />
          </motion.div>
        )}
      </AnimatePresence>

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
            className="glass-card p-4 sm:p-5">
            <h3 className="font-bold text-violet-900 mb-4 flex items-center gap-2">
              <DI d="M12 4v16m8-8H4" size={16} className="text-violet-500" />
              New Task
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="input-label">Title *</label>
                <input className="input-field" placeholder="What needs to be done?"
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Priority</label>
                  <select className="input-field" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Deadline *</label>
                  <input type="date" className="input-field" value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">
                    Duration / Timer
                    <span className="ml-1 text-[10px] text-violet-400 font-normal">(optional)</span>
                  </label>
                  <select className="input-field" value={form.duration}
                    onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}>
                    {DURATION_OPTS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration info */}
              {form.duration && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${focusLocked ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-violet-50 border border-violet-100 text-violet-700'}`}>
                  <DI d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={14} className="flex-shrink-0 mt-0.5" />
                  {focusLocked
                    ? `You have an active task "${activeFocus.title}" still running. Finish it before starting a new timed task.`
                    : `Task will auto-start immediately. Reminders: ${Number(form.duration) <= 1440 ? 'once when timer expires' : 'every 3 hours until completed'}.`
                  }
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={submitting || focusLocked} className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Adding...' : form.duration ? '▶ Start Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active',    count: tasks.filter(t => t.status !== 'completed').length,   bg: 'bg-violet-50',  text: 'text-violet-700' },
          { label: 'Completed', count: tasks.filter(t => t.status === 'completed').length,    bg: 'bg-violet-50',  text: 'text-violet-700' },
          { label: 'Overdue',   count: tasks.filter(t => isOverdue(t)).length,                bg: 'bg-red-50',     text: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 sm:p-4 ${s.bg} flex items-center justify-between`}>
            <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
            <span className={`text-2xl font-bold ${s.text}`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs + task list */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex gap-1 mb-4 border-b border-violet-100 pb-3">
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

        {loading ? (
          <p className="text-center text-sm text-violet-400 py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-violet-400">
            <DI d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">{filter === 'completed' ? 'No completed tasks yet' : 'No active tasks — add one!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map(task => {
                const st  = statusStyle[task.status];
                const pr  = priorityStyle[task.priority] || priorityStyle.medium;
                const overdue = isOverdue(task);
                const hasDuration = !!task.duration && task.status === 'in-progress';
                const isFocus = activeFocus?._id === task._id;
                return (
                  <motion.div key={task._id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                    className={`p-3 sm:p-4 rounded-xl border transition-colors ${
                      task.status === 'completed' ? 'bg-gray-50 border-gray-100 opacity-70'
                      : isFocus ? 'bg-amber-50 border-amber-200'
                      : overdue ? 'bg-red-50/50 border-red-100'
                      : 'bg-white border-violet-100 hover:bg-violet-50/40'
                    }`}>
                    <div className="flex items-start gap-3">
                      {/* Status toggle */}
                      <button onClick={() => handleStatusToggle(task)}
                        title={`${st.label} — click to advance`}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all hover:ring-2 ring-offset-1 mt-0.5 ${st.ring} ${
                          task.status === 'completed' ? 'bg-violet-500 border-violet-500' : 'bg-white border-gray-300'
                        }`}>
                        {task.status === 'completed' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path d="M5 13l4 4L19 7" /></svg>
                        )}
                        {task.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-violet-900'}`}>
                            {task.title}
                          </p>
                          {isFocus && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">FOCUS</span>}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Priority */}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${pr.bg} ${pr.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pr.dot}`} />{pr.label}
                          </span>
                          {/* Status pill */}
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${st.pill}`}>{st.label}</span>
                          {/* Deadline */}
                          <span className={`text-[10px] ${overdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                            {overdue ? '⚠ ' : ''}{formatDate(task.deadline)}
                          </span>
                          {/* Duration label */}
                          {task.duration && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-600">
                              ⏱ {fmtDuration(task.duration)}
                            </span>
                          )}
                          {/* Live countdown */}
                          {hasDuration && (
                            <CountdownBadge startedAt={task.startedAt} durationMins={task.duration} />
                          )}
                        </div>

                        {/* Progress bar for timed tasks */}
                        {hasDuration && task.startedAt && (() => {
                          const pct = Math.max(0, Math.min(100,
                            ((Date.now() - new Date(task.startedAt).getTime()) / (task.duration * 60000)) * 100
                          ));
                          return (
                            <div className="mt-2 h-1 bg-violet-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-violet-400'}`}
                              />
                            </div>
                          );
                        })()}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {task.status !== 'completed' && (
                          <button onClick={() => handleRemind(task)} disabled={reminding === task._id}
                            title="Send reminder"
                            className="p-1 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-40">
                            <DI d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={14} className={reminding === task._id ? 'animate-pulse text-amber-400' : ''} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(task._id)}
                          className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <DI d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} />
                        </button>
                      </div>
                    </div>
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
