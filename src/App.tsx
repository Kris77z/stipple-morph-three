import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { StippleMorph } from './components/StippleMorph'
import { TypewriterText } from './components/TypewriterText'
import { team } from './data/team'

const portraitSources = team.map((member) => member.portrait)

export default function App() {
  const [active, setActive] = useState(0)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [typingStage, setTypingStage] = useState(0)
  const exitTimerRef = useRef<number | null>(null)
  const activeMember = team[active]

  const cancelFocusExit = useCallback(() => {
    if (exitTimerRef.current === null) return
    window.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = null
  }, [])

  const enterFocusMode = useCallback(() => {
    cancelFocusExit()
    setIsFocusMode(true)
  }, [cancelFocusExit])

  const scheduleFocusExit = useCallback(() => {
    cancelFocusExit()
    exitTimerRef.current = window.setTimeout(() => {
      setIsFocusMode(false)
      exitTimerRef.current = null
    }, 240)
  }, [cancelFocusExit])

  const handleSubjectHoverChange = useCallback((hovered: boolean) => {
    if (hovered) enterFocusMode()
    else scheduleFocusExit()
  }, [enterFocusMode, scheduleFocusExit])

  const handleFocusPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return
    const target = event.target
    const isWithinFocusArea = target instanceof Element
      && target.closest('.portrait-stage, .focus-copy, .focus-retention-zone') !== null
    if (isWithinFocusArea) cancelFocusExit()
    else scheduleFocusExit()
  }, [cancelFocusExit, scheduleFocusExit])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelFocusExit()
        setIsFocusMode(false)
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        setActive((value) => (value + 1) % team.length)
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        setActive((value) => (value - 1 + team.length) % team.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      cancelFocusExit()
    }
  }, [cancelFocusExit])

  useEffect(() => {
    setTypingStage(0)
  }, [active, isFocusMode])

  return (
    <main
      className={`page${isFocusMode ? ' is-focus-mode' : ''}`}
      onPointerLeave={isFocusMode ? (event) => {
        if (event.pointerType !== 'touch') scheduleFocusExit()
      } : undefined}
      onPointerMove={isFocusMode ? handleFocusPointerMove : undefined}
    >
      <div className="standard-interface" aria-hidden={isFocusMode}>
        <h1 className="team-title">TEAM</h1>

        <div className="brand-note">Design<br />&amp; Branding</div>
        <div className="location-note">Based<br />in London</div>
        <span className="email-pill">Email us</span>

        <span className="plus plus-one">+</span>
        <span className="plus plus-two">+</span>
        <span className="plus plus-three">+</span>

        <div className="team-counter" aria-live="polite">
          <span>0</span>
          <span className="counter-window">
            <span className="counter-digit" key={active}>{active + 1}</span>
          </span>
        </div>

        <section className="member-card" aria-label="Team members">
          {team.map((member, index) => {
            const isActive = index === active
            return (
              <Fragment key={member.number}>
                <button
                  className={`member-row${isActive ? ' is-active' : ''}`}
                  data-member={index + 1}
                  onClick={() => {
                    setActive(index)
                    setIsFocusMode(false)
                  }}
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
      </div>

      <div
        className="focus-retention-zone"
        aria-hidden="true"
        onPointerEnter={cancelFocusExit}
        onPointerLeave={scheduleFocusExit}
      />

      <section
        className="portrait-stage"
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') setIsFocusMode((current) => !current)
        }}
      >
        <StippleMorph
          activeIndex={active}
          onSubjectHoverChange={handleSubjectHoverChange}
          portraits={portraitSources}
        />
      </section>

      <aside
        className="focus-copy"
        aria-hidden={!isFocusMode}
        aria-live="polite"
        onPointerEnter={cancelFocusExit}
        onPointerLeave={scheduleFocusExit}
      >
        <small className="focus-number">{activeMember.number}</small>
        <h2 className="focus-name">
          <TypewriterText
            active={isFocusMode}
            delay={720}
            onComplete={() => setTypingStage((stage) => Math.max(stage, 1))}
            speed={52}
            text={activeMember.name}
          />
        </h2>
        <p className="focus-role">
          <TypewriterText
            active={isFocusMode && typingStage >= 1}
            delay={120}
            onComplete={() => setTypingStage((stage) => Math.max(stage, 2))}
            speed={34}
            text={activeMember.role}
          />
        </p>
        <p className="focus-bio">
          <TypewriterText
            active={isFocusMode && typingStage >= 2}
            delay={180}
            speed={24}
            text={activeMember.bio}
          />
        </p>
      </aside>
    </main>
  )
}
