import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import Card, { KpiCard } from '../../../components/UI/Card';
import { formatCurrency } from '../../../utils/helpers';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const Dashboard = ({ month, year, refresh }) => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
    profitMargin: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [month, year, refresh]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/finance/dashboard?month=${month}&year=${year}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const profitStatus = stats.profit >= 0 ? 'positive' : 'negative';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Income"
          value={formatCurrency(stats.totalIncome)}
          icon={
            <SI
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              size={14}
              color="text-green-600"
            />
          }
          color="green"
        />
        <KpiCard
          label="Total Expenses"
          value={formatCurrency(stats.totalExpense)}
          icon={
            <SI
              d="M13 10V3L4 14h7v7l9-11h-7z"
              size={14}
              color="text-red-600"
            />
          }
          color="red"
        />
        <KpiCard
          label="Net Profit/Loss"
          value={formatCurrency(stats.profit)}
          icon={
            <SI
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              size={14}
              color={profitStatus === 'positive' ? 'text-blue-600' : 'text-orange-600'}
            />
          }
          color={profitStatus === 'positive' ? 'blue' : 'golden'}
        />
        <KpiCard
          label="Profit Margin"
          value={`${stats.profitMargin}%`}
          icon={
            <SI
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              size={14}
              color="text-purple-600"
            />
          }
          color="purple"
        />
      </div>

      {/* Summary Card */}
      <Card>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Net Result</p>
            <p className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(stats.profit)}
            </p>
          </div>
        </div>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <p className="font-semibold text-blue-900">Finance Dashboard</p>
            <p className="text-sm text-blue-700 mt-1">
              Monitor your financial health. Income is auto-synced from won deals in CRM. Track all expenses and view detailed reports by category and service.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
