import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { KpiCard } from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Spinner from '../../components/UI/Spinner';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-violet-800 to-violet-600 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">HR Dashboard</h2>
        <p className="text-violet-200 text-sm mt-1">Welcome back, {user?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card p-5">
        <h3 className="font-bold text-violet-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link to="/hr/employees"
            className="bg-violet-100 text-violet-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">➕</span>
            <span className="text-xs font-semibold text-center">Add Employee</span>
          </Link>
          <Link to="/hr/attendance"
            className="bg-blue-100 text-blue-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">📅</span>
            <span className="text-xs font-semibold text-center">View Attendance</span>
          </Link>
          <Link to="/hr/leaves"
            className="bg-green-100 text-green-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🌿</span>
            <span className="text-xs font-semibold text-center">Leave Requests</span>
          </Link>
          <Link to="/hr/tasks"
            className="bg-golden-100 text-golden-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">✅</span>
            <span className="text-xs font-semibold text-center">Assign Work</span>
          </Link>
          <Link to="/hr/payslips"
            className="bg-red-100 text-red-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">💳</span>
            <span className="text-xs font-semibold text-center">Generate Payslip</span>
          </Link>
          <Link to="/attendance"
            className="bg-violet-100 text-violet-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🗓️</span>
            <span className="text-xs font-semibold text-center">My Attendance</span>
          </Link>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Employees" value={stats?.totalEmployees ?? '—'} icon="👥" color="violet" />
        <KpiCard label="Present Today" value={stats?.presentToday ?? '—'} icon="✅" color="green" />
        <KpiCard label="Pending Leaves" value={stats?.pendingLeaves ?? '—'} icon="🌿" color="golden" />
        <KpiCard label="Open Tasks" value={stats?.openTasks ?? '—'} icon="📋" color="violet" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Pending Leave Requests */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
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
                  <div>
                    <p className="text-sm font-semibold text-violet-900">{leave.employee?.name}</p>
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
          className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
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
