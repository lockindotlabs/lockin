import { onRequest } from 'firebase-functions/v2/https'
import { app } from './app.js'

// Three named exports — one per environment. Each is deployed independently:
//   master  → firebase deploy --only functions:api
//   staging → firebase deploy --only functions:apiStaging
//   dev     → firebase deploy --only functions:apiDev
//
// The build script (build / build:staging / build:dev) copies the matching
// .env / .env.staging / .env.dev into dist/.env so each function gets its
// own DB credentials, Clerk keys, and ALLOWED_ORIGINS at deploy time.
const opts = {
  region: 'asia-southeast1' as const,
  memory: '512MiB' as const,
  timeoutSeconds: 60,
}

export const api        = onRequest(opts, app)
export const apiStaging = onRequest(opts, app)
export const apiDev     = onRequest(opts, app)
