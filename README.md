# ReleaseProof

[![CI](https://github.com/ITJayasuriya/releaseproof/actions/workflows/ci.yml/badge.svg)](https://github.com/ITJayasuriya/releaseproof/actions/workflows/ci.yml)

Open-source project in development. The development CLI builds hash-bound Lighthouse lab packets; the review viewer and remaining v1 workflows are unfinished. See [the collection contract and runnable synthetic example](docs/COLLECTIONS.md).

## Local development

Use Node 24.21.0.

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e:local # Chromium and WebKit on this Mac; CI runs all three browsers
```

Read [implementation plan](docs/IMPLEMENTATION.md), [engineering standards](docs/ENGINEERING.md) and [current status](docs/STATUS.md).

## Contributions

See [CONTRIBUTING.md](CONTRIBUTING.md). Report defects with synthetic data only.

[Live setup page](https://isuru-releaseproof.pages.dev) · [Delivery board](https://github.com/users/ITJayasuriya/projects/2) · [Setup results](docs/SETUP-RESULT.md)
