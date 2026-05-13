import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from '@hono/zod-openapi'
import { ZodError } from 'zod'
import { AppError } from '../errors.ts'

export const errorResponseSchema = z
  .object({
    error: z.object({
      message: z.string().openapi({ example: "example with id 'abc' not found" }),
    }),
  })
  .openapi('ErrorResponse')

export type ErrorBody = z.infer<typeof errorResponseSchema>

const errorResponseDefinition = {
  content: {
    'application/json': {
      schema: errorResponseSchema,
    },
  },
}

type ErrorResponseEntry = typeof errorResponseDefinition & { description: string }

// `errorResponses` only reads the static `status` and `description` off the
// class — it never constructs one. Picking those statics off `typeof AppError`
// avoids pulling in the abstract constructor signature, which subclasses
// override with their own (e.g. `NotFoundError(resource, id)`).
type AppErrorStatics = Pick<typeof AppError, 'status' | 'description'>

export function errorResponses(...classes: AppErrorStatics[]): Record<number, ErrorResponseEntry> {
  const result: Record<number, ErrorResponseEntry> = {}
  for (const cls of classes) {
    result[cls.status] = {
      ...errorResponseDefinition,
      description: cls.description,
    }
  }
  return result
}

export interface ErrorResponse {
  status: ContentfulStatusCode
  body: ErrorBody
}

function shape(status: number, message: string): ErrorResponse {
  return {
    status: status as ContentfulStatusCode,
    body: { error: { message } },
  }
}

export function toErrorResponse(err: unknown): ErrorResponse {
  if (err instanceof AppError) {
    return shape(err.status, err.message)
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join('; ')
    return shape(400, message)
  }
  if (err instanceof HTTPException) {
    return shape(err.status, err.message)
  }
  return shape(500, 'Internal server error')
}

// 4xx are expected client errors; the request-completion access log line
// already records the status. Reserve error-level logging for 5xx, which
// signals an outcome we didn't anticipate.
export function shouldLogAsError(status: number): boolean {
  return status >= 500
}
