import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { KpiCard } from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Spinner from '../../components/UI/Spinner';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const DI = ({ d, size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const plusCircleD = "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z";
const calendarD = "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
const clockD = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const clipboardCheckD = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4";
const creditCardD = "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
const usersD = "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";
const checkCircleD = "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
const clipboardListD = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h.01M12 12h.01M9 16h6";

const HRDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard-stats').then(r => setStats(r.data)).catch(() => {}),
      api.get('/leaves?status=pending').then(r => setPendingLeaves(r.data.slice(0, 5))).catch(() => {}),
      api.get('/tasks').then(r => setRecentTasks(r.data.slice(0, 5))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-5 animate-fade-in">
      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-violet-800 to-violet-600 p-4 sm:p-6 text-white shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold">HR Dashboard</h2>
        <p className="text-violet-200 text-xs sm:text-sm mt-1">Welcome back, {user?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-4 sm:p-5">
        <h3 className="font-bold text-violet-900 mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Link to="/hr/employees"
            className="bg-violet-100 text-violet-700 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
            <DI d={plusCircleD} className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">Add Employee</span>
          </Link>
          <Link to="/hr/attendance"
            className="bg-blue-100 text-blue-700 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
            <DI d={calendarD} className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">Attendance</span>
          </Link>
          <Link to="/hr/leaves"
            className="bg-green-100 text-green-700 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
            <DI d={clockD} className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">Leave Requests</span>
          </Link>
          <Link to="/hr/tasks"
            className="bg-golden-100 text-golden-700 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
            <DI d={clipboardCheckD} className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">Assign Work</span>
          </Link>
          <Link to="/hr/payslips"
            className="bg-red-100 text-red-700 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
            <DI d={creditCardD} className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">Payslip</span>
          </Link>
          <Link to="/attendance"
            className="bg-violet-100 text-violet-700 p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
            <DI d={calendarD} className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">My Attendance</span>
          </Link>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <KpiCard label="Total Employees" value={stats?.totalEmployees ?? '—'} icon={<DI d={usersD} />} color="violet" to="/hr/employees" />
        <KpiCard label="Present Today" value={stats?.presentToday ?? '—'} icon={<DI d={checkCircleD} />} color="green" to="/hr/attendance" />
        <KpiCard label="Pending Leaves" value={stats?.pendingLeaves ?? '—'} icon={<DI d={clockD} />} color="golden" to="/hr/leaves" />
        <KpiCard label="Open Tasks" value={stats?.openTasks ?? '—'} icon={<DI d={clipboardListD} />} color="violet" to="/hr/tasks" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Pending Leave Requests */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-4 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-bold text-violet-900">Pending Leave Requests</h3>
            <Link to="/hr/leaves" className="text-xs text-golden-600 font-semibold hover:text-golden-700">View All →</Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-violet-400">No pending requests</p>
              <Link to="/hr/leaves" className="text-xs text-golden-600 font-semibold mt-2 inline-block hover:text-golden-700">View All Leaves →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingLeaves.map(leave => (
                <Link key={leave._id} to="/hr/leaves"
                  className="flex items-center justify-between p-3 bg-golden-50/60 rounded-xl border border-golden-100 hover:bg-golden-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-violet-900 truncate">{leave.employee?.name}</p>
                    <p className="text-xs text-violet-500 capitalize">{leave.type} leave · {leave.totalDays} day(s)</p>
                    <p className="text-xs text-violet-400">{formatDate(leave.fromDate)} – {formatDate(leave.toDate)}</p>
                  </div>
                  <Badge status="pending" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Tasks */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-4 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-bold text-violet-900">Recent Tasks</h3>
            <Link to="/hr/tasks" className="text-xs text-golden-600 font-semibold hover:text-golden-700">Manage →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-violet-400">No tasks assigned yet</p>
              <Link to="/hr/tasks" className="text-xs text-golden-600 font-semibold mt-2 inline-block hover:text-golden-700">Assign Tasks →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => (
                <Link key={task._id} to="/hr/tasks"
                  className="flex items-center justify-between p-3 bg-violet-50/60 rounded-xl hover:bg-violet-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-violet-900 truncate">{task.title}</p>
                    <p className="text-xs text-violet-500">{task.assignedTo?.name} · Due {formatDate(task.deadline)}</p>
                  </div>
                  <Badge status={task.status} className="ml-2 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HRDashboard;
