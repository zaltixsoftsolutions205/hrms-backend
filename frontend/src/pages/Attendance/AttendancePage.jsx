import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const AttendancePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const now = new Date();
  const [filter, setFilter] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/my?month=${filter.month}&year=${filter.year}`);
      setData(res.data);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(); }, [filter.month, filter.year]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in');
      toast.success('Checked in successfully!');
      fetchAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Checked out successfully!');
      fetchAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-out failed'); }
    finally { setActionLoading(false); }
  };

  const today = data?.todayRecord;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Today's Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6">
        <h3 className="font-bold text-violet-900 mb-1">Today's Attendance</h3>
        <p className="text-sm text-violet-500 mb-4">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-violet-500 mb-1">Check In</p>
              <p className="text-xl font-bold text-violet-900">{today?.checkIn || '—'}</p>
            </div>
            <div className="w-8 h-px bg-violet-200" />
            <div className="text-center">
              <p className="text-xs text-violet-500 mb-1">Check Out</p>
              <p className="text-xl font-bold text-violet-900">{today?.checkOut || '—'}</p>
            </div>
            {today?.workHours > 0 && (
              <>
                <div className="w-8 h-px bg-violet-200" />
                <div className="text-center">
                  <p className="text-xs text-violet-500 mb-1">Hours</p>
                  <p className="text-xl font-bold text-golden-600">{today.workHours}h</p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 ml-auto">
            {!today?.checkIn && (
              <button onClick={handleCheckIn} disabled={actionLoading} className="btn-primary">
                {actionLoading ? '...' : <span className="flex items-center gap-1.5"><SI d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color="text-green-600" /> Check In</span>}
              </button>
            )}
            {today?.checkIn && !today?.checkOut && (
              <button onClick={handleCheckOut} disabled={actionLoading} className="btn-danger">
                {actionLoading ? '...' : <span className="flex items-center gap-1.5"><SI d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color="text-red-500" /> Check Out</span>}
              </button>
            )}
            {today?.checkIn && today?.checkOut && (
              <span className="badge-green px-4 py-2 text-sm font-semibold flex items-center gap-1.5">Day Complete <SI d="M5 13l4 4L19 7" size={14} color="text-green-600" /></span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Present" value={data?.summary?.present ?? '—'} icon={<SI d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={14} color="text-green-600" />} color="green" />
        <KpiCard label="Absent" value={data?.summary?.absent ?? '—'} icon={<SI d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" size={14} color="text-red-500" />} color="red" />
        <KpiCard label="Half Day" value={data?.summary?.halfDay ?? '—'} icon={<SI d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" size={14} color="text-blue-500" />} color="golden" />
        <KpiCard label="Total Hours" value={data?.summary?.totalWorkHours ? `${data.summary.totalWorkHours}h` : '—'} icon={<SI d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={14} color="text-amber-500" />} color="violet" />
      </div>

      {/* Filter */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-violet-900">Attendance History</h3>
          <div className="flex gap-2">
            <select className="input-field w-auto" value={filter.month} onChange={e => setFilter(f => ({ ...f, month: parseInt(e.target.value) }))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select className="input-field w-auto" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: parseInt(e.target.value) }))}>
              {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-violet-400 text-sm">Loading...</div>
        ) : data?.records?.length === 0 ? (
          <EmptyState icon={<SI d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={40} color="text-violet-400" />} title="No attendance records" message="No records found for the selected period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.records?.map(record => (
                  <tr key={record._id}>
                    <td className="font-medium">{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })}</td>
                    <td>{record.checkIn || '—'}</td>
                    <td>{record.checkOut || '—'}</td>
                    <td>{record.workHours ? `${record.workHours}h` : '—'}</td>
                    <td><Badge status={record.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendancePage;
