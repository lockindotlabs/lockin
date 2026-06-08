import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/functions.ts'],
  format: ['esm'],
  outDir: 'dist',
  splitting: false,
  sourcemap: false,
  clean: true,
  // Bundle only workspace packages (not on npm — must be inlined)
  noExternal: [/^@workspace\//],
  // Keep CJS packages external — they run from node_modules at runtime
  // @prisma/client uses require('path'/'fs') internally which breaks in ESM bundles
  external: ['dotenv', 'dotenv/config', /^@prisma\//, 'pg', 'pg-native'],
})
