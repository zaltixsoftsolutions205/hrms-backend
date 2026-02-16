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

const REG_BADGE = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

// ── Regularization review panel ─────────────────────────────────────────────
const RegularizationsPanel = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewing, setReviewing] = useState({}); // { [id]: { comment, loading } }

  const fetchRegs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/regularizations${statusFilter ? `?status=${statusFilter}` : ''}`);
      setRecords(res.data);
    } catch { toast.error('Failed to load regularizations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRegs(); }, [statusFilter]);

  const initReview = (id) => {
    setReviewing(prev => ({ ...prev, [id]: { comment: '', loading: false } }));
  };

  const setComment = (id, val) => {
    setReviewing(prev => ({ ...prev, [id]: { ...prev[id], comment: val } }));
  };

  const submit = async (id, status) => {
    setReviewing(prev => ({ ...prev, [id]: { ...prev[id], loading: true } }));
    try {
      await api.patch(`/attendance/regularizations/${id}`, {
        status,
        comment: reviewing[id]?.comment || '',
      });
      toast.success(`Request ${status}`);
      setReviewing(prev => { const c = { ...prev }; delete c[id]; return c; });
      fetchRegs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
      setReviewing(prev => ({ ...prev, [id]: { ...prev[id], loading: false } }));
    }
  };

  return (
    <Card>
      {/* Sub-filter */}
      <div className="flex items-center gap-2 mb-5">
        {['pending', 'approved', 'rejected', ''].map((s, i) => (
          <button key={i}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-violet-700 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}
            onClick={() => setStatusFilter(s)}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-violet-400">{records.length} request{records.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-violet-400 text-sm">Loading...</div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<SI d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" size={40} color="text-violet-400" />}
          title="No regularization requests"
          message={statusFilter === 'pending' ? 'No pending requests at the moment.' : 'No requests found.'}
        />
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const isReviewing = !!reviewing[r._id];
            const rv = reviewing[r._id] || {};
            return (
              <div key={r._id} className="border border-violet-100 rounded-xl p-4 bg-white hover:bg-violet-50/30 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: employee + details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-violet-900">{r.employee?.name}</p>
                      <span className="text-xs text-violet-400">{r.employee?.employeeId}</span>
                      <span className="text-xs font-medium text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">{r.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {r.isLate && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          Late Arrival · {r.checkIn}
                        </span>
                      )}
                      {r.isEarlyLeave && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Early Leave · {r.checkOut}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${REG_BADGE[r.regularizationStatus]}`}>
                        {r.regularizationStatus}
                      </span>
                    </div>
                    <p className="text-sm text-violet-700">
                      <span className="font-medium text-violet-500">Reason: </span>{r.regularizationReason}
                    </p>
                    {r.regularizationComment && (
                      <p className="text-xs text-violet-500 mt-1">
                        <span className="font-medium">HR Note: </span>{r.regularizationComment}
                      </p>
                    )}
                  </div>

                  {/* Right: action buttons (only for pending) */}
                  {r.regularizationStatus === 'pending' && (
                    <div className="flex-shrink-0">
                      {!isReviewing ? (
                        <button onClick={() => initReview(r._id)}
                          className="btn-secondary btn-sm text-xs">
                          Review
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1.5 w-52">
                          <input
                            className="input-field text-xs py-1 px-2"
                            placeholder="Comment (optional)…"
                            value={rv.comment}
                            onChange={e => setComment(r._id, e.target.value)}
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => submit(r._id, 'approved')}
                              disabled={rv.loading}
                              className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                              {rv.loading ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => submit(r._id, 'rejected')}
                              disabled={rv.loading}
                              className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                              {rv.loading ? '…' : 'Reject'}
                            </button>
                            <button
                              onClick={() => setReviewing(prev => { const c = { ...prev }; delete c[r._id]; return c; })}
                              className="text-xs px-2 py-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100">
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

// ── Main HR Attendance page ──────────────────────────────────────────────────
const HRAttendance = () => {
  const [tab, setTab] = useState('records'); // 'records' | 'regularizations'
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingRegCount, setPendingRegCount] = useState(0);
  const now = new Date();
  const todayIST = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [filter, setFilter] = useState({ date: todayIST, month: now.getMonth() + 1, year: now.getFullYear(), employeeId: '', departmentId: '' });

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data)).catch(() => {});
    api.get('/admin/departments').then(r => setDepartments(r.data)).catch(() => {});
    // Badge count for pending regularizations
    api.get('/attendance/regularizations?status=pending')
      .then(r => setPendingRegCount(r.data.length))
      .catch(() => {});
  }, []);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.date) {
        params.append('date', filter.date);
      } else {
        params.append('month', filter.month);
        params.append('year', filter.year);
      }
      if (filter.employeeId) params.append('employeeId', filter.employeeId);
      if (filter.departmentId) params.append('departmentId', filter.departmentId);
      const res = await api.get(`/attendance?${params}`);
      setRecords(res.data);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter.date, filter.month, filter.year, filter.employeeId, filter.departmentId]);

  const exportCSV = () => {
    const header = 'Employee,Employee ID,Date,Check In,Check Out,Work Hours,Status,Late,Early Leave\n';
    const rows = records.map(r =>
      `${r.employee?.name},${r.employee?.employeeId},${r.date},${r.checkIn || ''},${r.checkOut || ''},${r.workHours || 0},${r.status},${r.isLate ? 'Yes' : 'No'},${r.isEarlyLeave ? 'Yes' : 'No'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${filter.month}_${filter.year}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance Management</h2>
          <p className="page-subtitle">{tab === 'records' ? `${records.length} records found` : 'Regularization requests'}</p>
        </div>
        {tab === 'records' && (
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-1.5 self-start sm:self-auto">
            <SI d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={15} color="text-violet-600" /> Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-violet-50 p-1 rounded-xl w-fit">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'records' ? 'bg-white text-violet-800 shadow-sm' : 'text-violet-500 hover:text-violet-700'}`}
          onClick={() => setTab('records')}>
          Records
        </button>
        <button
          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'regularizations' ? 'bg-white text-violet-800 shadow-sm' : 'text-violet-500 hover:text-violet-700'}`}
          onClick={() => { setTab('regularizations'); setPendingRegCount(0); }}>
          Regularizations
          {pendingRegCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {pendingRegCount > 9 ? '9+' : pendingRegCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'regularizations' ? (
        <RegularizationsPanel />
      ) : (
        <Card>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg overflow-hidden border border-violet-200 flex-shrink-0">
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${filter.date ? 'bg-violet-700 text-white' : 'bg-white text-violet-600 hover:bg-violet-50'}`}
                  onClick={() => setFilter(f => ({ ...f, date: todayIST }))}>Daily</button>
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${!filter.date ? 'bg-violet-700 text-white' : 'bg-white text-violet-600 hover:bg-violet-50'}`}
                  onClick={() => setFilter(f => ({ ...f, date: '' }))}>Monthly</button>
              </div>

              {filter.date ? (
                <input type="date" className="input-field flex-1 sm:flex-none sm:w-auto min-w-[140px]"
                  value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))} />
              ) : (
                <>
                  <select className="input-field flex-1 sm:flex-none sm:w-auto" value={filter.month}
                    onChange={e => setFilter(f => ({ ...f, month: parseInt(e.target.value) }))}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select className="input-field w-24 sm:w-auto" value={filter.year}
                    onChange={e => setFilter(f => ({ ...f, year: parseInt(e.target.value) }))}>
                    {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <select className="input-field flex-1 sm:flex-none sm:w-auto min-w-[140px]" value={filter.departmentId}
                onChange={e => setFilter(f => ({ ...f, departmentId: e.target.value, employeeId: '' }))}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <select className="input-field flex-1 sm:flex-none sm:w-auto min-w-[140px]" value={filter.employeeId}
                onChange={e => setFilter(f => ({ ...f, employeeId: e.target.value }))}>
                <option value="">All Employees</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-violet-400 text-sm">Loading...</div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<SI d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={40} color="text-violet-400" />}
              title="No attendance records"
              message="No records found for the selected filters."
            />
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="data-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Regularization</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r._id}>
                      <td>
                        <p className="font-medium text-violet-900 whitespace-nowrap">{r.employee?.name}</p>
                        <p className="text-xs text-violet-400">{r.employee?.employeeId}</p>
                      </td>
                      <td className="whitespace-nowrap">{r.date}</td>
                      <td className="whitespace-nowrap">
                        <span className={r.isLate ? 'text-orange-600 font-semibold' : ''}>{r.checkIn || '—'}</span>
                        {r.isLate && <span className="ml-1 text-[10px] text-orange-500 font-bold">LATE</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={r.isEarlyLeave ? 'text-red-500 font-semibold' : ''}>{r.checkOut || '—'}</span>
                        {r.isEarlyLeave && <span className="ml-1 text-[10px] text-red-400 font-bold">EARLY</span>}
                      </td>
                      <td>{r.workHours ? `${r.workHours}h` : '—'}</td>
                      <td><Badge status={r.status} /></td>
                      <td>
                        {r.regularizationStatus ? (
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${REG_BADGE[r.regularizationStatus]}`}>
                            {r.regularizationStatus}
                          </span>
                        ) : (r.isLate || r.isEarlyLeave) ? (
                          <span className="text-xs text-orange-500 font-medium">Not submitted</span>
                        ) : (
                          <span className="text-violet-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default HRAttendance;
