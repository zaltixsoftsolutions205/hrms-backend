import { motion } from 'framer-motion';

const Card = ({ children, className = '', animate = true, onClick }) => {
  const Component = animate ? motion.div : 'div';
  const animProps = animate ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } } : {};
  return (
    <Component className={`glass-card p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`} onClick={onClick} {...animProps}>
      {children}
    </Component>
  );
};

export const KpiCard = ({ label, value, icon, color = 'violet', trend }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
    className="glass-card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="kpi-label">{label}</p>
        <p className="kpi-value mt-1">{value ?? '—'}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      {icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${
          color === 'golden' ? 'border-golden-300 bg-golden-50 text-golden-600' :
          color === 'green' ? 'border-green-300 bg-green-50 text-green-600' :
          color === 'red' ? 'border-red-300 bg-red-50 text-red-600' :
          'border-violet-300 bg-violet-50 text-violet-600'
        }`}>
          {icon}
        </div>
      )}
    </div>
  </motion.div>
);

export default Card;
