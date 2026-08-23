import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { loadPortraitClouds } from '../lib/pointCloud'
import { fragmentShader, vertexShader } from '../shaders/stipple'

type Props = {
  activeIndex: number
  portraits: string[]
  particleCount?: number
  pointSize?: number
}

export function StippleMorph({ activeIndex, portraits, particleCount = 26000, pointSize = 2.15 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const targetIndexRef = useRef(activeIndex)

  useEffect(() => {
    targetIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    const host = hostRef.current
    if (!host || portraits.length === 0) return

    const mobile = window.matchMedia('(max-width: 720px)').matches
    const count = mobile ? Math.min(particleCount, 12000) : particleCount
    let disposed = false
    let raf = 0
    let observer: ResizeObserver | undefined
    let renderer: THREE.WebGLRenderer | undefined
    let geometry: THREE.BufferGeometry | undefined
    let material: THREE.ShaderMaterial | undefined
    let pointer: ((event: PointerEvent) => void) | undefined
    let pointerLeave: (() => void) | undefined

    host.dataset.state = 'loading'

    const initialize = async () => {
      try {
        const clouds = await loadPortraitClouds(portraits, count)
        if (disposed) return

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
        camera.position.z = 5.8

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        })
        renderer.setClearColor(0x000000, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        host.appendChild(renderer.domElement)

        geometry = new THREE.BufferGeometry()
        const initialIndex = activeIndex % portraits.length
        const initial = clouds[initialIndex]
        geometry.setAttribute('position', new THREE.BufferAttribute(initial, 3))
        geometry.setAttribute('aFrom', new THREE.BufferAttribute(initial.slice(), 3))
        geometry.setAttribute('aTo', new THREE.BufferAttribute(initial.slice(), 3))

        const seeds = new Float32Array(count)
        for (let i = 0; i < count; i += 1) seeds[i] = Math.random()
        geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

        material = new THREE.ShaderMaterial({
          uniforms: {
            uProgress: { value: 1 },
            uTime: { value: 0 },
            uPointSize: { value: pointSize },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            uPointer: { value: new THREE.Vector2(10, 10) },
          },
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
        })

        const particles = new THREE.Points(geometry, material)
        particles.position.y = -0.04
        scene.add(particles)

        let current = initialIndex
        let morphTo = current
        let morphStart = performance.now()
        let morphing = false

        const beginMorph = (next: number) => {
          if (next === current || !geometry || !material) return

          morphTo = next
          const from = geometry.getAttribute('aFrom') as THREE.BufferAttribute
          const to = geometry.getAttribute('aTo') as THREE.BufferAttribute
          from.copyArray(clouds[current])
          to.copyArray(clouds[morphTo])
          from.needsUpdate = true
          to.needsUpdate = true
          material.uniforms.uProgress.value = 0
          morphStart = performance.now()
          morphing = true
        }

        const resize = () => {
          if (!renderer) return
          const { clientWidth: width, clientHeight: height } = host
          renderer.setSize(width, height, false)
          camera.aspect = width / Math.max(height, 1)
          camera.updateProjectionMatrix()
        }

        pointer = (event: PointerEvent) => {
          if (!material) return
          const rect = host.getBoundingClientRect()
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 3.2
          const y = -((event.clientY - rect.top) / rect.height - 0.5) * 3.2
          material.uniforms.uPointer.value.set(x, y)
        }

        pointerLeave = () => material?.uniforms.uPointer.value.set(10, 10)
        observer = new ResizeObserver(resize)
        observer.observe(host)
        host.addEventListener('pointermove', pointer)
        host.addEventListener('pointerleave', pointerLeave)
        resize()
        host.dataset.state = 'ready'

        const animate = (now: number) => {
          if (disposed || !renderer || !material) return
          raf = requestAnimationFrame(animate)
          material.uniforms.uTime.value = now * 0.001

          const requested = targetIndexRef.current % portraits.length
          if (!morphing && requested !== current) beginMorph(requested)

          if (morphing) {
            const progress = Math.min((now - morphStart) / 1150, 1)
            material.uniforms.uProgress.value = progress
            if (progress >= 1) {
              current = morphTo
              morphing = false
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
      observer?.disconnect()
      if (pointer) host.removeEventListener('pointermove', pointer)
      if (pointerLeave) host.removeEventListener('pointerleave', pointerLeave)
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
      aria-label="Stipple portrait rendered as an interactive point cloud"
    />
  )
}
