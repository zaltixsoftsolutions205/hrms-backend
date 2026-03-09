import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/UI/Spinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import AnnouncementWidget from '../../components/UI/AnnouncementWidget';
import HolidayWidget from '../../components/UI/HolidayWidget';
import toast from 'react-hot-toast';

/* ── Icon helper ── */
const DI = ({ d, d2, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

/* ── SVG presence circle ── */
const PresenceCircle = ({ present = 0, total = 0 }) => {
  const pct  = total > 0 ? present / total : 0;
  const r    = 15;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - pct);
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#dcfce7" strokeWidth="4" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="#16a34a" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round" transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="20" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#16a34a">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
};

const COLORS = ['#7C3AED', '#D97706', '#16a34a', '#dc2626'];

const priorityStyle = {
  high:   { bg: 'bg-gray-100',   text: 'text-gray-900',   label: 'High'   },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  low:    { bg: 'bg-gray-100',  text: 'text-gray-600',  label: 'Low'    },
};
const statusCycle = { 'not-started': 'in-progress', 'in-progress': 'completed', 'completed': 'not-started' };
const statusStyle = {
  'not-started': { dot: 'bg-gray-300',  label: 'To Do',       ring: 'ring-gray-300'  },
  'in-progress': { dot: 'bg-amber-400', label: 'In Progress', ring: 'ring-amber-400' },
  'completed':   { dot: 'bg-violet-500', label: 'Done',        ring: 'ring-violet-500' },
};

/* ── path constants ── */
const P = {
  users:      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  check:      "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  clock:      "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  clipboard:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h.01M12 12h.01M9 16h6",
  crm:        "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  sparkles:   "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  plus:       "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  calendar:   "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  clipCheck:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  card:       "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  building:   "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  doc:        "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  chart:      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  trash:      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  money:      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  client:     "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
};

/* ── Stat card ── */
const StatCard = ({ label, value, sub, icon, color, to, children }) => {
  const colors = {
    violet: { bar: 'bg-violet-600',  iconBg: 'bg-violet-100', iconText: 'text-violet-600', val: 'text-gray-900', sub: 'text-violet-400', lbl: 'text-violet-500' },
    green:  { bar: 'bg-violet-500',   iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  val: 'text-gray-900', sub: 'text-violet-500',  lbl: 'text-violet-600'  },
    amber:  { bar: 'bg-amber-500',   iconBg: 'bg-amber-100',  iconText: 'text-amber-600',  val: 'text-gray-900', sub: 'text-amber-500',  lbl: 'text-amber-600'  },
    blue:   { bar: 'bg-violet-500',    iconBg: 'bg-violet-100',   iconText: 'text-violet-600',   val: 'text-gray-900', sub: 'text-violet-500',   lbl: 'text-violet-600'   },
    red:    { bar: 'bg-gray-200',     iconBg: 'bg-gray-100',    iconText: 'text-gray-900',    val: 'text-gray-900', sub: 'text-gray-900',    lbl: 'text-gray-900'    },
    indigo: { bar: 'bg-violet-500',  iconBg: 'bg-violet-100', iconText: 'text-violet-600', val: 'text-gray-900', sub: 'text-violet-400', lbl: 'text-violet-600' },
  };
  const c = colors[color] || colors.violet;
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Colored top accent bar */}
      <div className={`h-1 flex-shrink-0 ${c.bar}`} />
      <div className="p-3 xl:p-4 flex flex-col flex-1 gap-2.5">
        {/* Label + icon row */}
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[9px] xl:text-[10px] font-bold uppercase tracking-wider leading-tight ${c.lbl}`}>{label}</p>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg} ${c.iconText}`}>
            {icon}
          </div>
        </div>
        {/* Value + sub + optional circle */}
        <div className="flex items-end justify-between gap-1 mt-auto">
          <div className="min-w-0">
            <p className={`text-xl xl:text-2xl font-extrabold leading-none ${c.val}`}>{value ?? '—'}</p>
            {sub && <p className={`text-[9px] xl:text-[10px] mt-1 font-medium ${c.sub}`}>{sub}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
};

