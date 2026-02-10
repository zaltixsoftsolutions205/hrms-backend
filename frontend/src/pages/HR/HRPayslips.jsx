import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import { formatCurrency, monthName } from '../../utils/helpers';

const HRPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [form, setForm] = useState({
    employeeId: '', month: now.getMonth() + 1, year: now.getFullYear(),
    basicSalary: '', workingDays: 26,
    allowances: [{ name: 'HRA', amount: 0 }, { name: 'Travel Allowance', amount: 0 }],
    deductions: [{ name: 'PF', amount: 0 }, { name: 'Tax', amount: 0 }],
  });
  const [selectedEmpSalary, setSelectedEmpSalary] = useState(null);

  const fetch = async () => {
    const params = new URLSearchParams();
    if (filterMonth) params.append('month', filterMonth);
    if (filterYear) params.append('year', filterYear);
    api.get(`/payslips?${params}`).then(r => setPayslips(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data)).catch(() => {});
    fetch();
  }, [filterMonth, filterYear]);

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (emp) {
      setSelectedEmpSalary(emp);
      setForm(f => ({
        ...f, employeeId: id,
        basicSalary: emp.basicSalary || '',
        allowances: emp.allowances?.length ? emp.allowances : [{ name: 'HRA', amount: 0 }],
        deductions: emp.deductions?.length ? emp.deductions : [{ name: 'PF', amount: 0 }],
      }));
    } else {
      setForm(f => ({ ...f, employeeId: id }));
    }
  };

  const grossSalary = parseFloat(form.basicSalary || 0) + form.allowances.reduce((s, a) => s + parseFloat(a.amount || 0), 0);
  const totalDeductions = form.deductions.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const netSalary = grossSalary - totalDeductions;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/payslips', {
        ...form,
        basicSalary: parseFloat(form.basicSalary),
        allowances: form.allowances.map(a => ({ ...a, amount: parseFloat(a.amount || 0) })),
        deductions: form.deductions.map(d => ({ ...d, amount: parseFloat(d.amount || 0) })),
      });
      toast.success('Payslip generated and published!');
      setShowModal(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDownload = async (id, emp, month, year) => {
    setDownloading(id);
    try {
      const res = await api.get(`/payslips/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `Payslip_${emp?.name?.replace(/ /g, '_')}_${monthName(month)}_${year}.pdf`; a.click();
      URL.revokeObjectURL(url); toast.success('Downloaded!');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(null); }
  };

  const updateAllowance = (i, field, value) => {
    setForm(f => { const arr = [...f.allowances]; arr[i] = { ...arr[i], [field]: value }; return { ...f, allowances: arr }; });
  };
  const updateDeduction = (i, field, value) => {
    setForm(f => { const arr = [...f.deductions]; arr[i] = { ...arr[i], [field]: value }; return { ...f, deductions: arr }; });
  };
  const addAllowance = () => setForm(f => ({ ...f, allowances: [...f.allowances, { name: '', amount: 0 }] }));
  const addDeduction = () => setForm(f => ({ ...f, deductions: [...f.deductions, { name: '', amount: 0 }] }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Payroll Management</h2><p className="page-subtitle">{payslips.length} payslips generated</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Generate Payslip</button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="input-field w-auto" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
          <select className="input-field w-auto" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {payslips.length === 0 ? (
          <EmptyState icon="💳" title="No payslips" message="Generate payslips for employees."
            action={{ label: 'Generate', onClick: () => setShowModal(true) }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Employee</th><th>Period</th><th>Basic</th><th>Gross</th><th>Net Pay</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {payslips.map(ps => (
                  <tr key={ps._id}>
                    <td>
                      <p className="font-medium text-violet-900">{ps.employee?.name}</p>
                      <p className="text-xs text-violet-400">{ps.employee?.employeeId}</p>
                    </td>
                    <td>{monthName(ps.month)} {ps.year}</td>
                    <td>{formatCurrency(ps.basicSalary)}</td>
                    <td>{formatCurrency(ps.grossSalary)}</td>
                    <td className="font-bold text-golden-600">{formatCurrency(ps.netSalary)}</td>
                    <td>
                      <button onClick={() => handleDownload(ps._id, ps.employee, ps.month, ps.year)}
                        disabled={downloading === ps._id} className="btn-primary btn-sm">
                        {downloading === ps._id ? '...' : '⬇ PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Generate Payslip Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Generate Payslip" size="lg">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="input-label">Employee *</label>
              <select className="input-field" required value={form.employeeId} onChange={e => handleEmpSelect(e.target.value)}>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Month *</label>
              <select className="input-field" value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Year *</label>
              <select className="input-field" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}>
                {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Basic Salary (₹) *</label>
              <input type="number" className="input-field" required value={form.basicSalary}
                onChange={e => setForm(f => ({ ...f, basicSalary: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="input-label">Working Days</label>
              <input type="number" className="input-field" value={form.workingDays}
                onChange={e => setForm(f => ({ ...f, workingDays: parseInt(e.target.value) }))} />
            </div>
          </div>

          {/* Allowances */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">Allowances</label>
              <button type="button" onClick={addAllowance} className="text-xs text-violet-600 hover:text-violet-700 font-medium">+ Add</button>
            </div>
            {form.allowances.map((a, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input-field" value={a.name} onChange={e => updateAllowance(i, 'name', e.target.value)} placeholder="Name" />
                <input type="number" className="input-field w-32" value={a.amount} onChange={e => updateAllowance(i, 'amount', e.target.value)} placeholder="₹0" />
              </div>
            ))}
          </div>

          {/* Deductions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">Deductions</label>
              <button type="button" onClick={addDeduction} className="text-xs text-violet-600 hover:text-violet-700 font-medium">+ Add</button>
            </div>
            {form.deductions.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input-field" value={d.name} onChange={e => updateDeduction(i, 'name', e.target.value)} placeholder="Name" />
                <input type="number" className="input-field w-32" value={d.amount} onChange={e => updateDeduction(i, 'amount', e.target.value)} placeholder="₹0" />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-violet-50 to-golden-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Gross Salary</span><span className="font-semibold">{formatCurrency(grossSalary)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Total Deductions</span><span className="font-semibold text-red-600">- {formatCurrency(totalDeductions)}</span></div>
            <div className="flex justify-between border-t border-violet-200 pt-2"><span className="font-bold text-violet-900">Net Pay</span><span className="font-bold text-golden-600 text-lg">{formatCurrency(netSalary)}</span></div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Generating...' : 'Generate & Publish'}</button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRPayslips;
