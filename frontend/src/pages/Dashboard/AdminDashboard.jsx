import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';
import { KpiCard } from '../../components/UI/Card';
import Spinner from '../../components/UI/Spinner';
import { formatCurrency } from '../../utils/helpers';

const DI = ({ d, d2, circle, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
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

const COLORS = ['#7C3AED', '#D97706', '#16a34a', '#dc2626'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [crmReport, setCrmReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      api.get('/admin/dashboard-stats').then(r => setStats(r.data)).catch(() => {}),
      api.get(`/admin/reports/payroll?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(r => setPayroll(r.data)).catch(() => {}),
      api.get('/admin/reports/crm').then(r => setCrmReport(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-violet-950 to-violet-800 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-violet-300 text-sm">Administrator</p>
            <h2 className="text-2xl font-bold mt-0.5">System Overview</h2>
            <p className="text-violet-300 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-violet-300">Monthly Payroll</p>
            <p className="text-2xl font-bold text-golden-400">{payroll ? formatCurrency(payroll.summary?.totalNet) : '—'}</p>
            <p className="text-xs text-violet-400">{payroll?.summary?.totalEmployees || 0} employees</p>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Employees" value={stats?.totalEmployees ?? '—'} icon={<DI d={usersD} />} color="violet" />
        <KpiCard label="Present Today" value={stats?.presentToday ?? '—'} icon={<DI d={checkCircleD} />} color="green" />
        <KpiCard label="Pending Leaves" value={stats?.pendingLeaves ?? '—'} icon={<DI d={clockD} />} color="golden" />
        <KpiCard label="Open Tasks" value={stats?.openTasks ?? '—'} icon={<DI d={clipboardListD} />} color="violet" />
        <KpiCard label="Total Leads" value={stats?.totalLeads ?? '—'} icon={<DI d={crmD} />} color="golden" />
        <KpiCard label="Converted Leads" value={stats?.convertedLeads ?? '—'} icon={<DI d={sparklesD} />} color="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Payroll Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5">
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
          className="glass-card p-5">
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

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card p-5">
        <h3 className="font-bold text-violet-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
              className={`${item.color} p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity`}>
              <DI d={item.icon} size={24} />
              <span className="text-xs font-semibold text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
