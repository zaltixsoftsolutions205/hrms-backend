import { useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import Dashboard from './Dashboard';
import Income from './Income/IncomeList';
import Expenses from './Expenses/ExpenseList';
import Reports from './Reports/ReportsPage';

const FinancePage = () => {
  const { user } = useAuth();
  const isViewOnly = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Track income and expenses</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="input-field text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input-field text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {['dashboard', 'income', 'expenses', 'reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 -mb-0.5 whitespace-nowrap ${
              activeTab === tab
                ? 'text-blue-700 border-blue-700'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <Dashboard month={month} year={year} refresh={refreshTrigger} />}
      {activeTab === 'income' && (
        <Income month={month} year={year} refresh={refreshTrigger} onRefresh={handleRefresh} isViewOnly={isViewOnly} />
      )}
      {activeTab === 'expenses' && (
        <Expenses month={month} year={year} refresh={refreshTrigger} onRefresh={handleRefresh} isViewOnly={isViewOnly} />
      )}
      {activeTab === 'reports' && <Reports month={month} year={year} refresh={refreshTrigger} />}
    </div>
  );
};

export default FinancePage;
