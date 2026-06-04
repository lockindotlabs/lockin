import { onRequest } from 'firebase-functions/v2/https'
import { app } from './app.js'

// Env vars are loaded from apps/api/.env by Firebase CLI at deploy time
export const api = onRequest(
  {
    region: 'asia-southeast1', // Singapore — closest to Vietnam
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  app,
)
