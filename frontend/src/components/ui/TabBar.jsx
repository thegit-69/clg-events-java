import { motion } from 'framer-motion'

export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="overflow-x-auto px-4">
      <div className="flex items-center justify-center gap-1 bg-dark-100 rounded-xl p-1 w-fit mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`relative px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap
              ${activeTab === tab.value
                ? 'text-white'
                : 'text-dark-500 hover:text-dark-700'
              }`}
          >
            {activeTab === tab.value && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary-500 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
