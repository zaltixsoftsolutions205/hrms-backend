import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../../utils/api';

const IncomeForm = ({ onSuccess, onClose }) => {
  const [form, setForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date) {
      return toast.error('Amount and date are required');
    }

    setLoading(true);
    try {
      await api.post('/finance/income', form);
      toast.success('Income added');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="input-label">Amount (₹) *</label>
        <input
          type="number"
          className="input-field"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
          placeholder="0"
          required
        />
      </div>

      <div>
        <label className="input-label">Date *</label>
        <input
          type="date"
          className="input-field"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
      </div>

      <div>
        <label className="input-label">Description</label>
        <input
          type="text"
          className="input-field"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="e.g., Customer payment for project XYZ"
        />
      </div>

      <div>
        <label className="input-label">Notes</label>
        <textarea
          className="input-field"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Adding...' : 'Add Income'}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default IncomeForm;
