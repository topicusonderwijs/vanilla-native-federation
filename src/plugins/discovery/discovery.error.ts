import { NFError } from "../../lib/native-federation.error";

class NFDiscoveryError extends NFError {
    constructor(message: string) {
      super(message); 
      this.name = "NFDiscoveryError"; 
    }
}

export {NFDiscoveryError}