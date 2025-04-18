import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { Manifest, RemoteEntryUrl } from "lib/1.domain/remote-entry/manifest.contract";
import type { RemoteName } from "lib/1.domain/remote/remote-info.contract";
import type { ForGettingRemoteEntries } from "./driver-ports/for-getting-remote-entries.port";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LoggingConfig } from "./config/log.contract";
import { NFError } from "lib/native-federation.error";
import type { ModeConfig } from "./config/mode.contract";

/**
 * Fetch the remoteEntry.json metadata files defined in the provided manifest: 
 * 
 * @param config 
 * @param adapters 
 * @returns A list of the remoteEntries
 */
const createGetRemoteEntries = (
    config: LoggingConfig & ModeConfig,
    {remoteEntryProvider, manifestProvider, remoteInfoRepo}: DrivingContract
): ForGettingRemoteEntries => (remotesOrManifestUrl: string | Manifest = {})
    : Promise<RemoteEntry[]> => {
        
        async function fetchRemoteEntries(manifest: Manifest)
            : Promise<(RemoteEntry|false)[]> { 
                try {
                    const host = await remoteEntryProvider.provideHost().catch(handleFetchFailed);
                    const remotes = await Promise.all(
                        Object.entries(manifest).map(fetchRemoteEntry)
                    );
                    return [host, ...remotes];
                }catch(e) {
                    config.log.debug("Could not fetch remotes", e);
                    throw new NFError("Could not fetch remotes");
                }
            }

        function fetchRemoteEntry([remoteName, remoteEntryUrl]: [RemoteName, RemoteEntryUrl])
            : Promise<RemoteEntry|false> {
                if(remoteInfoRepo.contains(remoteName)) {
                    config.log.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                    return Promise.resolve(false);
                }
                return remoteEntryProvider.provideRemote(remoteEntryUrl)
                    .then(notifyRemoteEntryFetched(remoteName))
                    .catch(handleFetchFailed);
            }

        function handleFetchFailed(err: unknown): Promise<false> {
            config.log.debug(`Failed to fetch remote.`,  err)
            return (config.strict) 
                ? Promise.reject(new NFError(`Failed to fetch remoteEntry.`))
                : Promise.resolve(false);
        }
        
        const notifyRemoteEntryFetched = (remoteName: string) => (remoteEntry: RemoteEntry|false) => {
            if(!remoteEntry) return remoteEntry;

            config.log.debug(`fetched '${remoteEntry.name}' from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`);

            if(remoteEntry.name !== remoteName) {
                config.log.warn(`Fetched remote '${remoteEntry.name}' does not match requested '${remoteName}'.`);
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
