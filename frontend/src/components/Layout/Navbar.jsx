import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';

const Navbar = ({ onMenuToggle, pageTitle }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-violet-100 px-4 lg:px-6 py-3.5 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-violet-100 text-violet-600 transition-colors">
          <span className="text-lg">☰</span>
        </button>
        <div>
          <h2 className="text-base font-bold text-violet-900 leading-none">{pageTitle}</h2>
          <p className="text-xs text-violet-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2" ref={notifRef}>
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-violet-100 text-violet-600 transition-colors relative">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-golden-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-violet-100 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100">
                  <h3 className="font-semibold text-violet-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-golden-600 hover:text-golden-700 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-violet-400">
                      <p className="text-2xl mb-2">🔕</p>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} onClick={() => { markRead(n._id); if (n.link) navigate(n.link); setShowNotif(false); }}
                        className={`px-4 py-3 border-b border-violet-50 cursor-pointer hover:bg-violet-50 transition-colors ${!n.isRead ? 'bg-violet-50/50' : ''}`}>
                        <div className="flex items-start gap-2">
                          {!n.isRead && <span className="w-1.5 h-1.5 bg-golden-500 rounded-full mt-1.5 flex-shrink-0" />}
                          <div className={!n.isRead ? '' : 'pl-3.5'}>
                            <p className="text-xs font-semibold text-violet-800">{n.title}</p>
                            <p className="text-xs text-violet-500 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-violet-400 mt-1">{formatDateTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
