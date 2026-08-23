export type PortraitCloud = {
  points: Float32Array
  revealUrl: string
  subjectMask: Uint8Array
}

type ProcessedPortrait = {
  cumulativeWeights: Float64Array
  revealUrl: string
  subjectMask: Uint8Array
  totalWeight: number
}

const SAMPLE_SIZE = 600
const PIXEL_COUNT = SAMPLE_SIZE * SAMPLE_SIZE
const BACKGROUND_THRESHOLD = 242
const CHECKERBOARD_THRESHOLD = 224

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

function isBackgroundPixel(data: Uint8ClampedArray, pixelIndex: number, threshold: number) {
  const offset = pixelIndex * 4
  if (data[offset + 3] <= 16) return true
  const luminance = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114
  return luminance >= threshold
}

function processImage(image: HTMLImageElement, backgroundThreshold: number): ProcessedPortrait {
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D is unavailable')

  const scale = Math.max(SAMPLE_SIZE / image.naturalWidth, SAMPLE_SIZE / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const offsetX = (SAMPLE_SIZE - drawWidth) / 2
  const offsetY = (SAMPLE_SIZE - drawHeight) / 2
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)

  const imageData = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  const { data } = imageData
  const exteriorBackground = new Uint8Array(PIXEL_COUNT)
  const floodQueue = new Uint32Array(PIXEL_COUNT)
  let queueStart = 0
  let queueEnd = 0

  const enqueueBackground = (pixelIndex: number) => {
    if (exteriorBackground[pixelIndex] || !isBackgroundPixel(data, pixelIndex, backgroundThreshold)) return
    exteriorBackground[pixelIndex] = 1
    floodQueue[queueEnd] = pixelIndex
    queueEnd += 1
  }

  for (let coordinate = 0; coordinate < SAMPLE_SIZE; coordinate += 1) {
    enqueueBackground(coordinate)
    enqueueBackground((SAMPLE_SIZE - 1) * SAMPLE_SIZE + coordinate)
    enqueueBackground(coordinate * SAMPLE_SIZE)
    enqueueBackground(coordinate * SAMPLE_SIZE + SAMPLE_SIZE - 1)
  }

  while (queueStart < queueEnd) {
    const pixelIndex = floodQueue[queueStart]
    queueStart += 1
    const x = pixelIndex % SAMPLE_SIZE
    const y = Math.floor(pixelIndex / SAMPLE_SIZE)
    if (x > 0) enqueueBackground(pixelIndex - 1)
    if (x < SAMPLE_SIZE - 1) enqueueBackground(pixelIndex + 1)
    if (y > 0) enqueueBackground(pixelIndex - SAMPLE_SIZE)
    if (y < SAMPLE_SIZE - 1) enqueueBackground(pixelIndex + SAMPLE_SIZE)
  }

  const subjectMask = new Uint8Array(PIXEL_COUNT)
  const cumulativeWeights = new Float64Array(PIXEL_COUNT)
  let totalWeight = 0

  for (let pixelIndex = 0; pixelIndex < PIXEL_COUNT; pixelIndex += 1) {
    const offset = pixelIndex * 4
    if (exteriorBackground[pixelIndex]) {
      data[offset + 3] = 0
    } else {
      subjectMask[pixelIndex] = 1
    }

    const luminance = (data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114) / 255
    const darkness = Math.max(0, 1 - luminance)
    const weight = exteriorBackground[pixelIndex] || darkness <= 0.12
      ? 0
      : Math.pow((darkness - 0.12) / 0.88, 3.2)
    totalWeight += weight
    cumulativeWeights[pixelIndex] = totalWeight
  }

  if (totalWeight === 0) throw new Error('Portrait contains no sampleable pixels')

  context.putImageData(imageData, 0, 0)
  return {
    cumulativeWeights,
    revealUrl: canvas.toDataURL('image/png'),
    subjectMask,
    totalWeight,
  }
}

function samplePortrait(portrait: ProcessedPortrait, count: number, seed: number) {
  const random = seededRandom(seed)
  const sampled = new Array<{ x: number; y: number }>(count)
  const { cumulativeWeights, totalWeight } = portrait

  for (let index = 0; index < count; index += 1) {
    const targetWeight = random() * totalWeight
    let low = 0
    let high = PIXEL_COUNT - 1

    while (low < high) {
      const middle = (low + high) >> 1
      if (cumulativeWeights[middle] >= targetWeight) high = middle
      else low = middle + 1
    }

    sampled[index] = {
      x: low % SAMPLE_SIZE + random() - 0.5,
      y: Math.floor(low / SAMPLE_SIZE) + random() - 0.5,
    }
  }

  sampled.sort((a, b) => a.y - b.y || a.x - b.x)
  const points = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    points[index * 3] = sampled[index].x - SAMPLE_SIZE / 2
    points[index * 3 + 1] = SAMPLE_SIZE / 2 - sampled[index].y
    points[index * 3 + 2] = 0
  }

  return points
}

export async function loadPortraitClouds(sources: string[], count: number): Promise<PortraitCloud[]> {
  const uniqueSources = [...new Set(sources)]
  const processedEntries = await Promise.all(uniqueSources.map(async (source) => {
    const image = await loadImage(source)
    const threshold = source.includes('kriswillwin') ? CHECKERBOARD_THRESHOLD : BACKGROUND_THRESHOLD
    return [source, processImage(image, threshold)] as const
  }))
  const processedBySource = new Map(processedEntries)

  return sources.map((source, index) => {
    const portrait = processedBySource.get(source)
    if (!portrait) throw new Error(`Portrait was not processed: ${source}`)
    return {
      points: samplePortrait(portrait, count, 0x91e10da5 + index * 0x9e3779b1),
      revealUrl: portrait.revealUrl,
      subjectMask: portrait.subjectMask,
    }
  })
}
