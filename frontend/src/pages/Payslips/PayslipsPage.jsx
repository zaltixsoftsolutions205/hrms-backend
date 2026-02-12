import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import EmptyState from '../../components/UI/EmptyState';
import { formatCurrency, monthName } from '../../utils/helpers';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const PayslipsPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.get('/payslips/my').then(r => setPayslips(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDownload = async (id, month, year) => {
    setDownloading(id);
    try {
      const res = await api.get(`/payslips/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `Payslip_${monthName(month)}_${year}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Payslip downloaded!');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(null); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">My Payslips</h2><p className="page-subtitle">View and download your salary slips</p></div>
      </div>

      <Card>
        {loading ? (
          <div className="py-10 text-center text-violet-400 text-sm">Loading...</div>
        ) : payslips.length === 0 ? (
          <EmptyState icon={<SI d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" size={40} color="text-violet-400" />} title="No payslips yet" message="Your payslips will appear here once published by HR." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {payslips.map(ps => (
              <motion.div key={ps._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="border border-violet-100 rounded-2xl p-4 hover:bg-violet-50/40 transition-colors">
                <div className="mb-3 pb-3 border-b border-violet-100">
                  <img src="/logo.png" alt="Zaltix Soft Solutions" className="h-7 object-contain" />
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-violet-900">{monthName(ps.month)} {ps.year}</p>
                    <p className="text-xs text-violet-400 mt-0.5">Generated payslip</p>
                  </div>
                  <span className="badge-green">Published</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Basic Salary</span>
                    <span className="font-medium text-violet-900">{formatCurrency(ps.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gross Salary</span>
                    <span className="font-medium text-violet-900">{formatCurrency(ps.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deductions</span>
                    <span className="font-medium text-red-600">- {formatCurrency(ps.deductions?.reduce((s, d) => s + d.amount, 0))}</span>
                  </div>
                  <div className="border-t border-violet-100 pt-2 flex justify-between">
                    <span className="font-semibold text-violet-900">Net Pay</span>
                    <span className="font-bold text-golden-600 text-lg">{formatCurrency(ps.netSalary)}</span>
                  </div>
                </div>
                <button onClick={() => handleDownload(ps._id, ps.month, ps.year)}
                  disabled={downloading === ps._id}
                  className="w-full btn-primary btn-sm flex items-center justify-center gap-2">
                  {downloading === ps._id ? 'Downloading...' : <span className="flex items-center gap-1.5"><SI d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={14} /> Download PDF</span>}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PayslipsPage;
