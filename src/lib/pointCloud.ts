export type Point = { x: number; y: number; z: number; order: number }

function morton(x: number, y: number) {
  const xx = Math.max(0, Math.min(1023, x | 0))
  const yy = Math.max(0, Math.min(1023, y | 0))
  let value = 0
  for (let i = 0; i < 10; i += 1) {
    value |= ((xx >> i) & 1) << (2 * i)
    value |= ((yy >> i) & 1) << (2 * i + 1)
  }
  return value
}

export function createPortraitCloud(variant: number, count: number): Point[] {
  const candidates: Point[] = []
  const sampleCount = Math.max(count * 3, 18000)
  const phase = variant * 0.73

  for (let i = 0; i < sampleCount; i += 1) {
    const t = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random())

    // Head + shoulders silhouette. Each variant subtly changes the profile.
    const headWidth = 0.76 + Math.sin(phase) * 0.08
    const headHeight = 1.02 + Math.cos(phase * 1.3) * 0.06
    let x = Math.cos(t) * r * headWidth
    let y = Math.sin(t) * r * headHeight + 0.58

    const useShoulders = Math.random() > 0.43
    if (useShoulders) {
      const sx = (Math.random() - 0.5) * 2.7
      const normalized = Math.abs(sx) / 1.35
      const shoulderTop = -0.38 - normalized * normalized * 0.38
      x = sx
      y = shoulderTop - Math.random() * (1.28 - normalized * 0.48)
    }

    // Carve small face/light gaps to make the procedural portraits read like stipple art.
    const eyeY = 0.72 + Math.sin(phase) * 0.04
    const eyeGap = 0.27 + Math.cos(phase) * 0.025
    const leftEye = Math.hypot(x + eyeGap, (y - eyeY) * 1.7)
    const rightEye = Math.hypot(x - eyeGap, (y - eyeY) * 1.7)
    const mouth = Math.hypot(x * 0.8, (y - 0.22) * 2.3)
    if (leftEye < 0.095 || rightEye < 0.095 || (mouth < 0.16 && Math.random() > 0.28)) continue

    x += Math.sin(y * 3.2 + phase) * 0.025
    const nx = ((x + 1.6) / 3.2) * 1023
    const ny = ((y + 1.7) / 3.4) * 1023

    candidates.push({
      x,
      y,
      z: (Math.random() - 0.5) * 0.018,
      order: morton(nx, ny),
    })
  }

  candidates.sort((a, b) => a.order - b.order)
  const points: Point[] = []
  for (let i = 0; i < count; i += 1) {
    const index = Math.min(candidates.length - 1, Math.floor((i / count) * candidates.length))
    const p = candidates[index]
    points.push({
      ...p,
      x: p.x + (Math.random() - 0.5) * 0.012,
      y: p.y + (Math.random() - 0.5) * 0.012,
    })
  }
  return points
}

export function pointsToArray(points: Point[]) {
  const result = new Float32Array(points.length * 3)
  points.forEach((p, i) => {
    result[i * 3] = p.x
    result[i * 3 + 1] = p.y
    result[i * 3 + 2] = p.z
  })
  return result
}
