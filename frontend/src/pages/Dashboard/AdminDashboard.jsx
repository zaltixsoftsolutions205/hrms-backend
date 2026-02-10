import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';
import { KpiCard } from '../../components/UI/Card';
import Spinner from '../../components/UI/Spinner';
import { formatCurrency } from '../../utils/helpers';

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
        <KpiCard label="Total Employees" value={stats?.totalEmployees ?? '—'} icon="👥" color="violet" />
        <KpiCard label="Present Today" value={stats?.presentToday ?? '—'} icon="✅" color="green" />
        <KpiCard label="Pending Leaves" value={stats?.pendingLeaves ?? '—'} icon="🌿" color="golden" />
        <KpiCard label="Open Tasks" value={stats?.openTasks ?? '—'} icon="📋" color="violet" />
        <KpiCard label="Total Leads" value={stats?.totalLeads ?? '—'} icon="🎯" color="golden" />
        <KpiCard label="Converted Leads" value={stats?.convertedLeads ?? '—'} icon="🎉" color="green" />
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
            { label: 'Add Employee', path: '/admin/employees', icon: '➕', color: 'bg-violet-100 text-violet-700' },
            { label: 'Attendance', path: '/admin/attendance', icon: '📅', color: 'bg-blue-100 text-blue-700' },
            { label: 'Leave Approvals', path: '/admin/leaves', icon: '🌿', color: 'bg-green-100 text-green-700' },
            { label: 'Assign Tasks', path: '/admin/tasks', icon: '✅', color: 'bg-golden-100 text-golden-700' },
            { label: 'Payroll', path: '/admin/payslips', icon: '💳', color: 'bg-red-100 text-red-700' },
            { label: 'Departments', path: '/admin/departments', icon: '🏢', color: 'bg-blue-100 text-blue-700' },
            { label: 'Leave Policies', path: '/admin/policies', icon: '📋', color: 'bg-green-100 text-green-700' },
            { label: 'Reports', path: '/admin/reports', icon: '📊', color: 'bg-golden-100 text-golden-700' },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className={`${item.color} p-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-80 transition-opacity`}>
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
