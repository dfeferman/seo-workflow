import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const email = user?.email ?? ''
  const isSuperadmin = user?.is_superadmin ?? false

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Benutzermenü"
      >
        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {email ? email[0].toUpperCase() : '?'}
        </span>
        <span className="flex-1 min-w-0 truncate text-xs">{email || 'Angemeldet'}</span>
        <span className={`text-slate-500 text-xs flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 py-1 rounded-xl border border-slate-100 bg-white shadow-md z-50"
          role="menu"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-2xs text-slate-500">Eingeloggt als</p>
            <p className="text-sm font-medium text-slate-900 truncate">{email}</p>
            {isSuperadmin && (
              <p className="text-2xs text-orange-600 mt-1">Superadmin</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              void signOut()
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg mx-1"
            role="menuitem"
          >
            Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
