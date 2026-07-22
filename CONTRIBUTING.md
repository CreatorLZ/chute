## Setup

```bash
npm install
npm run dev
# http://localhost:3000
```

## Commands

```bash
npm test              # Run tests
npm run lint          # Lint
npm run build         # Production build
npm run registry:build   # Generate static registry JSON in public/r/
npm run registry:check   # Validate registry
```

## Fresh-install verification

```bash
npm install
npm run build
npm run registry:build
npm run registry:check
npm run test
npm run lint
```

See [DOCS.md](./DOCS.md) for full documentation.
