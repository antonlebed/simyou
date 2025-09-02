import './App.css'
import { useState } from 'react'
import { getSessionId, getOptOut } from './state/local'

function App() {
  const [lastResult, setLastResult] = useState<string>('')
  async function runE2E() {
    try {
      const session = getSessionId()
      const tokRes = await fetch('/api/session', { headers: { 'x-simyou-session': session } })
      if (!tokRes.ok) throw new Error('session failed')
      const { token } = await tokRes.json()
      const body = {
        game_slug: 'sap-remake',
        stage_band: 1,
        last_outcome: 'N',
        client_build: 'dev',
        opt_out: getOptOut(),
        player_setup: { seed: 42, board: [1,2,3] }
      }
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-simyou-session': session,
          'x-simyou-session-token': token
        },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      setLastResult(JSON.stringify(json))
    } catch (e:any) {
      setLastResult('Error: ' + (e?.message || 'unknown'))
    }
  }
  return (
    <main className="hub">
      <header className="hub-header">
        <div>
          <h1>SimYou</h1>
          <p className="tagline">Tiny async games. Server decides. Players create the content.</p>
        </div>
        <nav className="hub-nav">
          <a href="/privacy/">Privacy</a>
          <a href="/research/">Research</a>
        </nav>
      </header>

      <section className="games">
        <h2>Games</h2>
        <div className="game-grid">
          <article className="game-card">
            <h3>Auto Critters</h3>
            <p>SAP-like auto-battler. Build then watch the server replay.</p>
            <button className="soon-btn" disabled>Coming soon</button>
          </article>
          <article className="game-card">
            <h3>Path Scout</h3>
            <p>Puzzle roguelite. Ghosts reveal traps they hit.</p>
            <button className="soon-btn" disabled>Coming soon</button>
          </article>
          <article className="game-card">
            <h3>Deck Duel (Snapshot)</h3>
            <p>Face a recorded deck and scripted line of play.</p>
            <button className="soon-btn" disabled>Coming soon</button>
          </article>
        </div>
      </section>

      <section className="tests">
        <h2>Test</h2>
        <button onClick={runE2E}>Run API smoke test</button>
        {lastResult && (
          <pre style={{
            marginTop: '0.75rem',
            background: '#111',
            padding: '0.75rem',
            borderRadius: '6px',
            maxHeight: '240px',
            overflow: 'auto'
          }}>{lastResult}</pre>
        )}
      </section>

      <footer className="hub-footer">
        <small>© {new Date().getFullYear()} SimYou</small>
      </footer>
    </main>
  )
}

export default App
