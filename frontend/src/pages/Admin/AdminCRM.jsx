import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import EmptyState from '../../components/UI/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminCRM = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports/crm').then(r => setReport(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const chartData = report?.report?.map(r => ({
    name: r.employee.name.split(' ')[0],
    total: r.total,
    converted: r.converted,
  })) || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">CRM Analytics</h2><p className="page-subtitle">Sales performance and lead conversion insights</p></div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-violet-400 text-sm">Loading analytics...</div>
      ) : !report ? (
        <EmptyState icon="🎯" title="No CRM data" message="CRM analytics will appear here once sales employees add leads." />
      ) : (
        <>
          {/* Overall KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Total Leads" value={report.totalLeads} icon="👥" color="violet" />
            <KpiCard label="Total Converted" value={report.totalConverted} icon="🎉" color="green" />
            <KpiCard label="Overall Conversion" value={`${report.overallConversionRate}%`} icon="📈" color="golden" />
          </div>

          {/* Bar Chart */}
          <Card>
            <h3 className="font-bold text-violet-900 mb-4">Leads by Sales Employee</h3>
            {chartData.length === 0 ? (
              <div className="py-10 text-center text-violet-400 text-sm">No sales data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7C3AED' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#A78BFA' }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #DDD6FE', fontSize: 12 }} />
                  <Bar dataKey="total" name="Total Leads" fill="#DDD6FE" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="converted" name="Converted" fill="#7C3AED" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Employee Table */}
          <Card>
            <h3 className="font-bold text-violet-900 mb-4">Sales Employee Performance</h3>
            {report.report.length === 0 ? (
              <EmptyState icon="👥" title="No sales employees" message="Sales employees will appear here once added." />
            ) : (
              <div className="space-y-3">
                {report.report.map(item => (
                  <motion.div key={item.employee._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 border border-violet-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-violet-900">{item.employee.name}</p>
                        <p className="text-xs text-violet-400">{item.employee.employeeId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-golden-600">{item.conversionRate}%</p>
                        <p className="text-xs text-violet-500">conversion rate</p>
                      </div>
                    </div>
                    <div className="h-2 bg-violet-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-golden-500 rounded-full"
                        style={{ width: `${item.conversionRate}%` }} />
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-violet-500">Total: <strong className="text-violet-900">{item.total}</strong></span>
                      <span className="text-green-600">Converted: <strong>{item.converted}</strong></span>
                      <span className="text-red-500">Lost: <strong>{item.notInterested}</strong></span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminCRM;
