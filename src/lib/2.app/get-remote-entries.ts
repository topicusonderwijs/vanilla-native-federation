import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { Manifest, RemoteEntryUrl } from "lib/1.domain/remote-entry/manifest.contract";
import type { RemoteName } from "lib/1.domain/remote/remote-info.contract";
import type { ForGettingRemoteEntries } from "./driver-ports/for-getting-remote-entries.port";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LoggingConfig } from "./config/log.contract";
import { NFError } from "../native-federation.error";
import type { ModeConfig } from "./config/mode.contract";
import type { HostConfig } from "./config/host.contract";

/**
 * Fetch the remoteEntry.json metadata files defined in the provided manifest: 
 * 
 * @param config 
 * @param adapters 
 * @returns A list of the remoteEntries
 */
const createGetRemoteEntries = (
    config: LoggingConfig & ModeConfig & HostConfig,
    {remoteEntryProvider, manifestProvider, remoteInfoRepo}: Pick<DrivingContract, 'remoteEntryProvider'|'manifestProvider'|'remoteInfoRepo'>
): ForGettingRemoteEntries => (remotesOrManifestUrl: string | Manifest = {})
    : Promise<RemoteEntry[]> => {
        
        function addHostRemoteEntry(manifest: Manifest)
            : Manifest {
                if(!!config.hostRemoteEntry) {
                    manifest["__NF-HOST__"] = (config.hostRemoteEntry.cacheTag) 
                        ? `${config.hostRemoteEntry.url}?cacheTag=${config.hostRemoteEntry.cacheTag}`
                        : config.hostRemoteEntry.url;
                }
                return manifest;
            }

        async function fetchRemoteEntries(manifest: Manifest)
            : Promise<(RemoteEntry|false)[]> { 
                return Promise.all(
                    Object.entries(manifest).map(fetchRemoteEntry)
                );
            }

        function fetchRemoteEntry([remoteName, remoteEntryUrl]: [RemoteName, RemoteEntryUrl])
            : Promise<RemoteEntry|false> {
                if(remoteInfoRepo.contains(remoteName)) {
                    config.log.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                    return Promise.resolve(false);
                }
                return remoteEntryProvider.provide(remoteEntryUrl)
                    .then(verifyRemoteEntry(remoteName))
                    .catch(handleFetchFailed);
            }

        const handleFetchFailed = (err: unknown): Promise<false> => {
            config.log.warn(`Failed to fetch remoteEntry.`,  err)
            return (config.strict) 
                ? Promise.reject(new NFError(`Could not fetch remoteEntry.`))
                : Promise.resolve(false);
        }
        
        const verifyRemoteEntry = (remoteName: string) => (remoteEntry: RemoteEntry) => {
            if(remoteName === "__NF-HOST__") {
                remoteEntry.host = true;
                if (!remoteEntry.name) remoteEntry.name = remoteName;
            }

            config.log.debug(`fetched '${remoteEntry.name}' from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`);

            if(!remoteEntry.host && remoteEntry.name !== remoteName) {
                config.log.warn(`Fetched remote '${remoteEntry.name}' does not match requested '${remoteName}'.`);
            }
            
            return remoteEntry;
        }

        function removeSkippedRemotes(federationInfos: (RemoteEntry|false)[])
            : RemoteEntry[] {
                return federationInfos.filter(info => !!info);
            }

        return manifestProvider.provide(remotesOrManifestUrl)
            .catch(err => {
                config.log.warn(`Failed to fetch manifest.`,  err);
                return Promise.reject(new NFError(`Could not fetch manifest.`));
            })
            .then(addHostRemoteEntry)
            .then(fetchRemoteEntries)
            .then(removeSkippedRemotes)
    }


export { createGetRemoteEntries }
