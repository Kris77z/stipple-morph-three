export type Point = { x: number; y: number; z: number; order: number }

const SAMPLE_SIZE = 512
const CLOUD_WIDTH = 3.2

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

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Unable to load portrait: ${source}`))
    image.src = source
  })
}

function readImage(image: HTMLImageElement) {
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = Math.min(1, SAMPLE_SIZE / longestSide)
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D is unavailable')

  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  return { data: context.getImageData(0, 0, width, height).data, width, height }
}

function sampleImage(
  imageData: ReturnType<typeof readImage>,
  count: number,
  variant: number,
): Point[] {
  const { data, width, height } = imageData
  const random = seededRandom(0x91e10da5 + variant * 0x9e3779b1)
  const points: Point[] = []
  const targetCandidates = Math.ceil(count * 1.45)
  const maxAttempts = targetCandidates * 32
  const cloudHeight = CLOUD_WIDTH * (height / width)
  let attempts = 0

  while (points.length < targetCandidates && attempts < maxAttempts) {
    attempts += 1
    const pixelX = Math.min(width - 1, Math.floor(random() * width))
    const pixelY = Math.min(height - 1, Math.floor(random() * height))
    const offset = (pixelY * width + pixelX) * 4
    const red = data[offset]
    const green = data[offset + 1]
    const blue = data[offset + 2]
    const alpha = data[offset + 3] / 255

    if (alpha < 0.025) continue

    const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255
    const density = alpha * (0.18 + (1 - luminance) * 0.82)
    if (random() > density) continue

    const normalizedX = (pixelX + random()) / width
    const normalizedY = (pixelY + random()) / height
    const x = (normalizedX - 0.5) * CLOUD_WIDTH
    const y = (0.5 - normalizedY) * cloudHeight

    points.push({
      x,
      y,
      z: (0.5 - luminance) * 0.045 + (random() - 0.5) * 0.012,
      order: morton(normalizedX * 1023, (1 - normalizedY) * 1023),
    })
  }

  if (points.length === 0) throw new Error('Portrait contains no visible pixels')

  points.sort((a, b) => a.order - b.order)

  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.min(
      points.length - 1,
      Math.floor((index / count) * points.length),
    )
    const point = points[sourceIndex]
    return {
      ...point,
      x: point.x + (random() - 0.5) * 0.006,
      y: point.y + (random() - 0.5) * 0.006,
    }
  })
}

export async function loadPortraitClouds(sources: string[], count: number) {
  const uniqueSources = [...new Set(sources)]
  const decodedImages = await Promise.all(uniqueSources.map(async (source) => {
    const image = await loadImage(source)
    return [source, readImage(image)] as const
  }))
  const imagesBySource = new Map(decodedImages)

  return sources.map((source, index) => {
    const image = imagesBySource.get(source)
    if (!image) throw new Error(`Portrait was not decoded: ${source}`)
    return pointsToArray(sampleImage(image, count, index))
  })
}

export function pointsToArray(points: Point[]) {
  const result = new Float32Array(points.length * 3)
  points.forEach((point, index) => {
    result[index * 3] = point.x
    result[index * 3 + 1] = point.y
    result[index * 3 + 2] = point.z
  })
  return result
}
