import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';

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
                {actionLoading ? '...' : '🟢 Check In'}
              </button>
            )}
            {today?.checkIn && !today?.checkOut && (
              <button onClick={handleCheckOut} disabled={actionLoading} className="btn-danger">
                {actionLoading ? '...' : '🔴 Check Out'}
              </button>
            )}
            {today?.checkIn && today?.checkOut && (
              <span className="badge-green px-4 py-2 text-sm font-semibold">Day Complete ✓</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Present" value={data?.summary?.present ?? '—'} icon="✅" color="green" />
        <KpiCard label="Absent" value={data?.summary?.absent ?? '—'} icon="❌" color="red" />
        <KpiCard label="Half Day" value={data?.summary?.halfDay ?? '—'} icon="🌗" color="golden" />
        <KpiCard label="Total Hours" value={data?.summary?.totalWorkHours ? `${data.summary.totalWorkHours}h` : '—'} icon="⏱" color="violet" />
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
          <EmptyState icon="📅" title="No attendance records" message="No records found for the selected period." />
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
