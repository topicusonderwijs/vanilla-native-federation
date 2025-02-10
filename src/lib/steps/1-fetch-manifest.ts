import type { RemoteEntry, RemoteName } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";

type FetchManifest = (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>

const fetchManifest = (
    {}: Handlers
): FetchManifest => 
    (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry> = {}) => {
    
        const fetchManifest = (): Promise<Record<RemoteName, RemoteEntry>> => {
            return (typeof remotesOrManifestUrl === 'string')
                ? fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }

        return fetchManifest();
    }

export {FetchManifest, fetchManifest}