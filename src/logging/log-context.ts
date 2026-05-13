import { AsyncLocalStorage } from 'node:async_hooks'

export type LogBindings = Record<string, unknown>

const store = new AsyncLocalStorage<LogBindings>()

// Ambient bindings merged into every log line emitted inside `fn`. Nested calls
// merge over the parent scope, so middleware can set `requestId` and a service
// inside that scope can layer on `userId` without losing the outer binding.
export function withLogBindings<T>(bindings: LogBindings, fn: () => T): T {
  const current = store.getStore()
  const merged = current ? { ...current, ...bindings } : bindings
  return store.run(merged, fn)
}

export function currentLogBindings(): LogBindings | undefined {
  return store.getStore()
}
