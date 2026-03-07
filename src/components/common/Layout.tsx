import { NavLink, Outlet } from 'react-router-dom'
import { useUndoStore } from '../../store/useUndoStore'
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
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
          <span className="font-bold text-sm text-blue-400 tracking-wide">CRYPTO-PORTF</span>
          <nav className="flex gap-2">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} title={item.label}
                className={({ isActive }) =>
                  `text-lg ${isActive ? 'opacity-100' : 'opacity-40'}`
                }>
                {item.icon}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
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
