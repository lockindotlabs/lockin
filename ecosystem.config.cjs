module.exports = {
  apps: [
    {
      name: 'lockin-3001',
      cwd: './apps/api',
      script: 'start.cjs',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { NODE_ENV: 'development', PORT: '3001' }
    }
  ]
}
