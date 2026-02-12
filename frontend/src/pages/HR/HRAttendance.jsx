import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import EmptyState from '../../components/UI/EmptyState';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const HRAttendance = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [filter, setFilter] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), employeeId: '', departmentId: '' });

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data)).catch(() => {});
    api.get('/admin/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: filter.month, year: filter.year });
      if (filter.employeeId) params.append('employeeId', filter.employeeId);
      if (filter.departmentId) params.append('departmentId', filter.departmentId);
      const res = await api.get(`/attendance?${params}`);
      setRecords(res.data);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter.month, filter.year, filter.employeeId, filter.departmentId]);

  const exportCSV = () => {
    const header = 'Employee,Employee ID,Date,Check In,Check Out,Work Hours,Status\n';
    const rows = records.map(r =>
      `${r.employee?.name},${r.employee?.employeeId},${r.date},${r.checkIn || ''},${r.checkOut || ''},${r.workHours || 0},${r.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${filter.month}_${filter.year}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Attendance Management</h2><p className="page-subtitle">{records.length} records found</p></div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-1.5"><SI d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={15} color="text-violet-600" /> Export CSV</button>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <select className="input-field w-auto" value={filter.month} onChange={e => setFilter(f => ({ ...f, month: parseInt(e.target.value) }))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select className="input-field w-auto" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: parseInt(e.target.value) }))}>
            {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input-field w-auto" value={filter.departmentId} onChange={e => setFilter(f => ({ ...f, departmentId: e.target.value, employeeId: '' }))}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="input-field w-auto" value={filter.employeeId} onChange={e => setFilter(f => ({ ...f, employeeId: e.target.value }))}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-10 text-center text-violet-400 text-sm">Loading...</div>
        ) : records.length === 0 ? (
          <EmptyState icon={<SI d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={40} color="text-violet-400" />} title="No attendance records" message="No records found for the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id}>
                    <td>
                      <p className="font-medium text-violet-900">{r.employee?.name}</p>
                      <p className="text-xs text-violet-400">{r.employee?.employeeId}</p>
                    </td>
                    <td>{r.date}</td>
                    <td>{r.checkIn || '—'}</td>
                    <td>{r.checkOut || '—'}</td>
                    <td>{r.workHours ? `${r.workHours}h` : '—'}</td>
                    <td><Badge status={r.status} /></td>
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

export default HRAttendance;
