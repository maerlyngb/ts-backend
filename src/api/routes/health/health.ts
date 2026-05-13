import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

const healthResponseSchema = z.object({ status: z.literal('ok') }).openapi('HealthResponse')

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['health'],
  summary: 'Liveness check',
  responses: {
    200: {
      content: { 'application/json': { schema: healthResponseSchema } },
      description: 'Service is healthy',
    },
  },
})

export const healthRoutes = new OpenAPIHono().openapi(healthRoute, (c) =>
  c.json({ status: 'ok' as const }, 200),
)
