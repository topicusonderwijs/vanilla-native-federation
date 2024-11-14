class NativeFederationError extends Error {
    constructor(message: string) {
      super(message); 
      this.name = "NFError"; 
    }
}

export {NativeFederationError}