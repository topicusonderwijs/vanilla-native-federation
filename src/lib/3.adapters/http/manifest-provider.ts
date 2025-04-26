import type { Manifest } from "lib/1.domain/public_api";
import type { ForProvidingManifest } from "lib/2.app/driving-ports/for-providing-manifest.port";
import { NFError } from "lib/native-federation.error";

const createManifestProvider = (): ForProvidingManifest => {
    const mapToJson = (response: Response) => {
        if (!response.ok) return Promise.reject(new NFError(`${response.status} - ${response.statusText}`));
        return response.json() as Promise<Manifest>;
    }

    const formatError = (remoteEntryUrl: string) => (err: unknown) => {
        const msg = (err instanceof Error) ? err.message : String(err);
        throw new NFError(`Fetch of '${remoteEntryUrl}' returned ${msg}`);
    }

    return {
        provide: async function (remotesOrManifestUrl: string|Manifest) {
            if (typeof remotesOrManifestUrl !== 'string') 
                return Promise.resolve(remotesOrManifestUrl);
            
            return fetch(remotesOrManifestUrl)
                .then(mapToJson)
                .catch(formatError(remotesOrManifestUrl));
        }
    }
}

export { createManifestProvider }