import type { RemoteEntry, RemoteName } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import {NF_HOST_REMOTE_ENTRY, NF_REMOTE_ENTRY_FILENAME} from "../config/namespace.contract";

type FetchManifest = (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>

const fetchManifest = (
    {}: Handlers
): FetchManifest => 
    (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry> = {}) => {
    
        const fetchManifest = (): Promise<Record<RemoteName, RemoteEntry>> => {
            return (typeof remotesOrManifestUrl === 'string')
                ? remotesOrManifestUrl.endsWith(NF_REMOTE_ENTRY_FILENAME)
                    ? Promise.resolve({[NF_HOST_REMOTE_ENTRY]: remotesOrManifestUrl})
                    : fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }

        return fetchManifest();
    }

export {FetchManifest, fetchManifest}
