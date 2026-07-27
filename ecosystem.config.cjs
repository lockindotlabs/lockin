module.exports = {
  apps: [
    {
      name: 'lockin-web-3001',
      cwd: './apps/web',
      script: './node_modules/next/dist/bin/next',
      args: 'dev -p 3001 --turbopack',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { NODE_ENV: 'development', PORT: '3001' }
    }
  ]
}
