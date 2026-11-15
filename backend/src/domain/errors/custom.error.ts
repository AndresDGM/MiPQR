export class CustomError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'CustomError';
  }

  static badRequest(message: string): CustomError {
    return new CustomError(message, 400);
  }

  static unauthorized(message: string): CustomError {
    return new CustomError(message, 401);
  }

  static forbidden(message: string): CustomError {
    return new CustomError(message, 403);
  }

  static notFound(message: string): CustomError {
    return new CustomError(message, 404);
  }

  static conflict(message: string): CustomError {
    return new CustomError(message, 409);
  }
}
