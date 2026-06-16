module.exports = {
  apps: [
    {
      name: 'lockin-3001',
      cwd: './apps/api',
      script: 'src/index.ts',
      interpreter: 'node_modules/.bin/tsx',
      env: { NODE_ENV: 'development', PORT: '3001' }
    }
  ]
}
