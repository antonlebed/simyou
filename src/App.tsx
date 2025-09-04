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
            <h3>Troop Commander</h3>
            <p>Grow and draft a squad of troops to break through enemy tower defenses.</p>
            <button className="soon-btn" disabled>Coming soon</button>
          </article>
          <article className="game-card">
            <h3>Tower Forge</h3>
            <p>Build and draft powerful towers to hold the line against incoming troops.</p>
            <button className="soon-btn" disabled>Coming soon</button>
          </article>
          <article className="game-card">
            <h3>Troops &amp; Towers</h3>
            <p>Draft both troops and towers and race other players—whose fortress will fall first?</p>
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
          <a href="/api/">API</a>
        </nav>
        <small>© {new Date().getFullYear()} SimYou</small>
      </footer>
    </main>
  )
}

export default App
