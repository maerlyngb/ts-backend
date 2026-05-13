import { describe, expect, it } from 'vitest'
import { buildTestApi } from '../../../testing/build-api.ts'

describe('health routes', () => {
  it('GET /health returns 200 with status ok', async () => {
    const api = buildTestApi()
    const res = await api.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})
