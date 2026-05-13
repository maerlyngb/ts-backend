// Subclasses declare `status` and `description` statically so
// `errorResponses(...classes)` can read them off the constructor without
// instantiating. The base constructor copies `status` onto the instance so
// `toErrorResponse` can read it off a thrown value.
export abstract class AppError extends Error {
  declare static readonly status: number
  declare static readonly description: string
  readonly status: number

  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = this.constructor.name
    this.status = (this.constructor as typeof AppError).status
  }
}

export class NotFoundError extends AppError {
  static override readonly status = 404
  static override readonly description = 'Resource not found'

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`)
  }
}

export class ValidationError extends AppError {
  static override readonly status = 400
  static override readonly description = 'Validation failed'
}

export class ConflictError extends AppError {
  static override readonly status = 409
  static override readonly description = 'Conflict'
}
