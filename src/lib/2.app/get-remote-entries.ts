import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { Manifest, RemoteEntryUrl } from "lib/1.domain/remote-entry/manifest.contract";
import type { RemoteName } from "lib/1.domain/remote/remote-info.contract";
import type { ForGettingRemoteEntries } from "./driver-ports/for-getting-remote-entries.port";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LoggingConfig } from "./config/log.contract";
import { NFError } from "lib/native-federation.error";
import type { ModeConfig } from "./config/mode.contract";
import type { HostConfig } from "./config/host.contract";


export function createGetRemoteEntries(
    config: LoggingConfig & ModeConfig & HostConfig,
    ports: Pick<DrivingContract, 'remoteEntryProvider'|'manifestProvider'|'remoteInfoRepo'>
): ForGettingRemoteEntries {

    /**
     * Step 1: Fetch the remoteEntry JSON objects: 
     * 
     * A Manifest or URL to a Manifest is used as the input.  Based on the defined remotes
     * in the manifest, the library will download the remoteEntry.json files which contain the
     * metadata of the defined remotes (name, exposed modules and required dependencies a.k.a. externals)
     * 
     * @param config 
     * @param adapters 
     * @returns A list of the remoteEntry json objects
     */
    return (remotesOrManifestUrl = {}) => ports.manifestProvider
        .provide(remotesOrManifestUrl)
        .catch(err => {
            config.log.warn(`Failed to fetch manifest.`,  err);
            return Promise.reject(new NFError(`Could not fetch manifest.`));
        })
        .then(addHostRemoteEntry)
        .then(fetchRemoteEntries)
        .then(removeSkippedRemotes)


    function addHostRemoteEntry(manifest: Manifest): Manifest {
        if (!config.hostRemoteEntry) {
            return manifest;
        }

        const { name, url, cacheTag } = config.hostRemoteEntry;
        const urlWithCache = cacheTag ? `${url}?cacheTag=${cacheTag}` : url;
        
        return {
            ...manifest,
            [name]: urlWithCache
        };
    }

    async function fetchRemoteEntries(manifest: Manifest): Promise<(RemoteEntry | false)[]> {
        const fetchPromises = Object.entries(manifest).map(([remoteName, remoteEntryUrl]) => 
            fetchRemoteEntry(remoteName, remoteEntryUrl)
        );
        
        return Promise.all(fetchPromises);
    }

    async function fetchRemoteEntry(
        remoteName: RemoteName, 
        remoteEntryUrl: RemoteEntryUrl
    ): Promise<RemoteEntry | false> {
        
        if (shouldSkipCachedRemote(remoteName)) {
            config.log.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
            return false;
        }

        try {
            const remoteEntry = await ports.remoteEntryProvider.provide(remoteEntryUrl);
            return processRemoteEntry(remoteEntry, remoteName);
        } catch (error) {
            return handleRemoteEntryFetchError(error);
        }
    }

    function shouldSkipCachedRemote(remoteName: RemoteName): boolean {
        return config.profile.skipCachedRemotes && ports.remoteInfoRepo.contains(remoteName);
    }

    function processRemoteEntry(remoteEntry: RemoteEntry, expectedRemoteName: string): RemoteEntry {
        if (!!config.hostRemoteEntry && expectedRemoteName === config.hostRemoteEntry.name) {
            remoteEntry.host = true;
            remoteEntry.name = config.hostRemoteEntry!.name;
        }

        config.log.debug(
            `Fetched '${remoteEntry.name}' from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`
        );
        validateRemoteEntryName(remoteEntry, expectedRemoteName);
        
        return remoteEntry;
    }

    function validateRemoteEntryName(remoteEntry: RemoteEntry, expectedName: string): void {
        if (remoteEntry.name !== expectedName) {
            config.log.warn(
                `Fetched remote '${remoteEntry.name}' does not match requested '${expectedName}'.`
            );
        }
    }

    async function handleRemoteEntryFetchError(error: unknown): Promise<false> {
        config.log.warn('Failed to fetch remoteEntry.', error);
        
        if (config.strict) {
            throw new NFError('Could not fetch remoteEntry.');
        }
        
        return false;
    }

    function removeSkippedRemotes(remoteEntries: (RemoteEntry | false)[]): RemoteEntry[] {
        return remoteEntries.filter((entry): entry is RemoteEntry => entry !== false);
    }
}
