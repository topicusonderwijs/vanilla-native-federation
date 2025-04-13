import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { Manifest, RemoteEntryUrl } from "lib/1.domain/remote-entry/manifest.contract";
import type { RemoteName } from "lib/1.domain/remote/remote-info.contract";
import type { ForGettingRemoteEntries } from "./driver-ports/for-getting-remote-entries.port";
import type { DrivingContract } from "./driving-ports/driving.contract";

const createGetRemoteEntries = (
    {remoteEntryProvider, manifestProvider, logger, remoteInfoRepo}: DrivingContract
): ForGettingRemoteEntries => (remotesOrManifestUrl: string | Manifest = {})
    : Promise<RemoteEntry[]> => {
        
        async function fetchRemoteEntries(manifest: Manifest)
            : Promise<(RemoteEntry|false)[]> {  
                const host = await remoteEntryProvider.provideHost();
                const remotes = await Promise.all(
                    Object.entries(manifest).map(fetchRemoteEntry)
                );
                
                return [host, ...remotes];
            }

        function fetchRemoteEntry([remoteName, remoteEntryUrl]: [RemoteName, RemoteEntryUrl])
            : Promise<RemoteEntry|false> {
                if(remoteInfoRepo.contains(remoteName)) {
                    logger.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                    return Promise.resolve(false);
                }
                return remoteEntryProvider.provideRemote(remoteEntryUrl)
                    .then(notifyRemoteEntryFetched(remoteName));
            }

        const notifyRemoteEntryFetched = (remoteName: string) => (remoteEntry: RemoteEntry|false) => {
            if(!remoteEntry) return remoteEntry;

            logger.debug(`fetched '${remoteEntry.name}' from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`);

            if(remoteEntry.name !== remoteName) {
                logger.warn(`Fetched remote '${remoteEntry.name}' does not match requested '${remoteName}'.`);
            }
            
            return remoteEntry;
        }

        function removeSkippedRemotes(federationInfos: (RemoteEntry|false)[])
            : RemoteEntry[] {
                return federationInfos.filter(info => !!info);
            }

        return manifestProvider.provide(remotesOrManifestUrl)
            .then(fetchRemoteEntries)
            .then(removeSkippedRemotes)
    }


export { createGetRemoteEntries }
