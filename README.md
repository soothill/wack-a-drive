# Wack a Drive

A touch-first browser arcade game built with Phaser 4, TypeScript, and Vite. Hit unstable hard drives as they eject from a nine-bay rack during a 45-second shift.

Play at [wack-a-mole.soothill.com](https://wack-a-mole.soothill.com).

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The same pointer controls support touchscreens and desktop mice.

## Verify

```bash
npm test
npm run typecheck
npm run build
```

The game stores only the best score in local browser storage under `wack-a-drive:v1:best-score`.

## Deployment

Pushes to `main` are tested, built, and deployed to GitHub Pages by the workflow in
`.github/workflows/deploy-pages.yml`. The Pages custom domain is configured as
`wack-a-mole.soothill.com`.
