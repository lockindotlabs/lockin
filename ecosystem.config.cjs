module.exports = {
  apps: [
    {
      name: 'lockin-web-3000',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 3000',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { NODE_ENV: 'development' }
    },
    {
      name: 'lockin-api-3001',
      cwd: './apps/api',
      script: 'start.cjs',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { NODE_ENV: 'development', PORT: '3001' }
    }
  ]
}
