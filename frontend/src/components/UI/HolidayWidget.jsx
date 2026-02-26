import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const typeConfig = {
  national: { label: 'National', bg: 'bg-blue-100',   text: 'text-blue-700' },
  company:  { label: 'Company',  bg: 'bg-violet-100', text: 'text-violet-700' },
  optional: { label: 'Optional', bg: 'bg-gray-100',   text: 'text-gray-600' },
};

const calendarD = "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const HolidayWidget = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const canManage = user?.role === 'admin';

  useEffect(() => {
    api.get('/holidays/upcoming').then(r => setHolidays(r.data)).catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="glass-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600">
              <path d={calendarD} />
            </svg>
          </span>
          <h3 className="font-bold text-violet-900">Upcoming Holidays</h3>
        </div>
        {canManage && (
          <Link to="/admin/holidays" className="text-xs text-golden-600 font-semibold hover:text-golden-700">
            Manage →
          </Link>
        )}
      </div>

      {holidays.length === 0 ? (
        <p className="text-sm text-violet-400 text-center py-4">No upcoming holidays</p>
      ) : (
        <div className="space-y-2">
          {holidays.map(h => {
            const d = new Date(h.date);
            const cfg = typeConfig[h.type] || typeConfig.national;
            const isToday = new Date().toDateString() === d.toDateString();
            return (
              <div key={h._id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border ${isToday ? 'bg-green-50 border-green-200' : 'bg-gray-50/60 border-gray-100'}`}>
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-violet-800'}`}>
                  <span className="text-[10px] font-semibold leading-none">{MONTHS[d.getMonth()]}</span>
                  <span className="text-base font-bold leading-tight">{d.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-violet-900 truncate">{h.name}</p>
                  <p className="text-[10px] text-gray-500">{DAYS[d.getDay()]}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default HolidayWidget;
