import type { RemoteEntry, RemoteName } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import {NF_HOST_REMOTE_ENTRY, NF_REMOTE_ENTRY_FILENAME} from "../config/namespace.contract";

type FetchManifest = (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>

const fetchManifest = (
    {logHandler, remoteInfoHandler}: Handlers
): FetchManifest => 
    async (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry> = {}) => {
   
        const appendHostRemoteEntry = (manifest: Record<RemoteName, RemoteEntry>, hostRemoteEntryUrl: string)
            : Record<RemoteName, RemoteEntry> => ({
                [NF_HOST_REMOTE_ENTRY]: hostRemoteEntryUrl, 
                ...manifest 
            })
        
        const appendHostRemoteEntryIfInConfig = (manifest: Record<RemoteName, RemoteEntry>): Record<RemoteName, RemoteEntry> => {
            const hostRemoteEntryUrl = remoteInfoHandler.getHostRemoteEntryUrl();
            if(!!hostRemoteEntryUrl) {
                logHandler.debug(`Appended host '${hostRemoteEntryUrl}' from config.`)
                return appendHostRemoteEntry(manifest, hostRemoteEntryUrl);
            }
            return manifest;
        };

        const fetchManifest = (): Promise<Record<RemoteName, RemoteEntry>> => {
            return (typeof remotesOrManifestUrl === 'string')
                ? remotesOrManifestUrl.endsWith(NF_REMOTE_ENTRY_FILENAME)
                    ? Promise.resolve(appendHostRemoteEntry({}, remotesOrManifestUrl))
                    : fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }

        return fetchManifest().then(appendHostRemoteEntryIfInConfig);
    }

export {FetchManifest, fetchManifest}
