# Foundations

`foundations/` exposes the raw values designers rely on in Figma.

- `colors.ts` – semantic palette + raw scales
- `typography.ts` – font stacks, weights, ramps
- `spacing.ts` – spacing scale + helpers
- `radius.ts` – corner radii
- `shadows.ts` – elevation tokens
- `transitions.ts` – easing curves and durations

These files feed the higher level tokens (Tailwind preset, CSS vars). Consume them when you need direct design references or when building tooling (tokens pipeline, docs web).

