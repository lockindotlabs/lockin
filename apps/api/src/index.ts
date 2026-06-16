import 'dotenv/config'
import next from 'next'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { app } from './app.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3001

// apps/api/src/ → ../../web = apps/web
const webDir = join(__dirname, '../../web')

const nextApp = next({ dev, dir: webDir })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
  app.all('*', (req, res) => handle(req, res))

  app.listen(port, () => {
    console.log(`Server running on port ${port} (API + Web)`)
  })
})
