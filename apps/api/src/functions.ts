import { onRequest } from 'firebase-functions/v2/https'
import { app } from './app.js'

// Firebase CLI (Functions Gen 2) loads .env files from the deploy SOURCE directory
// (firebase.json -> functions[0].source = "apps/api/dist"), not from apps/api/ itself.
// The `build` script copies apps/api/.env -> dist/.env so these vars (Clerk keys,
// DATABASE_URL, etc.) are uploaded as the function's environment at deploy time.
export const api = onRequest(
  {
    region: 'asia-southeast1', // Singapore — closest to Vietnam
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  app,
)
