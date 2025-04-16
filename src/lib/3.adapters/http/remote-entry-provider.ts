import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { LoggingConfig } from "lib/2.app";
import type { HostConfig } from "lib/2.app/config/host.contract";
import type { ModeConfig } from "lib/2.app/config/mode.contract";
import type { ForProvidingRemoteEntries } from "lib/2.app/driving-ports/for-providing-remote-entries.port";
import { NFError } from "lib/native-federation.error";

const createRemoteEntryProvider = (config: HostConfig & ModeConfig & LoggingConfig): ForProvidingRemoteEntries => {

    const mapToJson = (response: Response) => {
        if (!response.ok) return Promise.reject(new NFError(`${response.status} - ${response.statusText}`));
        return response.json() as Promise<RemoteEntry>;
    }

    const fillEmptyFields = (remoteEntryUrl: string) => (remoteEntry: RemoteEntry) => {
        if(!remoteEntry.exposes) remoteEntry.exposes = [];
        if(!remoteEntry.shared) remoteEntry.shared = [];
        if(!remoteEntry.url) remoteEntry.url = remoteEntryUrl;
        return remoteEntry;
    }

    const markHostRemoteEntry = (remoteEntry: RemoteEntry) => {
        remoteEntry.host = true;
        return remoteEntry;
    }

    return {
        provideRemote: async function (remoteEntryUrl: string) {
            return fetch(remoteEntryUrl)
                .then(mapToJson)
                .then(fillEmptyFields(remoteEntryUrl))
                .catch(err => {
                    config.log.debug(`Failed to fetch remote '${remoteEntryUrl}'.`,  err)
                    return (config.strict) 
                        ? Promise.reject(new NFError(`Could not fetch remote metadata`))
                        : false;
                });
        },
        provideHost: async function () {
            if (!config.hostRemoteEntry) return Promise.resolve(false);

            const remoteEntryUrl = (config.hostRemoteEntry.cacheTag) 
                ? `${config.hostRemoteEntry.url}?cacheTag=${config.hostRemoteEntry.cacheTag}`
                : config.hostRemoteEntry.url;

            return fetch(remoteEntryUrl)
                .then(mapToJson)
                .then(fillEmptyFields(remoteEntryUrl))
                .then(markHostRemoteEntry)
                .catch(err => {
                    config.log.debug(`Failed to fetch host '${remoteEntryUrl}'.`,  err)
                    return (config.strict) 
                        ? Promise.reject(new NFError(`Could not fetch host metadata`))
                        : false;
                });
        }
    }
}

export { createRemoteEntryProvider }