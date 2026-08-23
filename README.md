# Stipple Morph — React + Three.js

A standalone React + Three.js reconstruction of the stipple portrait morph interaction from a Framer experiment.

Reference page: https://stale-millions-826025.framer.app/

The implementation is original and does not depend on Framer. It turns real portrait images into GPU-rendered point clouds in the browser.

## What it does

- Renders 80,000 points in a single Three.js `Points` draw call
- Loads all six real portrait assets and samples them with an offscreen Canvas
- Flood-fills the exterior white background before building a subject mask
- Uses cubic darkness weighting and scanline point correspondence
- Morphs point positions on the GPU with a custom vertex shader
- Reproduces the source interaction's 2-second quartic stagger and wave displacement
- Reveals the cut-out source portrait when the pointer is over the subject
- Synchronizes the WebGL portrait with the six-state team accordion and counter
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
│   └── team.ts            # Six team members + source portraits
├── lib/
│   └── pointCloud.ts      # Canvas flood fill, weighting + sampling
├── shaders/
│   └── stipple.ts         # Vertex + fragment shaders
├── App.tsx
├── main.tsx
└── styles.css
```

## Using portrait assets

Portrait paths live beside the team data in `src/data/team.ts`. Add PNG or JPEG files under `public/portraits/` and assign a path to each member. At startup the browser loads unique sources in parallel, cover-crops them to 600 × 600, removes the exterior light background, weights pixels by darkness, samples every cloud to the same point count, and sorts the results by scanline before the data reaches the shader.

Transparent PNG portraits and high-contrast portraits on a light background both work. The included six demo states use the six source portraits from the referenced Framer page.

## Key shader idea

Each point has a source and destination position. The vertex shader derives a spatial delay from the source scanline and applies quartic easing:

```glsl
float scanOrder = ((300.0 - aFrom.y) + (aFrom.x + 300.0) * 0.25) / 750.0;
float localProgress = clamp((uProgress - scanOrder * 0.25) / 0.75, 0.0, 1.0);
float eased = 1.0 - pow(1.0 - localProgress, 4.0);
vec3 position = mix(aFrom, aTo, eased);
```

The shader adds the same decaying sine/cosine wave used by the reference interaction, so the dots reorganize instead of crossfading rigidly.

## Notes

The implementation is framework-independent and does not require Framer at runtime.
