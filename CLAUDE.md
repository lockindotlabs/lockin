# lockin

Turborepo monorepo with a Next.js frontend and Next.js API routes.

## PM2 Services

| Port | Name | Type |
|------|------|------|
| 3001 | lockin-web-3001 | Next.js app + API routes |

**Terminal Commands:**
```bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 start lockin-web-3001 / pm2 stop lockin-web-3001
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
```
