class NFError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'NFError';
  }
}

export { NFError };
