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
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
          color === 'golden' ? 'bg-golden-100 text-golden-600' :
          color === 'green' ? 'bg-green-100 text-green-600' :
          color === 'red' ? 'bg-red-100 text-red-600' :
          'bg-violet-100 text-violet-600'
        }`}>
          {icon}
        </div>
      )}
    </div>
  </motion.div>
);

export default Card;
