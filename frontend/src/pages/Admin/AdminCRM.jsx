import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { KpiCard } from '../../components/UI/Card';
import EmptyState from '../../components/UI/EmptyState';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const SI = ({ d, d2, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={color || ''}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const AdminCRM = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    api.get('/admin/reports/crm').then(r => setReport(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const chartData = report?.report?.map(r => ({
    name: r.employee.name.split(' ')[0],
    total: r.total,
    converted: r.converted,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h2 className="page-title">CRM Analytics</h2><p className="page-subtitle">Sales performance, lead conversion and product prospects</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {[{ key: 'analytics', label: 'Analytics' }, { key: 'products', label: `Products (${products.length})` }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 font-semibold text-sm border-b-2 -mb-0.5 transition-colors ${activeTab === t.key ? 'text-violet-700 border-violet-700' : 'text-gray-400 border-transparent hover:text-violet-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-gray-500 font-semibold">No products yet</p>
              <p className="text-sm text-gray-400 mt-1">Products created by sales will appear here.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p._id} onClick={() => navigate(`/crm/products/${p._id}`)}
                  className="glass-card p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors">{p.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  </div>
                  {p.category && <p className="text-xs text-gray-500 mb-1">{p.category}</p>}
                  {p.price > 0 && <p className="text-sm font-bold text-golden-600 mb-2">{formatCurrency(p.price)}{p.unit ? ` / ${p.unit}` : ''}</p>}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <div className="text-center"><p className="text-base font-bold text-gray-900">{p.prospectCount ?? 0}</p><p className="text-[10px] text-gray-500">Prospects</p></div>
                    <div className="text-center"><p className="text-base font-bold text-amber-600">{p.interestedCount ?? 0}</p><p className="text-[10px] text-gray-500">Interested</p></div>
                    <div className="text-center"><p className="text-base font-bold text-violet-600">{p.convertedCount ?? 0}</p><p className="text-[10px] text-gray-500">In Leads</p></div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">By {p.createdBy?.name} · {formatDate(p.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && loading ? (
        <div className="py-16 text-center text-violet-400 text-sm">Loading analytics...</div>
      ) : activeTab === 'analytics' && !report ? (
        <EmptyState icon={<SI d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" size={40} color="text-violet-400" />} title="No CRM data" message="CRM analytics will appear here once sales employees add leads." />
      ) : activeTab === 'analytics' ? (
        <>
          {/* Overall KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Total Leads" value={report.totalLeads} icon={<SI d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={14} color="text-violet-600" />} color="violet" />
            <KpiCard label="Total Converted" value={report.totalConverted} icon={<SI d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" size={14} color="text-violet-600" />} color="green" />
            <KpiCard label="Overall Conversion" value={`${report.overallConversionRate}%`} icon={<SI d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" size={14} color="text-amber-500" />} color="golden" />
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
              <EmptyState icon={<SI d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={40} color="text-violet-400" />} title="No sales employees" message="Sales employees will appear here once added." />
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
                      <span className="text-violet-600">Converted: <strong>{item.converted}</strong></span>
                      <span className="text-gray-900">Lost: <strong>{item.notInterested}</strong></span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default AdminCRM;
