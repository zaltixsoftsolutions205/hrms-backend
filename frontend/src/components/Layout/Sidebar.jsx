import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../utils/helpers';

const navConfig = {
  employee: [
    { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
    { path: '/attendance', label: 'Attendance', icon: '📅' },
    { path: '/leaves', label: 'Leave Requests', icon: '🌿' },
    { path: '/payslips', label: 'Payslips', icon: '💳' },
    { path: '/tasks', label: 'My Tasks', icon: '✅' },
  ],
  sales: [
    { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
    { path: '/attendance', label: 'Attendance', icon: '📅' },
    { path: '/leaves', label: 'Leave Requests', icon: '🌿' },
    { path: '/payslips', label: 'Payslips', icon: '💳' },
    { path: '/tasks', label: 'My Tasks', icon: '✅' },
    { path: '/crm', label: 'CRM — Leads', icon: '🎯' },
  ],
  hr: [
    { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { path: '/hr/employees', label: 'Employees', icon: '👥' },
    { path: '/hr/attendance', label: 'Attendance', icon: '📅' },
    { path: '/hr/leaves', label: 'Leave Approvals', icon: '🌿' },
    { path: '/hr/tasks', label: 'Work & KPI', icon: '✅' },
    { path: '/hr/payslips', label: 'Payslips', icon: '💳' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
    { path: '/leaves', label: 'My Leave', icon: '🏖️' },
    { path: '/attendance', label: 'My Attendance', icon: '🗓️' },
  ],
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
    { path: '/admin/employees', label: 'Employees', icon: '👥' },
    { path: '/admin/departments', label: 'Departments', icon: '🏢' },
    { path: '/admin/attendance', label: 'Attendance', icon: '📅' },
    { path: '/admin/leaves', label: 'Leave Management', icon: '🌿' },
    { path: '/admin/tasks', label: 'Work & KPI', icon: '✅' },
    { path: '/admin/payslips', label: 'Payroll', icon: '💳' },
    { path: '/admin/policies', label: 'Leave Policies', icon: '📋' },
    { path: '/admin/reports', label: 'Reports', icon: '📊' },
    { path: '/admin/crm', label: 'CRM Analytics', icon: '🎯' },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navConfig[user?.role] || [];

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
        className={`fixed top-0 left-0 h-full w-64 bg-violet-950 z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-violet-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-golden-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
              HR
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">HRMS System</h1>
              <p className="text-violet-400 text-xs mt-0.5">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'hr' ? 'HR Manager' : user?.role === 'sales' ? 'Sales CRM' : 'Employee Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {items.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="px-4 py-4 border-t border-violet-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-violet-400 text-xs truncate">{user?.employeeId}</p>
            </div>
          </div>
          <NavLink to="/change-password" className="nav-item text-xs mb-1">
            <span>🔐</span> Change Password
          </NavLink>
          <button onClick={handleLogout} className="w-full nav-item text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
