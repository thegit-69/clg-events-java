import { IoSearchOutline } from 'react-icons/io5'
import { useRef, useEffect } from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Type to begin search, or use the global shortcut' }) {
  const inputRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative flex items-center w-full max-w-3xl mx-auto">
      <div className="relative w-full">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-xl" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-20 py-3.5 bg-dark-50 border border-dark-200 rounded-xl
                     text-dark-700 placeholder-dark-400 text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-all duration-200"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-2 py-1 bg-white border border-dark-200 rounded text-xs text-dark-500 font-mono">
            Ctrl
          </kbd>
          <span className="text-dark-400 text-xs">+</span>
          <kbd className="px-2 py-1 bg-white border border-dark-200 rounded text-xs text-dark-500 font-mono">
            K
          </kbd>
        </div>
      </div>
    </div>
  )
}
