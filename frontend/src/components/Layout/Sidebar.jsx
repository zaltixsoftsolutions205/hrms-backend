import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../utils/helpers';

const Ic = ({ d, d2, circle, color = 'violet' }) => {
  const colors = {
    violet: 'bg-violet-100 text-violet-600',
    golden: 'bg-golden-100 text-golden-600',
    blue:   'bg-violet-100 text-violet-600',
    green:  'bg-golden-100 text-golden-600',
    red:    'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 ${colors[color]}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
        {circle && <circle cx={circle[0]} cy={circle[1]} r={circle[2]} />}
        <path d={d} />
        {d2 && <path d={d2} />}
      </svg>
    </span>
  );
};

const NAV_ICONS = {
  '/dashboard':      <Ic color="violet"  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  '/profile':        <Ic color="blue"    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  '/attendance':     <Ic color="green"   d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  '/leaves':         <Ic color="blue"    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  '/payslips':       <Ic color="golden"  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  '/tasks':          <Ic color="violet"  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  '/crm':            <Ic color="golden"  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
  '/hr/employees':   <Ic color="violet"  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  '/hr/attendance':  <Ic color="green"   d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  '/hr/leaves':      <Ic color="blue"    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7l2 2 4-4" />,
  '/hr/tasks':       <Ic color="violet"  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  '/hr/payslips':    <Ic color="golden"  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  '/admin/employees':   <Ic color="violet"  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  '/admin/departments': <Ic color="blue"    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  '/admin/attendance':  <Ic color="green"   d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  '/admin/leaves':      <Ic color="blue"    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  '/admin/tasks':       <Ic color="violet"  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  '/admin/payslips':    <Ic color="golden"  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  '/admin/policies':    <Ic color="green"   d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  '/admin/reports':     <Ic color="golden"  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  '/admin/crm':         <Ic color="golden"  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
  '/admin/finance':         <Ic color="green"   d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  '/admin/announcements':   <Ic color="violet"  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  '/admin/my-tasks':        <Ic color="violet"  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  '/admin/recruitment':     <Ic color="blue"    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
  '/admin/holidays':        <Ic color="blue"    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  '/admin/automation':      <Ic color="violet"  d="M13 10V3L4 14h7v7l9-11h-7z" />,
  '/team':              <Ic color="blue"    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  '/change-password':   <Ic color="red"     d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
};

const navConfig = {
  employee: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'My Profile' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/leaves', label: 'Leave Requests' },
    { path: '/payslips', label: 'Payslips' },
    { path: '/tasks', label: 'My Tasks' },
    { path: '/team', label: 'My Team' },
  ],
  sales: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'My Profile' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/leaves', label: 'Leave Requests' },
    { path: '/payslips', label: 'Payslips' },
    { path: '/tasks', label: 'My Tasks' },
    { path: '/team', label: 'My Team' },
    { path: '/crm', label: 'CRM — Leads' },
  ],
  hr: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/hr/employees', label: 'Employees' },
    { path: '/hr/attendance', label: 'Attendance' },
    { path: '/hr/leaves', label: 'Leave Approvals' },
    { path: '/hr/tasks', label: 'Work & KPI' },
    { path: '/hr/payslips', label: 'Payslips' },
    { path: '/admin/finance', label: 'Finance' },
    { path: '/admin/announcements', label: 'Announcements' },
    { path: '/admin/holidays', label: 'Holidays' },
    { path: '/profile', label: 'My Profile' },
    { path: '/leaves', label: 'My Leave' },
    { path: '/attendance', label: 'My Attendance' },
  ],
  admin: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'My Profile' },
    { path: '/admin/employees', label: 'Employees' },
    { path: '/admin/departments', label: 'Departments' },
    { path: '/admin/attendance', label: 'Attendance' },
    { path: '/admin/leaves', label: 'Leave Management' },
    { path: '/admin/tasks', label: 'Work & KPI' },
    { path: '/admin/payslips', label: 'Payroll' },
    { path: '/admin/policies', label: 'Leave Policies' },
    { path: '/admin/reports', label: 'Reports' },
    { path: '/admin/crm', label: 'CRM Analytics' },
    { path: '/admin/finance', label: 'Finance' },
    { path: '/admin/announcements', label: 'Announcements' },
    { path: '/admin/holidays', label: 'Holidays' },
    { path: '/admin/my-tasks', label: 'My Tasks' },
    { path: '/admin/recruitment', label: 'Recruitment' },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  let items = navConfig[user?.role] || [];

  // Grant recruitment access to specific employees
  if (user?.employeeId === 'ZSSE0023' && !items.some(i => i.path === '/admin/recruitment')) {
    items = [...items, { path: '/admin/recruitment', label: 'Recruitment' }];
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-violet-50/90 backdrop-blur-xl border-r border-violet-200 z-40 flex flex-col shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-4 h-14 flex items-center border-b border-violet-200">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Zaltix Soft Solutions" className="h-8 object-contain" style={{ filter: 'none' }} />
            <p className="text-violet-600 text-xs leading-snug">
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'hr' ? 'HR Manager' : user?.role === 'sales' ? 'Sales CRM' : 'Employee Portal'}
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {items.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {NAV_ICONS[item.path]}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info + Collapsible Menu */}
        <div className="border-t border-violet-200">
          {/* Collapsed actions */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden px-4 pt-3 space-y-0.5"
              >
                <NavLink to="/change-password" onClick={() => setUserMenuOpen(false)} className="nav-item text-xs">
                  {NAV_ICONS['/change-password']}
                  <span>Change Password</span>
                </NavLink>
                <button onClick={handleLogout} className="w-full nav-item text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  <Ic color="red" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User row — always visible, arrow toggles menu */}
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-violet-100/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-600 ring-2 ring-violet-300/50 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-violet-900 text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-violet-400 text-xs truncate">{user?.employeeId}</p>
            </div>
            <motion.svg
              animate={{ rotate: userMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-4 h-4 text-violet-400 flex-shrink-0"
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </motion.svg>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
