import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Discover from './pages/Discover'
import GroupDetail from './pages/GroupDetail'
import Groups from './pages/Groups'
import Log from './pages/Log'
import NewVisit from './pages/NewVisit'
import OrderCard from './pages/OrderCard'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import RestaurantDetail from './pages/RestaurantDetail'
import Tally from './pages/Tally'
import Vote from './pages/Vote'
import { useApp } from './store/useApp'
import { startSync } from './sync/engine'

// Routes that must work for people who have never set up a profile (e.g. friends voting on a shared link).
const PUBLIC_PREFIXES = ['/onboarding', '/vote', '/tally']
const NO_TABBAR_PREFIXES = ['/onboarding', '/vote', '/tally', '/order-card']

export default function App() {
  const onboarded = useApp((s) => s.profile.onboarded)
  useEffect(() => startSync(), [])
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
          <Route path="/order-card" element={<OrderCard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/vote/:payload" element={<Vote />} />
          <Route path="/tally/:payload" element={<Tally />} />
          <Route path="/log" element={<Log />} />
          <Route path="/log/new" element={<NewVisit />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideTabs && (
        <nav className="tabbar" aria-label="Main">
          <NavLink to="/" end><span className="ico" aria-hidden>🔍</span>Discover</NavLink>
          <NavLink to="/groups"><span className="ico" aria-hidden>👥</span>Groups</NavLink>
          <NavLink to="/log"><span className="ico" aria-hidden>📓</span>My list</NavLink>
          <NavLink to="/profile"><span className="ico" aria-hidden>👤</span>Profile</NavLink>
        </nav>
      )}
    </div>
  )
}
