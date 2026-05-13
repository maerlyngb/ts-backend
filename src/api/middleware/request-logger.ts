import type { MiddlewareHandler } from 'hono'
import type { RequestIdVariables } from 'hono/request-id'
import { withLogBindings } from '../../logging/log-context.ts'
import { type Logger } from '../../logging/logger.ts'

export function requestLogger(
  logger: Logger,
): MiddlewareHandler<{ Variables: RequestIdVariables }> {
  return async (c, next) => {
    const requestId = c.get('requestId')
    const start = Date.now()

    await withLogBindings({ requestId }, async () => {
      try {
        await next()
      } finally {
        logger.info('request completed', {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          durationMs: Date.now() - start,
        })
      }
    })
  }
}
