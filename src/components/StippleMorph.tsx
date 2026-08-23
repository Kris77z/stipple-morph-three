import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createPortraitCloud, pointsToArray } from '../lib/pointCloud'
import { fragmentShader, vertexShader } from '../shaders/stipple'

type Props = {
  activeIndex: number
  portraitCount: number
  particleCount?: number
  pointSize?: number
}

export function StippleMorph({ activeIndex, portraitCount, particleCount = 26000, pointSize = 2.15 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const targetIndexRef = useRef(activeIndex)

  useEffect(() => {
    targetIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const mobile = window.matchMedia('(max-width: 720px)').matches
    const count = mobile ? Math.min(particleCount, 12000) : particleCount
    const clouds = Array.from({ length: portraitCount }, (_, i) => createPortraitCloud(i, count))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.z = 5.8

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    const initial = pointsToArray(clouds[activeIndex % portraitCount])
    geometry.setAttribute('position', new THREE.BufferAttribute(initial, 3))
    geometry.setAttribute('aFrom', new THREE.BufferAttribute(initial, 3))
    geometry.setAttribute('aTo', new THREE.BufferAttribute(initial.slice(), 3))

    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i += 1) seeds[i] = Math.random()
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const material = new THREE.ShaderMaterial({
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

    let current = activeIndex % portraitCount
    let morphFrom = current
    let morphTo = current
    let morphStart = performance.now()
    let morphing = false
    let raf = 0

    const beginMorph = (next: number) => {
      next %= portraitCount
      if (next === current) return
      morphFrom = current
      morphTo = next
      geometry.setAttribute('aFrom', new THREE.BufferAttribute(pointsToArray(clouds[morphFrom]), 3))
      geometry.setAttribute('aTo', new THREE.BufferAttribute(pointsToArray(clouds[morphTo]), 3))
      material.uniforms.uProgress.value = 0
      morphStart = performance.now()
      morphing = true
    }

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = host
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    const pointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 3.2
      const y = -((event.clientY - rect.top) / rect.height - 0.5) * 3.2
      material.uniforms.uPointer.value.set(x, y)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    host.addEventListener('pointermove', pointer)
    host.addEventListener('pointerleave', () => material.uniforms.uPointer.value.set(10, 10))
    resize()

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate)
      material.uniforms.uTime.value = now * 0.001

      const requested = targetIndexRef.current % portraitCount
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

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      host.removeEventListener('pointermove', pointer)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [particleCount, pointSize, portraitCount])

  return <div className="stipple-canvas" ref={hostRef} aria-hidden="true" />
}
