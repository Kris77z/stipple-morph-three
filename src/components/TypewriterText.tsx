import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Props = {
  active: boolean
  className?: string
  delay?: number
  onComplete?: () => void
  speed?: number
  text: string
}

export function TypewriterText({
  active,
  className = '',
  delay = 0,
  onComplete,
  speed = 32,
  text,
}: Props) {
  const [visibleLength, setVisibleLength] = useState(0)
  const onCompleteRef = useRef(onComplete)

  useLayoutEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let frame = 0
    let completed = false
    setVisibleLength(0)

    if (!active) return undefined

    const complete = () => {
      if (completed) return
      completed = true
      onCompleteRef.current?.()
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleLength(text.length)
      complete()
      return undefined
    }

    const startedAt = performance.now()
    const typeNextCharacter = (now: number) => {
      const elapsed = now - startedAt - delay
      const nextLength = elapsed < 0 ? 0 : Math.min(text.length, Math.floor(elapsed / speed) + 1)
      setVisibleLength((currentLength) => currentLength === nextLength ? currentLength : nextLength)
      if (nextLength < text.length) frame = requestAnimationFrame(typeNextCharacter)
      else complete()
    }

    frame = requestAnimationFrame(typeNextCharacter)
    return () => cancelAnimationFrame(frame)
  }, [active, delay, speed, text])

  const isTyping = active && visibleLength < text.length

  return (
    <span className={`typewriter-text ${className}`.trim()} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, visibleLength)}</span>
      {isTyping ? <span className="typewriter-cursor" aria-hidden="true" /> : null}
    </span>
  )
}
