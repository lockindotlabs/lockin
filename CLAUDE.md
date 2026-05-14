# lockin

Turborepo monorepo with Next.js frontend and Express API.

## PM2 Services

| Port | Name | Type |
|------|------|------|
| 3000 | lockin-web-3000 | Next.js |
| 3001 | lockin-api-3001 | Express/tsx |

**Terminal Commands:**
```bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 start lockin-web-3000 / pm2 stop lockin-web-3000
pm2 start lockin-api-3001 / pm2 stop lockin-api-3001
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
```
