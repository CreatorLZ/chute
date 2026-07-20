## Local Setup

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

## Test Commands

```bash
npm run test          # Run vitest
npm run lint          # Run eslint
npm run build         # Next.js production build
```

## Registry Build

Generate static registry JSON files under `public/r/`:

```bash
npm run registry:build
```

Verify the output:

```bash
npm run registry:check
```

## Fresh-Install Verification

From a clean clone:

```bash
npm install
npm run build
npm run registry:build
npm run registry:check
npm run test
npm run lint
```
