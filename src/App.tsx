import { Fragment, useEffect, useState } from 'react'
import { StippleMorph } from './components/StippleMorph'
import { team } from './data/team'

const portraitSources = team.map((member) => member.portrait)

export default function App() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        setActive((value) => (value + 1) % team.length)
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        setActive((value) => (value - 1 + team.length) % team.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <main className="page">
      <h1 className="team-title">TEAM</h1>

      <div className="brand-note">Design<br />&amp;<br />Branding</div>
      <div className="location-note">Based<br />in London</div>
      <a className="email-pill" href="#contact">Email us</a>

      <span className="plus plus-one">+</span>
      <span className="plus plus-two">+</span>
      <span className="plus plus-three">+</span>

      <div className="team-counter" aria-live="polite">
        <span>0</span>
        <span className="counter-window">
          <span className="counter-digit" key={active}>{active + 1}</span>
        </span>
      </div>

      <section className="portrait-stage">
        <StippleMorph activeIndex={active} portraits={portraitSources} />
      </section>

      <section className="member-card" aria-label="Team members">
        {team.map((member, index) => {
          const isActive = index === active
          return (
            <Fragment key={member.number}>
              <button
                className={`member-row${isActive ? ' is-active' : ''}`}
                data-member={index + 1}
                onClick={() => setActive(index)}
                type="button"
                aria-expanded={isActive}
              >
                <span className="member-collapsed">
                  <small className="member-number">{member.number}</small>
                  <span className="member-role">{member.role}</span>
                  <span className="row-arrow" aria-hidden="true">↗</span>
                </span>

                <span className="member-expanded">
                  <span className="member-heading">
                    <strong className="member-name">{member.name}</strong>
                    <span className="active-arrow" aria-hidden="true">↗</span>
                  </span>
                  <span className="member-bio">{member.bio}</span>
                  <span className="member-footer">
                    <small className="member-number">{member.number}</small>
                    <span className="active-role">{member.role}</span>
                    <span className="skill-list">
                      <span className="skill-row">
                        {member.focus.slice(0, 2).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}
                      </span>
                      <span className="skill-row">
                        {member.focus.slice(2).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}
                      </span>
                    </span>
                  </span>
                </span>
              </button>
              {index < team.length - 1 && <span className="member-divider" aria-hidden="true" />}
            </Fragment>
          )
        })}
      </section>
    </main>
  )
}
