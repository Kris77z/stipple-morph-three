# Stipple Morph — React + Three.js

A standalone React + Three.js study inspired by the stipple portrait morph interaction from a Framer experiment.

The implementation is original and does not depend on Framer. It uses a real PNG portrait as input and turns it into a GPU-rendered point cloud in the browser.

## What it does

- Renders 12k–26k points in a single Three.js `Points` draw call
- Decodes portrait PNGs and samples their alpha + grayscale values with Canvas
- Keeps point correspondence stable with Morton / Z-order sorting
- Morphs point positions on the GPU with a custom vertex shader
- Adds per-particle stagger and subtle wave/noise displacement
- Uses a soft circular fragment shader for the printed stipple look
- Adds subtle pointer repulsion
- Synchronizes the WebGL portrait with a React team carousel
- Automatically reduces particle count on mobile

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Architecture

```text
src/
├── components/
│   └── StippleMorph.tsx   # Three.js renderer + morph state
├── data/
│   └── team.ts            # Carousel content
├── lib/
│   └── pointCloud.ts      # Canvas sampling + Morton ordering
├── shaders/
│   └── stipple.ts         # Vertex + fragment shaders
├── App.tsx
├── main.tsx
└── styles.css
```

## Using portrait assets

Portrait paths live beside the team data in `src/data/team.ts`. Add PNGs under `public/portraits/` and assign a path to each member. At startup the browser loads unique sources in parallel, draws them to an offscreen Canvas, samples visible pixels according to alpha and luminance, normalizes every cloud to the same point count, and applies Morton ordering before the data reaches the shader.

Transparent PNG portraits with consistent framing work best. The included six demo states intentionally use the supplied source image with independent deterministic samples, so the morph remains visible until more portraits are added.

## Key shader idea

Each point has two positions and a random seed. The vertex shader computes a staggered interpolation:

```glsl
float delay = (aSeed - 0.5) * 0.38;
float p = clamp(uProgress * 1.38 - delay, 0.0, 1.0);
p = p * p * (3.0 - 2.0 * p);
vec3 pos = mix(aFrom, aTo, p);
```

The stagger is what makes the transition feel less like a rigid crossfade and more like the stipple image is reorganizing itself.

## Notes

This is an interaction study, not a source-code extraction of the referenced Framer project. UI copy remains placeholder content and can be replaced freely.
