import './App.css'

function App() {
  return (
    <main className="hub">
      <header className="hub-header">
        <div style={{gridColumn:'1 / -1'}}>
          <a href="/" aria-label="Home">
            <img src={`/brand/logo.png?v=${import.meta.env.VITE_BUILD_ID}`} alt="SimYou" className="brand-logo" />
          </a>
          <p className="tagline">Gaming for science</p>
        </div>
        <nav className="astro-nav" aria-label="Navigation" style={{gridColumn:'1 / -1'}}>
          <div className="orbit" aria-hidden="true"></div>
          <div className="track">
            <a href="/" className="earth" aria-label="Home" aria-current="page">
              <span className="planet-wrap"><img loading="eager" fetchPriority="high" className="planet" src={`/planets/home_earth.png?v=${import.meta.env.VITE_BUILD_ID}`} alt="Home" onError={(e)=>{const t=e.currentTarget; t.remove(); const p=t.parentElement; if(p) p.classList.add('fallback')}} /></span>
              <span className="label sr-only">Home</span>
            </a>
            <a href="/research/" className="mars" aria-label="Research">
              <span className="planet-wrap"><img loading="eager" fetchPriority="high" className="planet" src={`/planets/research_mars.png?v=${import.meta.env.VITE_BUILD_ID}`} alt="Research" onError={(e)=>{const t=e.currentTarget; t.remove(); const p=t.parentElement; if(p) p.classList.add('fallback')}} /></span>
              <span className="label sr-only">Research</span>
            </a>
            <a href="/api/" className="jupiter" aria-label="API">
              <span className="planet-wrap"><img loading="eager" fetchPriority="high" className="planet" src={`/planets/api_jupiter.png?v=${import.meta.env.VITE_BUILD_ID}`} alt="API" onError={(e)=>{const t=e.currentTarget; t.remove(); const p=t.parentElement; if(p) p.classList.add('fallback')}} /></span>
              <span className="label sr-only">API</span>
            </a>
            <a href="/privacy/" className="saturn" aria-label="Privacy">
              <span className="planet-wrap"><img loading="eager" fetchPriority="high" className="planet" src={`/planets/privacy_saturn.png?v=${import.meta.env.VITE_BUILD_ID}`} alt="Privacy" onError={(e)=>{const t=e.currentTarget; t.remove(); const p=t.parentElement; if(p) p.classList.add('fallback')}} /></span>
              <span className="label sr-only">Privacy</span>
            </a>
          </div>
        </nav>
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
        <div className="social-icons" aria-label="Social links">
          <a className="youtube" href="https://www.youtube.com/@sim-you" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <i className="fa-brands fa-youtube" aria-hidden="true"></i>
          </a>
          <a className="discord" href="https://discord.gg/rygBR8wnJE" target="_blank" rel="noopener noreferrer" aria-label="Discord">
            <i className="fa-brands fa-discord" aria-hidden="true"></i>
          </a>
          <a className="x-twitter" href="https://x.com/simyou_" target="_blank" rel="noopener noreferrer" aria-label="X">
            <i className="fa-brands fa-x-twitter" aria-hidden="true"></i>
          </a>
          <a className="github" href="https://github.com/antonlebed/simyou" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <i className="fa-brands fa-github" aria-hidden="true"></i>
          </a>
        </div>
        
        <small>© {new Date().getFullYear()} SimYou</small>
      </footer>
    </main>
  )
}

export default App
