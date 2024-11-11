import type { AvailableRemoteModules } from "./discovery.contract";
import { NFDiscoveryError } from "./discovery.error";

const verifyRequestedModules = (requested: Record<string, string|"latest">) => (availableModules: AvailableRemoteModules): Promise<AvailableRemoteModules> => {
    Object
        .entries(requested)
        .forEach(([mfeName, version]) => {
            if(!availableModules[mfeName] || availableModules[mfeName].length < 1) 
                Promise.reject(new NFDiscoveryError(`Micro frontend '${mfeName}' not found`))
            
            if(version !== "latest" && !availableModules[mfeName]!.some(m => m.metadata.version === version)){
                const availableVersions = availableModules[mfeName]!.map(m => m.metadata.version);
                Promise.reject(new NFDiscoveryError(`Micro frontend '${mfeName}' version '${version}' not found, available: [${availableVersions.join(', ')}]`))
            }
        });
    return Promise.resolve(availableModules);
}

export { verifyRequestedModules};