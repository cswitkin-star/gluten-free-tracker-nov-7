import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import { useApp } from './store/useApp'
import { useData } from './store/useCatalog'

function Discover() {
  const { ready, data } = useData()
  return <p className="muted">{ready ? `${data.restaurants.length} sample restaurants loaded.` : 'Loading…'}</p>
}

// Routes that must work for people who have never set up a profile (e.g. friends voting on a shared link).
const PUBLIC_PREFIXES = ['/onboarding', '/vote']
const NO_TABBAR_PREFIXES = ['/onboarding', '/vote', '/order-card']

export default function App() {
  const onboarded = useApp((s) => s.profile.onboarded)
  const { pathname } = useLocation()
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const hideTabs = NO_TABBAR_PREFIXES.some((p) => pathname.startsWith(p))

  if (!onboarded && !isPublic) return <Navigate to="/onboarding" replace />

  return (
    <div className="app">
      <main className="page">
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideTabs && (
        <nav className="tabbar" aria-label="Main">
          <NavLink to="/" end><span className="ico" aria-hidden>🔍</span>Discover</NavLink>
          <NavLink to="/profile"><span className="ico" aria-hidden>👤</span>Profile</NavLink>
        </nav>
      )}
    </div>
  )
}
