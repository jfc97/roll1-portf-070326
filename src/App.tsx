import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { Layout } from './components/common/Layout'
import { Spinner } from './components/common/Spinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Positions from './pages/Positions'
import LiquidityPools from './pages/LiquidityPools'
import Portfolio from './pages/Portfolio'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'

export default function App() {
  const { session, loading, init } = useAuthStore()

  useEffect(() => {
    const cleanup = init()
    return cleanup
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="positions" element={<Positions />} />
          <Route path="lp" element={<LiquidityPools />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
