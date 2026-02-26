import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../../../utils/api';
import Card from '../../../../components/UI/Card';
import Modal from '../../../../components/UI/Modal';
import EmptyState from '../../../../components/UI/EmptyState';
import { formatCurrency, formatDate } from '../../../../utils/helpers';
import ExpenseForm from './ExpenseForm';

const SI = ({ d, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />
  </svg>
);

const categoryColors = {
  salary: 'red',
  commission: 'orange',
  rent: 'blue',
  software: 'purple',
  marketing: 'green',
  operational: 'gray',
  custom: 'yellow',
};

const ExpenseList = ({ month, year, refresh, onRefresh, isViewOnly = false }) => {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [month, year, categoryFilter, statusFilter, refresh]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        month,
        year,
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/finance/expenses?${query}`);
      setExpenses(res.data.expenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/finance/expenses/${id}/approve`);
      toast.success('Expense approved');
      fetchExpenses();
      onRefresh();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/finance/expenses/${id}/reject`);
      toast.success('Expense rejected');
      fetchExpenses();
      onRefresh();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/finance/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const categories = ['salary', 'commission', 'rent', 'software', 'marketing', 'operational'];
  const statuses = ['pending', 'approved', 'rejected'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {['', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === '' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {['', ...statuses].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {!isViewOnly && (
            <div className="pt-2">
              <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                + Add Expense
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Expenses Table */}
      <Card>
        {expenses.length === 0 ? (
          <EmptyState
            icon={
              <SI
                d="M13 10V3L4 14h7v7l9-11h-7z"
                size={40}
                color="text-red-400"
              />
            }
            title="No expenses"
            message="Start tracking expenses to manage your finances better."
          />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id}>
                    <td className="text-sm">{formatDate(exp.date)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold bg-${categoryColors[exp.category]}-100 text-${categoryColors[exp.category]}-700`}>
                        {exp.customCategory || exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{exp.description}</td>
                    <td className="font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          exp.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : exp.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {!isViewOnly && (
                        <div className="flex gap-1 flex-wrap">
                          {exp.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(exp._id)}
                                className="text-xs font-semibold text-green-600 hover:text-green-800"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleReject(exp._id)}
                                className="text-xs font-semibold text-red-600 hover:text-red-800"
                              >
                                ✗
                              </button>
                              <button
                                onClick={() => handleDelete(exp._id)}
                                className="text-xs font-semibold text-gray-600 hover:text-gray-800"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={!isViewOnly && showAddModal} onClose={() => setShowAddModal(false)} title="Add Expense">
        <ExpenseForm
          onSuccess={() => {
            setShowAddModal(false);
            fetchExpenses();
            onRefresh();
          }}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
};

export default ExpenseList;
