import { serve } from '@hono/node-server'
import { createApi } from './api/api.ts'
import { createLogger } from './logging/logger.ts'

const logger = createLogger()
const api = createApi({ logger })

const port = Number(process.env.PORT ?? 3000)

const server = serve({ fetch: api.fetch, port }, (info) => {
  const base = `http://localhost:${info.port}`
  logger.info(`listening on ${base}`)
  logger.info(`  - OpenAPI JSON:  ${base}/openapi.json`)
})

// Give in-flight requests this long to finish before we force-exit on shutdown.
const SHUTDOWN_TIMEOUT_MS = 10_000

let shuttingDown = false
function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) {
    return
  }
  shuttingDown = true

  logger.info('shutting down', { signal })
  const forceExit = setTimeout(() => {
    logger.warn('forcing exit after shutdown timeout', { timeoutMs: SHUTDOWN_TIMEOUT_MS })
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS)
  forceExit.unref()

  server.close((err) => {
    if (err) {
      logger.error('error closing server', { err })
      process.exit(1)
    }
    logger.info('shutdown complete')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
