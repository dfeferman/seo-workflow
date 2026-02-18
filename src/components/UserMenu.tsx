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

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border border-border bg-surface text-left text-sm text-text-secondary hover:bg-surface-2 hover:text-text transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Benutzermenü"
      >
        <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {email ? email[0].toUpperCase() : '?'}
        </span>
        <span className="flex-1 min-w-0 truncate text-xs">{email || 'Angemeldet'}</span>
        <span className={`text-muted text-xs flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 py-1 rounded-lg border border-border bg-surface shadow-lg z-50"
          role="menu"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-2xs text-muted">Eingeloggt als</p>
            <p className="text-sm font-medium text-text truncate">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void signOut()
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-2 hover:text-text rounded-none"
            role="menuitem"
          >
            Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
