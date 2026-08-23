import { useEffect, useState } from 'react'
import { StippleMorph } from './components/StippleMorph'
import { team } from './data/team'

const portraitSources = team.map((member) => member.portrait)

export default function App() {
  const [active, setActive] = useState(0)
  const member = team[active]

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setActive((value) => (value + 1) % team.length)
      if (event.key === 'ArrowLeft') setActive((value) => (value - 1 + team.length) % team.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const step = (direction: number) => setActive((value) => (value + direction + team.length) % team.length)

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">STIPPLE / MORPH</div>
        <div className="top-note">React + Three.js experiment</div>
      </header>

      <section className="hero">
        <div className="profile" key={active}>
          <p className="eyebrow">Team / {String(active + 1).padStart(2, '0')}</p>
          <h1>{member.name}</h1>
          <div className="rule" />
          <div className="meta-grid">
            <div>
              <span>Role</span>
              <strong>{member.role}</strong>
            </div>
            <div>
              <span>Based</span>
              <strong>{member.location}</strong>
            </div>
          </div>
          <p className="bio">{member.bio}</p>
          <div className="tags">
            {member.focus.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>

        <div className="visual">
          <StippleMorph activeIndex={active} portraits={portraitSources} />
          <div className="visual-caption">Realtime point correspondence / GLSL morph</div>
        </div>
      </section>

      <footer className="controls">
        <div className="counter">
          <span>{String(active + 1).padStart(2, '0')}</span>
          <i />
          <span>{String(team.length).padStart(2, '0')}</span>
        </div>
        <div className="buttons">
          <button onClick={() => step(-1)} aria-label="Previous person">←</button>
          <button onClick={() => step(1)} aria-label="Next person">→</button>
        </div>
      </footer>
    </main>
  )
}
