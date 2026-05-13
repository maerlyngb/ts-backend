import pino, { type Logger as PinoLoggerType } from 'pino'
import { currentLogBindings } from './log-context.ts'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LOG_LEVELS: ReadonlySet<string> = new Set<LogLevel>([
  'debug',
  'info',
  'warn',
  'error',
  'silent',
])

function isLogLevel(value: string): value is LogLevel {
  return LOG_LEVELS.has(value)
}

function parseLevel(raw: string | undefined): LogLevel | undefined {
  if (!raw) {
    return undefined
  }
  if (!isLogLevel(raw)) {
    return undefined
  }
  return raw
}

// Pass thrown errors on the `err` field so pino's `errWithCause` serializer
// (wired in `createLogger`) walks the `cause` chain and emits a stack.
export type LogMeta = Record<string, unknown>

export class Logger {
  private readonly pino: PinoLoggerType

  constructor(pinoInstance: PinoLoggerType) {
    this.pino = pinoInstance
  }

  debug(message: string, meta?: LogMeta): void {
    this.pino.debug(meta, message)
  }

  info(message: string, meta?: LogMeta): void {
    this.pino.info(meta, message)
  }

  warn(message: string, meta?: LogMeta): void {
    this.pino.warn(meta, message)
  }

  // Use only at terminal handlers (the central `onError`, top-level catches that
  // swallow). Don't log-and-rethrow — the upstream handler will log again.
  error(message: string, meta?: LogMeta): void {
    this.pino.error(meta, message)
  }

  // Returns a derived logger that adds `bindings` to every line it emits.
  // Use at construction time to tag a service / component, e.g.
  // `this.logger = logger.child({ service: 'example' })`.
  child(bindings: LogMeta): Logger {
    return new Logger(this.pino.child(bindings))
  }
}

export interface CreateLoggerOptions {
  level?: LogLevel
  pretty?: boolean
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const isProduction = process.env.NODE_ENV === 'production'
  const isTest = process.env.NODE_ENV === 'test'

  // In test mode, default to `warn` so info-level chatter (request access lines,
  // service events) stays quiet on green but unexpected 5xx errors still surface.
  // `LOG_LEVEL=debug npm test` to see everything when diagnosing.
  const defaultLevel: LogLevel = isTest ? 'warn' : 'info'
  const level = options.level ?? parseLevel(process.env.LOG_LEVEL) ?? defaultLevel

  const pretty = options.pretty ?? (!isProduction && !isTest)
  const prettyTransport = {
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  }
  const transportOptions = pretty ? prettyTransport : {}

  const pinoInstance = pino({
    level,
    serializers: { err: pino.stdSerializers.errWithCause },
    mixin() {
      return currentLogBindings() ?? {}
    },
    ...transportOptions,
  })

  return new Logger(pinoInstance)
}
