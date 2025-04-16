import type { Manifest } from "lib/1.domain";
import type { LoggingConfig } from "lib/2.app";
import type { ForProvidingManifest } from "lib/2.app/driving-ports/for-providing-manifest.port";
import { NFError } from "../../native-federation.error";

const createManifestProvider = (config: LoggingConfig): ForProvidingManifest => {

    function provide(remotesOrManifestUrl: string|Manifest)
        : Promise<Manifest> {
            if (typeof remotesOrManifestUrl !== 'string') 
                return Promise.resolve(remotesOrManifestUrl);
            
            return fetch(remotesOrManifestUrl)
                .then(response => {
                    if (!response.ok){
                        config.log.debug(`Fetching manifest failed: ${response.status} ${response.statusText}`);
                        throw new NFError(`Could not fetch manifest.`);
                    }
                    return response.json();
                });
        }

    return {
        provide
    }
}

export { createManifestProvider }