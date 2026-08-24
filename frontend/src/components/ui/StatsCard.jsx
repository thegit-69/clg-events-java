import { motion } from 'framer-motion'

export default function StatsCard({ icon, label, value, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-dark-200 rounded-xl p-6"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClasses[color]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-dark-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-dark-900">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}
