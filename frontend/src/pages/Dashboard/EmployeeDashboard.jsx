import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { KpiCard } from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Spinner from '../../components/UI/Spinner';
import { formatDate, formatCurrency, getInitials, monthName } from '../../utils/helpers';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [payslip, setPayslip] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [crmStats, setCrmStats] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkLoading, setCheckLoading] = useState(false);

  const fetchDashboard = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const promises = [
      api.get(`/attendance/my?month=${month}&year=${year}`).then(r => {
        setAttendance(r.data.summary);
        setTodayRecord(r.data.todayRecord);
      }).catch(() => {}),
      api.get('/leaves/my').then(r => setLeaves(r.data)).catch(() => {}),
      api.get('/payslips/my').then(r => setPayslip(r.data[0] || null)).catch(() => {}),
      api.get('/tasks/my').then(r => setTasks(r.data.kpi)).catch(() => {}),
    ];

    if (user?.role === 'sales') {
      promises.push(api.get('/leads').then(r => setCrmStats(r.data.stats)).catch(() => {}));
    }

    Promise.all(promises).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, [user?.role]);

  const handleCheckIn = async () => {
    setCheckLoading(true);
    try {
      await api.post('/attendance/check-in');
      toast.success('Checked in successfully!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckLoading(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Checked out successfully!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const cardVariants = { hidden: { opacity: 0, y: 16 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3 } }) };

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
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 to-violet-700 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-violet-200 text-sm">{getGreeting()},</p>
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-violet-300 text-sm">{user?.designation || user?.role} • {user?.department?.name || 'No Department'} • {user?.employeeId}</p>
          </div>
        </div>
        {/* Today check-in status + action buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
            todayRecord ? 'bg-green-400/20 text-green-200' : 'bg-white/10 text-violet-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${todayRecord ? 'bg-green-300' : 'bg-violet-400'}`} />
            {todayRecord ? `Checked in at ${todayRecord.checkIn}${todayRecord.checkOut ? ` • Out: ${todayRecord.checkOut}` : ''}` : 'Not checked in today'}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {!todayRecord?.checkIn && (
              <button onClick={handleCheckIn} disabled={checkLoading}
                className="px-4 py-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition-colors">
                {checkLoading ? '...' : 'Check In'}
              </button>
            )}
            {todayRecord?.checkIn && !todayRecord?.checkOut && (
              <button onClick={handleCheckOut} disabled={checkLoading}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition-colors">
                {checkLoading ? '...' : 'Check Out'}
              </button>
            )}
            {todayRecord?.checkIn && todayRecord?.checkOut && (
              <span className="px-3 py-1.5 bg-green-400/20 text-green-200 rounded-lg text-xs font-semibold">Day Complete</span>
            )}
            <Link to="/attendance" className="text-xs text-golden-300 hover:text-golden-200 font-medium underline underline-offset-2">
              View Attendance →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-5">
        <h3 className="font-bold text-violet-900 mb-4">Quick Actions</h3>
        <div className={`grid grid-cols-2 ${user?.role === 'sales' ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3`}>
          <Link to="/leaves"
            className="bg-green-100 text-green-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🌿</span>
            <span className="text-xs font-semibold text-center">Apply Leave</span>
          </Link>
          <Link to="/attendance"
            className="bg-violet-100 text-violet-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">📅</span>
            <span className="text-xs font-semibold text-center">My Attendance</span>
          </Link>
          <Link to="/tasks"
            className="bg-blue-100 text-blue-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">✅</span>
            <span className="text-xs font-semibold text-center">My Tasks</span>
          </Link>
          <Link to="/payslips"
            className="bg-golden-100 text-golden-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">💳</span>
            <span className="text-xs font-semibold text-center">View Payslips</span>
          </Link>
          {user?.role === 'sales' && (
            <Link to="/crm"
              className="bg-violet-100 text-violet-700 p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-semibold text-center">CRM Leads</span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <KpiCard label="Days Present (Month)" value={attendance?.present ?? '—'} icon="✅" color="green" />
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <KpiCard label="Days Absent" value={attendance?.absent ?? '—'} icon="❌" color="red" />
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <KpiCard label="Tasks Completed" value={tasks?.completed ?? '—'} icon="✅" color="violet" />
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <KpiCard label="Leave Balance (Casual)" value={leaves?.balance?.casual?.remaining ?? '—'} icon="🌿" color="green" />
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Leave Balance */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-violet-900">Leave Balance</h3>
            <Link to="/leaves" className="text-xs text-golden-600 hover:text-golden-700 font-semibold">Apply / View All →</Link>
          </div>
          {leaves && Object.keys(leaves.balance).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(leaves.balance).map(([type, bal]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-violet-700 capitalize font-medium">{type}</span>
                    <span className="text-violet-500 text-xs">{bal.used}/{bal.total} used</span>
                  </div>
                  <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${bal.total > 0 ? (bal.used / bal.total) * 100 : 0}%` }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" />
                  </div>
                  <p className="text-xs text-right text-green-600 mt-0.5 font-medium">{bal.remaining} remaining</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-violet-400">
              <p className="text-2xl mb-2">🌿</p>
              <p className="text-sm">No leave data available</p>
              <Link to="/leaves" className="text-xs text-golden-600 font-semibold mt-2 inline-block hover:text-golden-700">Apply Leave →</Link>
            </div>
          )}
        </motion.div>

        {/* Latest Payslip */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-violet-900">Latest Payslip</h3>
            <Link to="/payslips" className="text-xs text-golden-600 hover:text-golden-700 font-semibold">View All →</Link>
          </div>
          {payslip ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-violet-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-violet-900">{monthName(payslip.month)} {payslip.year}</p>
                  <p className="text-xs text-violet-500 mt-0.5">Net Pay</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-golden-600">{formatCurrency(payslip.netSalary)}</p>
                  <Badge status={payslip.status} className="text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-green-50 rounded-lg"><span className="text-gray-500">Gross</span><p className="font-semibold text-green-700">{formatCurrency(payslip.grossSalary)}</p></div>
                <div className="p-2 bg-red-50 rounded-lg"><span className="text-gray-500">Deductions</span><p className="font-semibold text-red-600">{formatCurrency(payslip.deductions?.reduce((s,d)=>s+d.amount,0))}</p></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-violet-400">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-sm">No payslips yet</p>
              <Link to="/payslips" className="text-xs text-golden-600 font-semibold mt-2 inline-block hover:text-golden-700">View Payslips →</Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* CRM Stats for Sales */}
      {user?.role === 'sales' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-violet-900">CRM Overview</h3>
            <Link to="/crm" className="text-xs text-golden-600 hover:text-golden-700 font-semibold">Manage Leads →</Link>
          </div>
          {crmStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Leads', value: crmStats.total, icon: '👥', color: 'violet' },
                { label: 'Interested', value: crmStats.interested, icon: '⭐', color: 'golden' },
                { label: 'Converted', value: crmStats.converted, icon: '🎉', color: 'green' },
                { label: 'Conversion %', value: `${crmStats.conversionRate}%`, icon: '📈', color: 'golden' },
              ].map(item => <KpiCard key={item.label} {...item} />)}
            </div>
          ) : (
            <div className="text-center py-6 text-violet-400">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm">No CRM data available</p>
              <Link to="/crm" className="text-xs text-golden-600 font-semibold mt-2 inline-block hover:text-golden-700">Add Leads →</Link>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
