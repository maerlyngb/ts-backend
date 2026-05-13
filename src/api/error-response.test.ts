import { HTTPException } from 'hono/http-exception'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { NotFoundError } from '../errors.ts'
import { shouldLogAsError, toErrorResponse } from './error-response.ts'

describe('toErrorResponse', () => {
  it('passes AppError subclasses through with their status and message', () => {
    const err = new NotFoundError('widget', '123')
    const { status, body } = toErrorResponse(err)
    expect(status).toBe(404)
    expect(body.error.message).toBe(err.message)
  })

  it('translates a ZodError into a 400 with issue messages joined', () => {
    const result = z.object({ name: z.string().min(1) }).safeParse({ name: '' })
    if (result.success) {
      throw new Error('expected zod parse to fail')
    }
    const { status, body } = toErrorResponse(result.error)
    expect(status).toBe(400)
    expect(body.error.message.length).toBeGreaterThan(0)
  })

  it('passes an HTTPException through with its status and message', () => {
    const err = new HTTPException(400, { message: 'Malformed JSON in request body' })
    const { status, body } = toErrorResponse(err)
    expect(status).toBe(400)
    expect(body.error.message).toBe('Malformed JSON in request body')
  })

  it('translates an unknown thrown Error into a 500 with a hidden message', () => {
    const { status, body } = toErrorResponse(new Error('database exploded with secrets'))
    expect(status).toBe(500)
    expect(body.error.message).toBe('Internal server error')
  })

  it('translates a non-Error thrown value into a 500 with a hidden message', () => {
    const { status, body } = toErrorResponse('something went wrong')
    expect(status).toBe(500)
    expect(body.error.message).toBe('Internal server error')
  })
})

describe('shouldLogAsError', () => {
  it('returns false for 4xx — client errors are recorded by the access log', () => {
    expect(shouldLogAsError(400)).toBe(false)
    expect(shouldLogAsError(404)).toBe(false)
    expect(shouldLogAsError(409)).toBe(false)
    expect(shouldLogAsError(499)).toBe(false)
  })

  it('returns true for 5xx — outcomes we did not anticipate deserve a log line', () => {
    expect(shouldLogAsError(500)).toBe(true)
    expect(shouldLogAsError(503)).toBe(true)
  })
})
