import { NavLink, Outlet } from 'react-router-dom'
import { useUndoStore } from '../../store/useUndoStore'
import { useAuthStore } from '../../store/useAuthStore'
import { Button } from './Button'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⬛' },
  { to: '/positions', label: 'Positions', icon: '📈' },
  { to: '/lp', label: 'Liquidity Pools', icon: '💧' },
  { to: '/portfolio', label: 'Portfolio', icon: '🥧' },
  { to: '/transactions', label: 'Transactions', icon: '📋' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Layout() {
  const { canUndo, undo } = useUndoStore()
  const { logout } = useAuthStore()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-[var(--color-surface-2)] border-r border-[var(--color-border)]">
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <span className="font-bold text-sm text-blue-400 tracking-wide">CRYPTO-PORTF</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 font-medium'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--color-border)]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-red-400 transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
          <span className="font-bold text-sm text-blue-400 tracking-wide">CRYPTO-PORTF</span>
          <button onClick={logout} title="Sign Out" className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors text-base">
            🚪
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-[var(--color-surface-2)] border-t border-[var(--color-border)]">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  isActive ? 'text-blue-400' : 'text-[var(--color-text-muted)]'
                }`
              }>
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Floating Undo button */}
      {canUndo && (
        <div className="fixed bottom-5 right-5 z-40">
          <Button variant="secondary" size="sm" onClick={undo} className="shadow-lg border border-[var(--color-border)]">
            ↩ Undo
          </Button>
        </div>
      )}
    </div>
  )
}
