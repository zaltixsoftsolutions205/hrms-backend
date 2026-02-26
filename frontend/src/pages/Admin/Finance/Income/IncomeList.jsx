import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../../../utils/api';
import Card from '../../../../components/UI/Card';
import Modal from '../../../../components/UI/Modal';
import EmptyState from '../../../../components/UI/EmptyState';
import { formatCurrency, formatDate } from '../../../../utils/helpers';
import IncomeForm from './IncomeForm';

const SI = ({ d, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />
  </svg>
);

const IncomeList = ({ month, year, refresh, onRefresh, isViewOnly = false }) => {
  const [income, setIncome] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncome();
  }, [month, year, typeFilter, refresh]);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        month,
        year,
        ...(typeFilter && { type: typeFilter }),
      });
      const res = await api.get(`/finance/income?${query}`);
      setIncome(res.data.income);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income entry?')) return;
    try {
      await api.delete(`/finance/income/${id}`);
      toast.success('Income deleted');
      fetchIncome();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {['', 'deal', 'manual'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {!isViewOnly && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
              + Add Income
            </button>
          )}
        </div>
      </Card>

      {/* Income Table */}
      <Card>
        {income.length === 0 ? (
          <EmptyState
            icon={
              <SI
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                size={40}
                color="text-blue-400"
              />
            }
            title="No income entries"
            message="Income will appear here. Deal revenue auto-syncs from CRM."
          />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="data-table min-w-[600px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Service Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {income.map((item) => (
                  <tr key={item._id}>
                    <td className="text-sm">{formatDate(item.date)}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          item.type === 'deal'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{item.description}</td>
                    <td className="font-semibold text-green-600">{formatCurrency(item.amount)}</td>
                    <td className="text-xs text-gray-500">{item.serviceType || '—'}</td>
                    <td>
                      {item.type === 'manual' && !isViewOnly && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-800 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      )}
                      {item.type === 'deal' && <span className="text-xs text-gray-400">Auto-synced</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={!isViewOnly && showAddModal} onClose={() => setShowAddModal(false)} title="Add Manual Income">
        <IncomeForm
          onSuccess={() => {
            setShowAddModal(false);
            fetchIncome();
            onRefresh();
          }}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
};

export default IncomeList;