/* ══════════════════════════════════════════════════════════ */

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [payroll, setPayroll]   = useState(null);
  const [crmReport, setCrmReport] = useState(null);
  const [clients, setClients]   = useState([]);
  const [finance, setFinance]       = useState(null);
  const [prevFinance, setPrevFinance] = useState(null);
  const [monthLeads, setMonthLeads] = useState({ total: 0, converted: 0 });
  const [loading, setLoading]   = useState(true);
  const [automationData, setAutomationData] = useState(null);

  /* task state */
  const [myTasks, setMyTasks]         = useState([]);
  const [taskFilter, setTaskFilter]   = useState('active');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm]       = useState({ title: '', priority: 'medium', deadline: '' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const fetchMyTasks = () =>
    api.get('/tasks/my').then(r => setMyTasks(r.data.tasks || [])).catch(() => {});

  useEffect(() => {
    const now      = new Date();
    const month    = now.getMonth() + 1;
    const year     = now.getFullYear();
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;

    Promise.all([
      api.get('/admin/dashboard-stats').then(r => setStats(r.data)).catch(() => {}),
      api.get(`/admin/reports/payroll?month=${month}&year=${year}`).then(r => setPayroll(r.data)).catch(() => {}),
      api.get('/admin/reports/crm').then(r => setCrmReport(r.data)).catch(() => {}),
      api.get('/clients').then(r => setClients(r.data || [])).catch(() => {}),
      api.get(`/finance/dashboard?month=${month}&year=${year}`).then(r => setFinance(r.data)).catch(() => {}),
      api.get(`/finance/dashboard?month=${prevMonth}&year=${prevYear}`).then(r => setPrevFinance(r.data)).catch(() => {}),
      api.get(`/leads?createdMonth=${month}&createdYear=${year}`)
        .then(r => {
          const leads = r.data?.leads || r.data || [];
          setMonthLeads({
            total:     leads.length,
            converted: leads.filter(l => l.status === 'converted').length,
          });
        }).catch(() => {}),
    ]).finally(() => setLoading(false));

    fetchMyTasks();
    api.get('/automation/dashboard').then(r => setAutomationData(r.data)).catch(() => {});
  }, []);

  /* task handlers */
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.deadline) return toast.error('Title and deadline required');
    setTaskSubmitting(true);
    try {
      await api.post('/tasks', {
        title: taskForm.title, priority: taskForm.priority,
        deadline: taskForm.deadline, assignedTo: user._id, description: '',
      });
      toast.success('Task added');
      setTaskForm({ title: '', priority: 'medium', deadline: '' });
      setShowTaskForm(false);
      fetchMyTasks();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setTaskSubmitting(false); }
  };

  const handleStatusToggle = async (task) => {
    const next = statusCycle[task.status];
    try {
      await api.put(`/tasks/${task._id}/status`, { status: next });
      setMyTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: next } : t));
    } catch { toast.error('Failed'); }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setMyTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filteredTasks = myTasks.filter(t => {
    if (taskFilter === 'active')    return t.status !== 'completed';
    if (taskFilter === 'completed') return t.status === 'completed';
    return true;
  });
  const isOverdue = (task) => task.status !== 'completed' && new Date(task.deadline) < new Date();

  /* derived values */
  const activeClients  = clients.filter(c => c.status === 'active').length || clients.length;
  const monthlyRevenue = finance?.totalIncome ?? null;
  const netProfit      = finance?.profit ?? null;
  const prevNetProfit  = prevFinance?.profit ?? null;
  const profitGrowth   = netProfit != null && prevNetProfit != null && prevNetProfit !== 0
    ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : null;
  const isGrowing      = profitGrowth != null ? profitGrowth >= 0 : null;
  const crmPieData = crmReport ? [
    { name: 'Converted',     value: crmReport.totalConverted ?? 0 },
    { name: 'Not Converted', value: (crmReport.totalLeads ?? 0) - (crmReport.totalConverted ?? 0) },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-violet-500 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-3 xl:px-5 space-y-5 animate-fade-in">

      {/* ── Banner ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-violet-950 to-violet-800 p-4 xl:p-5 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-violet-300 text-xs sm:text-sm font-medium tracking-wide uppercase">Administrator</p>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5 tracking-tight">Zaltix Overview</h2>
            <p className="text-violet-400 text-xs sm:text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Net Profit block */}
          <div className="sm:text-right flex-shrink-0">
            <p className="text-[11px] text-violet-300 uppercase tracking-wider font-semibold">Net Profit — This Month</p>
            <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${
              netProfit == null ? 'text-violet-300'
              : netProfit >= 0  ? 'text-violet-300' : 'text-gray-900'
            }`}>
              {netProfit != null ? formatCurrency(netProfit) : '—'}
            </p>
            {profitGrowth != null ? (
              <div className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isGrowing ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-200/20 text-gray-900'
              }`}>
                <span>{isGrowing ? '▲' : '▼'}</span>
                <span>{Math.abs(profitGrowth).toFixed(1)}% vs last month</span>
              </div>
            ) : (
              <p className="text-[11px] text-violet-500 mt-1">No prior month data</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Work Intelligence Summary ── */}
      {automationData && (automationData.summary?.totalOverdue > 0 || automationData.missingCheckouts?.length > 0 || automationData.staleLeads?.length > 0 || automationData.pendingDocs?.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className="glass-card p-3 xl:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 text-base">⚡</span>
              <div>
                <h3 className="font-bold text-violet-900 text-sm leading-none">Work Intelligence</h3>
                <p className="text-[10px] text-violet-400 mt-0.5">Auto-detected issues needing attention</p>
              </div>
            </div>
            <Link to="/admin/automation" className="text-xs font-semibold text-amber-600 hover:text-amber-700">View All →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Overdue Tasks',      value: automationData.summary?.totalOverdue,          icon: '⏰', color: automationData.summary?.totalOverdue > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200', link: '/admin/automation' },
              { label: 'Missing Checkouts',  value: automationData.missingCheckouts?.length ?? 0,  icon: '🕐', color: automationData.missingCheckouts?.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200', link: '/admin/automation' },
              { label: 'Stale CRM Leads',    value: automationData.staleLeads?.length ?? 0,        icon: '📞', color: automationData.staleLeads?.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200', link: '/crm' },
              { label: 'Pending Docs',       value: automationData.pendingDocs?.length ?? 0,       icon: '📄', color: automationData.pendingDocs?.length > 0 ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-green-50 text-green-700 border-green-200', link: '/admin/automation' },
            ].map(({ label, value, icon, color, link }) => (
              <Link key={label} to={link} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold hover:opacity-80 transition-opacity ${color}`}>
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-none">{value}</p>
                  <p className="text-[10px] font-medium leading-tight opacity-70 truncate">{label}</p>
                </div>
              </Link>
            ))}
          </div>
          {automationData.summary?.avgScore != null && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-xl border border-violet-100">
              <span className="text-base">📊</span>
              <p className="text-xs text-violet-700">Team avg score this week: <span className="font-bold">{automationData.summary.avgScore}%</span></p>
              <Link to="/admin/automation" className="ml-auto text-xs text-amber-600 font-semibold">See breakdown →</Link>
            </div>
          )}
        </motion.div>
      )}

      {/* ── MY TASKS ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-3 xl:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <DI d={P.clipboard} size={15} className="text-violet-600" />
            </span>
            <div>
              <h3 className="font-bold text-violet-900 text-sm leading-none">My Tasks</h3>
              <p className="text-[10px] text-violet-400 mt-0.5">
                {myTasks.filter(t => t.status !== 'completed').length} active &middot; {myTasks.filter(t => t.status === 'completed').length} done
              </p>
            </div>
          </div>
          <button onClick={() => setShowTaskForm(v => !v)} className="btn-primary btn-sm text-xs">
            {showTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {/* Add task form */}
        <AnimatePresence>
          {showTaskForm && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} onSubmit={handleAddTask} className="mb-3 overflow-hidden">
              <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 space-y-3">
                <input className="input-field text-sm" placeholder="Task title..."
                  value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} autoFocus />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label text-xs">Priority</label>
                    <select className="input-field text-sm" value={taskForm.priority}
                      onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label text-xs">Deadline *</label>
                    <input type="date" className="input-field text-sm" value={taskForm.deadline}
                      onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowTaskForm(false)} className="btn-secondary btn-sm">Cancel</button>
                  <button type="submit" disabled={taskSubmitting} className="btn-primary btn-sm">
                    {taskSubmitting ? 'Adding...' : 'Add Task'}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-3 border-b border-gray-100 pb-2">
          {[
            { key: 'active',    label: 'Active',    count: myTasks.filter(t => t.status !== 'completed').length },
            { key: 'completed', label: 'Done',      count: myTasks.filter(t => t.status === 'completed').length },
            { key: 'all',       label: 'All',       count: myTasks.length },
          ].map(f => (
            <button key={f.key} onClick={() => setTaskFilter(f.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                taskFilter === f.key ? 'bg-violet-600 text-white' : 'text-violet-500 hover:bg-violet-50'
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  taskFilter === f.key ? 'bg-white/20' : 'bg-violet-100 text-violet-600'
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-5 text-violet-300">
            <DI d={P.clipboard} size={28} className="mx-auto mb-1.5 text-violet-200" />
            <p className="text-xs text-violet-400">{taskFilter === 'completed' ? 'No completed tasks' : 'No active tasks — add one!'}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {filteredTasks.map(task => {
                const st  = statusStyle[task.status];
                const pr  = priorityStyle[task.priority] || priorityStyle.medium;
                const ov  = isOverdue(task);
                return (
                  <motion.div key={task._id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                      task.status === 'completed' ? 'bg-gray-50 border-gray-100 opacity-60'
                      : ov ? 'bg-gray-100 border-gray-100' : 'bg-white border-gray-100 hover:bg-violet-50/40'
                    }`}>
                    {/* Status toggle */}
                    <button onClick={() => handleStatusToggle(task)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ring-offset-1 hover:ring-2 ${st.ring} ${
                        task.status === 'completed' ? 'bg-violet-500 border-violet-500' : 'bg-white border-gray-300'
                      }`}>
                      {task.status === 'completed' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path d="M5 13l4 4L19 7" /></svg>
                      )}
                      {task.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </button>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-violet-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${pr.bg} ${pr.text}`}>{pr.label}</span>
                        <span className={`text-[10px] ${ov ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                          {ov ? '⚠ ' : ''}{formatDate(task.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Status pill */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline ${
                      task.status === 'completed' ? 'bg-violet-100 text-violet-700'
                      : task.status === 'in-progress' ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}>{st.label}</span>

                    {/* Delete */}
                    <button onClick={() => handleDeleteTask(task._id)}
                      className="text-gray-300 hover:text-gray-900 transition-colors flex-shrink-0 p-0.5 rounded">
                      <DI d={P.trash} size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── STATS CARDS ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3">

          {/* Total Employees */}
          <StatCard label="Total Employees" value={stats?.totalEmployees} color="violet"
            icon={<DI d={P.users} size={18} />} to="/admin/employees" />

          {/* Total Present — with circle */}
          <StatCard label="Total Present" color="green" to="/admin/attendance"
            icon={<DI d={P.check} size={18} />}
            value={stats?.presentToday ?? '—'}
            sub={`of ${stats?.totalEmployees ?? '?'} today`}>
            <PresenceCircle present={stats?.presentToday ?? 0} total={stats?.totalEmployees ?? 0} />
          </StatCard>

          {/* Active Clients */}
          <StatCard label="Active Clients" value={activeClients || '—'} color="blue"
            icon={<DI d={P.client} size={18} />} to="/crm" />

          {/* Monthly Revenue */}
          <StatCard label="Monthly Revenue" color="amber" to="/admin/finance"
            icon={<DI d={P.money} size={18} />}
            value={monthlyRevenue != null ? formatCurrency(monthlyRevenue) : '—'}
            sub="This month" />

          {/* Leads this month */}
          <StatCard label="Leads This Month" color="indigo" to="/admin/crm"
            icon={<DI d={P.crm} size={18} />}
            value={monthLeads.total || stats?.totalLeads || '—'}
            sub={stats?.totalLeads ? 'all-time leads' : undefined} />

          {/* Converted this month */}
          <StatCard label="Converted This Month" color="green" to="/admin/crm"
            icon={<DI d={P.sparkles} size={18} />}
            value={monthLeads.converted || stats?.convertedLeads || '—'}
            sub={stats?.convertedLeads ? 'all-time' : undefined} />

          {/* Leave Approval */}
          <StatCard label="Leave Approval" color="red" to="/admin/leaves"
            icon={<DI d={P.clock} size={18} />}
            value={stats?.pendingLeaves ?? '—'}
            sub="pending" />
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-3 xl:p-4">
        <h3 className="font-bold text-violet-900 text-sm mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[
            { label: 'Add Employee',   path: '/admin/employees',   icon: P.plus,      color: 'bg-violet-100 text-violet-700' },
            { label: 'Attendance',     path: '/admin/attendance',  icon: P.calendar,  color: 'bg-violet-100   text-violet-700'   },
            { label: 'Leave Approval', path: '/admin/leaves',      icon: P.clock,     color: 'bg-violet-100  text-violet-700'  },
            { label: 'Assign Tasks',   path: '/admin/tasks',       icon: P.clipCheck, color: 'bg-amber-100  text-amber-700'  },
            { label: 'Payroll',        path: '/admin/payslips',    icon: P.card,      color: 'bg-gray-100    text-gray-900'    },
            { label: 'Departments',    path: '/admin/departments', icon: P.building,  color: 'bg-violet-100    text-violet-700'    },
            { label: 'Policies',       path: '/admin/policies',    icon: P.doc,       color: 'bg-violet-100   text-violet-700'   },
            { label: 'Reports',        path: '/admin/reports',     icon: P.chart,     color: 'bg-amber-100  text-amber-700'  },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className={`${item.color} p-2.5 xl:p-3 rounded-xl flex flex-col items-center gap-1.5 hover:opacity-80 hover:-translate-y-0.5 transition-all`}>
              <DI d={item.icon} size={18} />
              <span className="text-[10px] xl:text-[11px] font-semibold text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── CHARTS ── */}
      <div className="grid lg:grid-cols-2 gap-4 items-stretch">
        {/* Payroll bar chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-3 xl:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-violet-900 text-sm">Payroll Summary</h3>
            <Link to="/admin/payslips" className="text-xs text-amber-600 font-semibold hover:text-amber-700">View →</Link>
          </div>
          {payroll?.payslips?.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={payroll.payslips.slice(0, 8).map(p => ({
                name: p.employee?.name?.split(' ')[0] || '?', net: p.netSalary,
              }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7C3AED' }} />
                <YAxis tick={{ fontSize: 9, fill: '#A78BFA' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #DDD6FE', fontSize: 11 }} />
                <Bar dataKey="net" fill="#7C3AED" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-violet-300 text-sm">No payslip data this month</div>
          )}
        </motion.div>

        {/* CRM pie */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-3 xl:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-violet-900 text-sm">CRM Conversion</h3>
            <Link to="/admin/crm" className="text-xs text-amber-600 font-semibold hover:text-amber-700">Analytics →</Link>
          </div>
          {crmPieData.some(d => d.value > 0) ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={crmPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {crmPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-violet-600 font-medium -mt-1">
                Conversion Rate: <span className="text-amber-600 font-bold">{crmReport?.overallConversionRate ?? 0}%</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-44 text-violet-300 text-sm">No CRM data available</div>
          )}
        </motion.div>
      </div>

      {/* ── Announcements + Holidays ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AnnouncementWidget />
        <HolidayWidget />
      </div>

    </div>
  );
};

export default AdminDashboard;
