import { NavLink, Route, Routes } from 'react-router-dom'
import { SAMPLE_DATA_NOTICE } from './copy'
import { useData } from './store/useCatalog'

function Home() {
  const { ready, data } = useData()
  return (
    <div className="stack">
      <h1>Gluten-Free Dining NYC</h1>
      <p className="muted">{ready ? `${data.restaurants.length} sample restaurants loaded.` : 'Loading…'}</p>
      <div className="notice">{SAMPLE_DATA_NOTICE}</div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <main className="page">
        <Routes>
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <nav className="tabbar" aria-label="Main">
        <NavLink to="/"><span className="ico" aria-hidden>🔍</span>Discover</NavLink>
      </nav>
    </div>
  )
}
