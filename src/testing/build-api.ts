import { createApi } from '../api/api.ts'
import { createLogger, type Logger } from '../logging/logger.ts'

export interface BuildTestApiOptions {
  logger?: Logger
}

export function buildTestApi(options: BuildTestApiOptions = {}) {
  // Default to a silent, non-pretty logger so tests stay quiet even when
  // NODE_ENV=test isn't set — otherwise pino-pretty spawns a worker per call.
  const logger = options.logger ?? createLogger({ level: 'silent', pretty: false })
  return createApi({ logger })
}
