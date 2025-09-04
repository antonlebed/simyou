import './App.css'

function App() {
  return (
    <main className="hub">
      <header className="hub-header">
        <div style={{gridColumn:'1 / -1'}}>
          <a href="/" aria-label="Home">
            <img src="/brand/logo.png" alt="SimYou" className="brand-logo" />
          </a>
          <p className="tagline">Minimalistic gaming... for science</p>
        </div>
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

      {/* Dev-only test hook; comment-in locally if needed */}

      <footer className="hub-footer">
        <nav aria-label="Footer">
          <a href="/">Home</a>
          <a href="/privacy/">Privacy</a>
          <a href="/research/">Research</a>
        </nav>
        <small>© {new Date().getFullYear()} SimYou</small>
      </footer>
    </main>
  )
}

export default App
