// PM2 entry point — runs the API with tsx (dev mode, no build step needed)
const { spawn } = require('child_process')
const path = require('path')

const tsx = path.join(__dirname, 'node_modules', '.bin', 'tsx.cmd')
const entry = path.join(__dirname, 'src', 'index.ts')

const proc = spawn(tsx, [entry], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
})

proc.on('exit', (code) => process.exit(code ?? 0))
