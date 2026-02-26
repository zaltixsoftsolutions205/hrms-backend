import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { KpiCard } from '../../components/UI/Card';
import Spinner from '../../components/UI/Spinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import AnnouncementWidget from '../../components/UI/AnnouncementWidget';
import HolidayWidget from '../../components/UI/HolidayWidget';
import toast from 'react-hot-toast';

const DI = ({ d, d2, circle, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {circle && <circle cx={circle[0]} cy={circle[1]} r={circle[2]} />}
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
);

const usersD = "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";
const checkCircleD = "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
const clockD = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const clipboardListD = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h.01M12 12h.01M9 16h6";
const crmD = "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7";
const sparklesD = "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z";
const plusCircleD = "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z";
const calendarD = "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
const clipboardCheckD = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4";
const creditCardD = "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
const buildingD = "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4";
const documentD = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
const chartBarD = "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z";
const trashD = "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";

const COLORS = ['#7C3AED', '#D97706', '#16a34a', '#dc2626'];

const priorityStyle = {
  high:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'High' },
  medium: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Medium' },
  low:    { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Low' },
};

const statusCycle = { 'not-started': 'in-progress', 'in-progress': 'completed', 'completed': 'not-started' };
const statusStyle = {
  'not-started': { dot: 'bg-gray-300',    label: 'To Do',       ring: 'ring-gray-300' },
  'in-progress': { dot: 'bg-amber-400',   label: 'In Progress', ring: 'ring-amber-400' },
  'completed':   { dot: 'bg-green-500',   label: 'Done',        ring: 'ring-green-500' },
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [crmReport, setCrmReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Personal task manager
  const [myTasks, setMyTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState('active');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', deadline: '' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const fetchMyTasks = () => {
    api.get('/tasks/my').then(r => setMyTasks(r.data.tasks)).catch(() => {});
  };

  useEffect(() => {
    const now = new Date();
    Promise.all([
      api.get('/admin/dashboard-stats').then(r => setStats(r.data)).catch(() => {}),
      api.get(`/admin/reports/payroll?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(r => setPayroll(r.data)).catch(() => {}),
      api.get('/admin/reports/crm').then(r => setCrmReport(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
    fetchMyTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.deadline) return toast.error('Title and deadline required');
    setTaskSubmitting(true);
    try {
      await api.post('/tasks', {
        title: taskForm.title,
        priority: taskForm.priority,
        deadline: taskForm.deadline,
        assignedTo: user._id,
        description: '',
      });
      toast.success('Task added');
      setTaskForm({ title: '', priority: 'medium', deadline: '' });
      setShowTaskForm(false);
      fetchMyTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleStatusToggle = async (task) => {
    const next = statusCycle[task.status];
    try {
      await api.put(`/tasks/${task._id}/status`, { status: next });
      setMyTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: next } : t));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setMyTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredTasks = myTasks.filter(t => {
    if (taskFilter === 'active') return t.status !== 'completed';
    if (taskFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const isOverdue = (task) => task.status !== 'completed' && new Date(task.deadline) < new Date();

  const crmPieData = crmReport ? [
    { name: 'Converted', value: crmReport.totalConverted },
    { name: 'Not Converted', value: crmReport.totalLeads - crmReport.totalConverted },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-violet-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-5 animate-fade-in">
      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-violet-950 to-violet-800 p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-violet-300 text-sm">Administrator</p>
            <h2 className="text-xl sm:text-2xl font-bold mt-0.5">System Overview</h2>
            <p className="text-violet-300 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-violet-300">Monthly Payroll</p>
            <p className="text-xl sm:text-2xl font-bold text-golden-400">{payroll ? formatCurrency(payroll.summary?.totalNet) : '—'}</p>
            <p className="text-xs text-violet-400">{payroll?.summary?.totalEmployees || 0} employees</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-4 sm:p-5">
        <h3 className="font-bold text-violet-900 mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Add Employee', path: '/admin/employees', icon: plusCircleD, color: 'bg-violet-100 text-violet-700' },
            { label: 'Attendance', path: '/admin/attendance', icon: calendarD, color: 'bg-blue-100 text-blue-700' },
            { label: 'Leave Approvals', path: '/admin/leaves', icon: clockD, color: 'bg-green-100 text-green-700' },
            { label: 'Assign Tasks', path: '/admin/tasks', icon: clipboardCheckD, color: 'bg-golden-100 text-golden-700' },
            { label: 'Payroll', path: '/admin/payslips', icon: creditCardD, color: 'bg-red-100 text-red-700' },
            { label: 'Departments', path: '/admin/departments', icon: buildingD, color: 'bg-blue-100 text-blue-700' },
            { label: 'Leave Policies', path: '/admin/policies', icon: documentD, color: 'bg-green-100 text-green-700' },
            { label: 'Reports', path: '/admin/reports', icon: chartBarD, color: 'bg-golden-100 text-golden-700' },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className={`${item.color} p-2.5 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity`}>
              <DI d={item.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 items-stretch">
        <KpiCard label="Total Employees" value={stats?.totalEmployees ?? '—'} icon={<DI d={usersD} />} color="violet" to="/admin/employees" />
        <KpiCard label="Present Today" value={stats?.presentToday ?? '—'} icon={<DI d={checkCircleD} />} color="green" to="/admin/attendance" />
        <KpiCard label="Pending Leaves" value={stats?.pendingLeaves ?? '—'} icon={<DI d={clockD} />} color="golden" to="/admin/leaves" />
        <KpiCard label="Open Tasks" value={stats?.openTasks ?? '—'} icon={<DI d={clipboardListD} />} color="violet" to="/admin/tasks" />
        <KpiCard label="Total Leads" value={stats?.totalLeads ?? '—'} icon={<DI d={crmD} />} color="golden" to="/admin/crm" />
        <KpiCard label="Converted Leads" value={stats?.convertedLeads ?? '—'} icon={<DI d={sparklesD} />} color="green" to="/admin/crm" />
      </div>

      {/* Payroll + CRM charts */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Payroll Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-violet-900">Payroll Summary (This Month)</h3>
            <Link to="/admin/payslips" className="text-xs text-golden-600 font-semibold hover:text-golden-700">View →</Link>
          </div>
          {payroll?.payslips?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={payroll.payslips.slice(0, 8).map(p => ({ name: p.employee?.name?.split(' ')[0] || '?', net: p.netSalary }))}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7C3AED' }} />
                <YAxis tick={{ fontSize: 10, fill: '#A78BFA' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 10, border: '1px solid #DDD6FE', fontSize: 12 }} />
                <Bar dataKey="net" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-violet-400 text-sm">No payslip data for this month</div>
          )}
        </motion.div>

        {/* CRM Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-violet-900">CRM Conversion</h3>
            <Link to="/admin/crm" className="text-xs text-golden-600 font-semibold hover:text-golden-700">Analytics →</Link>
          </div>
          {crmPieData.some(d => d.value > 0) ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={crmPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {crmPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-sm text-violet-600 font-medium">Overall Conversion Rate: <span className="text-golden-600 font-bold">{crmReport?.overallConversionRate ?? 0}%</span></p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-violet-400 text-sm">No CRM data available</div>
          )}
        </motion.div>
      </div>

      {/* ── My Task Manager ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card p-4 sm:p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <DI d={clipboardListD} size={15} className="text-violet-600" />
            </span>
            <div>
              <h3 className="font-bold text-violet-900 leading-none">My Tasks</h3>
              <p className="text-[10px] text-violet-400 mt-0.5">
                {myTasks.filter(t => t.status !== 'completed').length} active · {myTasks.filter(t => t.status === 'completed').length} done
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTaskForm(v => !v)}
            className="btn-primary btn-sm"
          >
            {showTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {/* Add Task Form */}
        <AnimatePresence>
          {showTaskForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddTask}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-violet-50 rounded-xl p-3 sm:p-4 border border-violet-100 space-y-3">
                <div>
                  <input
                    className="input-field text-sm"
                    placeholder="Task title..."
                    value={taskForm.title}
                    onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-text text-xs">Priority</label>
                    <select
                      className="input-field text-sm"
                      value={taskForm.priority}
                      onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text text-xs">Deadline *</label>
                    <input
                      type="date"
                      className="input-field text-sm"
                      value={taskForm.deadline}
                      onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))}
                    />
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

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6 text-violet-400">
            <DI d={clipboardListD} size={32} className="mx-auto mb-2 text-violet-200" />
            <p className="text-sm">{taskFilter === 'completed' ? 'No completed tasks' : 'No active tasks — add one above!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredTasks.map(task => {
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
                        ? 'bg-red-50 border-red-100'
                        : 'bg-white border-gray-100 hover:bg-violet-50/40'
                    }`}
                  >
                    {/* Status toggle button */}
                    <button
                      onClick={() => handleStatusToggle(task)}
                      title={`Status: ${st.label} — click to advance`}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ring-offset-1 hover:ring-2 ${st.ring} ${
                        task.status === 'completed' ? 'bg-green-500 border-green-500' : `bg-white border-gray-300`
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
                        <span className={`text-[10px] ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                          {overdue ? '⚠ Overdue · ' : ''}{formatDate(task.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Status pill */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {st.label}
                    </span>

                    {/* Delete */}
                    <button onClick={() => handleDeleteTask(task._id)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                      <DI d={trashD} size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Announcements + Holidays */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <AnnouncementWidget />
        <HolidayWidget />
      </div>
    </div>
  );
};

export default AdminDashboard;
