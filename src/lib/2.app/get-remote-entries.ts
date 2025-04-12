import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { Manifest, RemoteEntryUrl } from "lib/1.domain/remote-entry/manifest.contract";
import type { RemoteName } from "lib/1.domain/remote/remote-info.contract";
import type { ForLogging } from "./driving-ports/for-logging.port";
import type { ForProvidingManifest } from "./driving-ports/for-providing-manifest.port";
import type { ForProvidingRemoteEntry } from "./driving-ports/for-providing-remote-entry.port";
import type { ForStoringRemoteInfo } from "./driving-ports/for-storing-remote-info.port";
import type { ForGettingRemoteEntries } from "./driver-ports/for-getting-remote-entries.port";

const createGetRemotesFederationInfo = (
    manifestProvider: ForProvidingManifest,
    remoteEntryProvider: ForProvidingRemoteEntry,
    remoteInfoRepository: ForStoringRemoteInfo,
    logger: ForLogging
): ForGettingRemoteEntries => { 

    function fetchRemoteEntries(hostRemoteEntryUrl?: string)
        : (manifest: Manifest) => Promise<(RemoteEntry|false)[]> {  
            return async manifest => {
                const host = (hostRemoteEntryUrl)  
                    ? await fetchRemoteEntry(["__HOST__", hostRemoteEntryUrl]).then(markHostRemoteEntry)
                    : false;

                const remotes = await Promise.all(
                    Object.entries(manifest).map(fetchRemoteEntry)
                );
                
                return [host, ...remotes];
            };
        }

    function fetchRemoteEntry([remoteName, remoteEntryUrl]: [RemoteName, RemoteEntryUrl])
        : Promise<RemoteEntry|false> {
            if(remoteInfoRepository.contains(remoteName)) {
                logger.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                return Promise.resolve(false);
            }
            return remoteEntryProvider.provide(remoteEntryUrl)
                .then(notifyRemoteEntryFetched([remoteName, remoteEntryUrl]))
                .catch(e => {
                    logger.error(`Failed to fetch remote '${remoteName}'.`, e);
                    return false;
                });
        }

    function markHostRemoteEntry(remoteEntry: false|RemoteEntry) {
        if (!!remoteEntry) remoteEntry.host = true;
        return remoteEntry;
    }

    function notifyRemoteEntryFetched([remoteName, remoteEntryUrl]: [RemoteName, RemoteEntryUrl]) 
        : (remoteEntry: RemoteEntry) => RemoteEntry {
            return (remoteEntry) => {
                logger.debug(`fetched '${remoteEntry.name}' from '${remoteEntryUrl}', exposing: ${JSON.stringify(remoteEntry.exposes)}`);

                if(remoteEntry.name !== remoteName) {
                    logger.warn(`Fetched remote '${remoteEntry.name}' does not match requested '${remoteName}'.`);
                }
                
                return remoteEntry;
            };
        }

    function removeSkippedRemotes(federationInfos: (RemoteEntry|false)[])
        : RemoteEntry[] {
            return federationInfos.filter(info => !!info);
        }
       
        
    return async (remotesOrManifestUrl: string | Manifest = {}, hostRemoteEntryUrl?: string)
        : Promise<RemoteEntry[]> => 
            manifestProvider.provide(remotesOrManifestUrl)
                .then(fetchRemoteEntries(hostRemoteEntryUrl))
                .then(removeSkippedRemotes)
}

export { createGetRemotesFederationInfo }
