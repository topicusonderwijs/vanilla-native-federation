import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { HostConfig } from "lib/2.app/config/host.contract";
import type { ForProvidingRemoteEntries } from "lib/2.app/driving-ports/for-providing-remote-entries.port";
import { NFError } from "../../native-federation.error";

const createRemoteEntryProvider = (config: HostConfig): ForProvidingRemoteEntries => {

    const mapToJson = (response: Response) => {
        if (!response.ok) return Promise.reject(new Error(`${response.status} - ${response.statusText}`));
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

    const formatError = (remoteEntryUrl: string) => (err: unknown) => {
        const msg = (err instanceof Error) ? err.message : String(err);
        throw new NFError(`Fetch of '${remoteEntryUrl}' returned ${msg}`);
    }

    return {
        provideRemote: async function (remoteEntryUrl: string) {
            return fetch(remoteEntryUrl)
                .then(mapToJson)
                .then(fillEmptyFields(remoteEntryUrl))
                .catch(formatError(remoteEntryUrl))
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
                .catch(formatError(remoteEntryUrl));
        }
    }
}

export { createRemoteEntryProvider }