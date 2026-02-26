import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import Card from '../../../../components/UI/Card';
import { formatCurrency } from '../../../../utils/helpers';

const SI = ({ d, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />
  </svg>
);

const ReportsPage = ({ month, year }) => {
  const [yearlyData, setYearlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [year]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [yearly, category, service] = await Promise.all([
        api.get(`/finance/reports/yearly?year=${year}`),
        api.get(`/finance/reports/by-category?month=${month}&year=${year}`),
        api.get(`/finance/reports/by-service?year=${year}`),
      ]);

      setYearlyData(yearly.data);
      setCategoryData(category.data.data);
      setServiceData(service.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Yearly Report */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-4">Yearly Summary - {year}</h3>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="data-table min-w-[600px]">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map((row) => (
                <tr key={row.month}>
                  <td className="font-semibold">{row.monthName}</td>
                  <td className="text-green-600 font-semibold">{formatCurrency(row.income)}</td>
                  <td className="text-red-600 font-semibold">{formatCurrency(row.expense)}</td>
                  <td className={`font-semibold ${row.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(row.profit)}
                  </td>
                  <td className="text-sm">{row.margin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-4">Expense Breakdown by Category</h3>
        {categoryData.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No expenses for this period</p>
        ) : (
          <div className="space-y-3">
            {categoryData.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{cat._id}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(cat.total)}</p>
                  <p className="text-xs text-gray-500">{cat.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Revenue by Service */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-4">Revenue by Service Type</h3>
        {serviceData.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No revenue data available</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="data-table min-w-[500px]">
              <thead>
                <tr>
                  <th>Service Type</th>
                  <th>Revenue</th>
                  <th>Deals</th>
                </tr>
              </thead>
              <tbody>
                {serviceData.map((svc) => (
                  <tr key={svc._id}>
                    <td className="font-semibold capitalize">{svc._id || 'Unknown'}</td>
                    <td className="text-green-600 font-semibold">{formatCurrency(svc.revenue)}</td>
                    <td className="text-gray-600">{svc.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Help Card */}
      <Card className="bg-green-50 border border-green-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <p className="font-semibold text-green-900">Reports Explained</p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>• <strong>Yearly Summary:</strong> Month-by-month income, expenses, and profit</li>
              <li>• <strong>Expense Breakdown:</strong> See which categories consume your budget</li>
              <li>• <strong>Revenue by Service:</strong> Understand which services are most profitable</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
