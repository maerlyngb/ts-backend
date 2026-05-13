import { OpenAPIHono } from '@hono/zod-openapi'
import { requestId } from 'hono/request-id'
import { type Logger } from '../logging/logger.ts'
import { shouldLogAsError, toErrorResponse } from './error-response.ts'
import { requestLogger } from './middleware/request-logger.ts'
import { healthRoutes } from './routes/health/health.ts'

export interface ApiDependencies {
  logger: Logger
}

export function createApi(deps: ApiDependencies): OpenAPIHono {
  const api = new OpenAPIHono({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error
      }
    },
  })

  api.use('*', requestId())
  api.use('*', requestLogger(deps.logger))

  api.onError((err, c) => {
    const { status, body } = toErrorResponse(err)
    if (shouldLogAsError(status)) {
      deps.logger.error('unhandled error', { err })
    }
    return c.json(body, status)
  })

  api.notFound((c) => {
    return c.json({ error: { message: 'Route not found' } }, 404)
  })

  api.route('/health', healthRoutes)

  api.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'TS Backend',
      version: '0.1.0',
    },
  })

  return api
}
