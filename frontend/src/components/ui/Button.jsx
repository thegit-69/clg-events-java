import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-primary-500 hover:bg-primary-600 text-white',
  secondary:
    'bg-dark-800 hover:bg-dark-900 text-white',
  outline:
    'border-2 border-dark-200 hover:border-dark-400 text-dark-800 bg-transparent',
  ghost:
    'hover:bg-dark-100 text-dark-700 bg-transparent',
  danger:
    'bg-red-500 hover:bg-red-600 text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </motion.button>
  )
}
