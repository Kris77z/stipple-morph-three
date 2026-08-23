import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { loadPortraitClouds, type PortraitCloud } from '../lib/pointCloud'
import { fragmentShader, vertexShader } from '../shaders/stipple'

type Props = {
  activeIndex: number
  onSubjectHoverChange?: (hovered: boolean) => void
  portraits: string[]
  particleCount?: number
  pointSize?: number
}

const PORTRAIT_SIZE = 600

export function StippleMorph({
  activeIndex,
  onSubjectHoverChange,
  portraits,
  particleCount = 80000,
  pointSize = 1.6,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLImageElement>(null)
  const targetIndexRef = useRef(activeIndex)
  const hoverChangeRef = useRef(onSubjectHoverChange)

  useLayoutEffect(() => {
    targetIndexRef.current = activeIndex
    hoverChangeRef.current = onSubjectHoverChange
  }, [activeIndex, onSubjectHoverChange])

  useEffect(() => {
    const host = hostRef.current
    const reveal = revealRef.current
    if (!host || !reveal || portraits.length === 0) return

    const mobile = window.matchMedia('(max-width: 720px)').matches
    const count = mobile ? Math.min(particleCount, 32000) : particleCount
    let disposed = false
    let raf = 0
    let renderer: THREE.WebGLRenderer | undefined
    let geometry: THREE.BufferGeometry | undefined
    let material: THREE.ShaderMaterial | undefined
    let clouds: PortraitCloud[] = []
    let current = activeIndex % portraits.length
    let morphTo = current
    let morphStart = performance.now()
    let morphing = false
    let subjectHovered = false

    const setSubjectHovered = (hovered: boolean) => {
      if (subjectHovered === hovered) return
      subjectHovered = hovered
      hoverChangeRef.current?.(hovered)
    }

    const setRevealVisibility = (visible: boolean) => {
      reveal.style.opacity = visible && !morphing ? '1' : '0'
    }

    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const cloud = clouds[current]
      if (!cloud || morphing) {
        setRevealVisibility(false)
        setSubjectHovered(false)
        return
      }

      const rect = host.getBoundingClientRect()
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * PORTRAIT_SIZE)
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * PORTRAIT_SIZE)
      if (x < 0 || x >= PORTRAIT_SIZE || y < 0 || y >= PORTRAIT_SIZE) {
        setRevealVisibility(false)
        return
      }
      const isOverSubject = cloud.subjectMask[y * PORTRAIT_SIZE + x] === 1
      setRevealVisibility(isOverSubject)
      if (isOverSubject) setSubjectHovered(true)
    }

    const pointerLeave = (event: PointerEvent) => {
      setRevealVisibility(false)
      if (event.pointerType !== 'touch') setSubjectHovered(false)
    }
    host.dataset.state = 'loading'

    const initialize = async () => {
      try {
        clouds = await loadPortraitClouds(portraits, count)
        if (disposed) return

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-300, 300, 300, -300, 0.1, 10)
        camera.position.z = 1

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        })
        renderer.setClearColor(0x000000, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))
        renderer.setSize(PORTRAIT_SIZE, PORTRAIT_SIZE, false)
        host.prepend(renderer.domElement)

        geometry = new THREE.BufferGeometry()
        const initial = clouds[current].points
        geometry.setAttribute('position', new THREE.BufferAttribute(initial, 3))
        geometry.setAttribute('aFrom', new THREE.BufferAttribute(initial.slice(), 3))
        geometry.setAttribute('aTo', new THREE.BufferAttribute(initial.slice(), 3))

        material = new THREE.ShaderMaterial({
          uniforms: {
            uProgress: { value: 1 },
            uPointSize: { value: pointSize },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 3) },
          },
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
        })

        const particles = new THREE.Points(geometry, material)
        particles.frustumCulled = false
        scene.add(particles)
        reveal.src = clouds[current].revealUrl

        const beginMorph = (next: number) => {
          if (next === current || !geometry || !material) return
          morphTo = next
          morphing = true
          setRevealVisibility(false)
          setSubjectHovered(false)

          const from = geometry.getAttribute('aFrom') as THREE.BufferAttribute
          const to = geometry.getAttribute('aTo') as THREE.BufferAttribute
          from.copyArray(clouds[current].points)
          to.copyArray(clouds[morphTo].points)
          from.needsUpdate = true
          to.needsUpdate = true
          material.uniforms.uProgress.value = 0
          morphStart = performance.now()
        }

        host.addEventListener('pointermove', pointerMove)
        host.addEventListener('pointerleave', pointerLeave)
        host.dataset.state = 'ready'

        const animate = (now: number) => {
          if (disposed || !renderer || !material) return
          raf = requestAnimationFrame(animate)
          const requested = targetIndexRef.current % portraits.length
          if (!morphing && requested !== current) beginMorph(requested)

          if (morphing) {
            const progress = Math.min((now - morphStart) / 2000, 1)
            material.uniforms.uProgress.value = progress
            if (progress >= 1) {
              current = morphTo
              morphing = false
              reveal.src = clouds[current].revealUrl
            }
          }

          renderer.render(scene, camera)
        }

        raf = requestAnimationFrame(animate)
      } catch (error) {
        if (!disposed) {
          host.dataset.state = 'error'
          console.error(error)
        }
      }
    }

    void initialize()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      host.removeEventListener('pointermove', pointerMove)
      host.removeEventListener('pointerleave', pointerLeave)
      geometry?.dispose()
      material?.dispose()
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [particleCount, pointSize, portraits])

  return (
    <div
      className="stipple-canvas"
      ref={hostRef}
      role="img"
      aria-label="Interactive stipple portrait"
    >
      <img className="portrait-reveal" ref={revealRef} alt="" draggable={false} />
    </div>
  )
}
