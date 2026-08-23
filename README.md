# Stipple Morph — React + Three.js

A standalone React + Three.js study inspired by the stipple portrait morph interaction from a Framer experiment.

The implementation is original and does not depend on Framer. Portraits in this repository are procedural placeholders, so the project runs without copying third-party image assets.

## What it does

- Renders 12k–26k points in a single Three.js `Points` draw call
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
│   └── pointCloud.ts      # Point generation + Morton ordering
├── shaders/
│   └── stipple.ts         # Vertex + fragment shaders
├── App.tsx
├── main.tsx
└── styles.css
```

## Using real portraits

The included demo intentionally uses procedural portrait silhouettes. For real images, replace `createPortraitCloud()` with an image sampler:

1. Draw each portrait to an offscreen canvas.
2. Read `ImageData` and sample pixels based on luminance / alpha.
3. Normalize every portrait to the same point count.
4. Sort each set with the same Morton key (or upgrade to nearest-neighbor / optimal-transport matching).
5. Feed the resulting arrays to the existing `aFrom` / `aTo` shader attributes.

Transparent PNG portraits with consistent framing work best.

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

This is an interaction study, not a source-code extraction of the referenced Framer project. UI copy and procedural portraits are placeholders and can be replaced freely.
