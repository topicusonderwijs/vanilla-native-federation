import { NativeFederationError } from "../native-federation-error";

class NFDiscoveryError extends NativeFederationError {
    constructor(message: string) {
      super(message); 
      this.name = "NFDiscoveryError"; 
    }
}

export {NFDiscoveryError}