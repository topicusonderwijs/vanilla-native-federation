import type { RemoteEntry } from "lib/1.domain/remote-entry/remote-entry.contract";
import type { ForProvidingRemoteEntry } from "lib/2.app/driving-ports/for-providing-remote-entry.port";
import { NFError } from "lib/native-federation.error";

const createRemoteEntryProvider = (hostRemoteEntryUrl?: string): ForProvidingRemoteEntry => {

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
                .catch(_ => {
                    return false;
                    //return Promise.reject(new NFError(`Fetching remote metadata from '${remoteEntryUrl}' failed: ${e.message}`));
                });
        },
        provideHost: async function () {
            if (!hostRemoteEntryUrl) return Promise.resolve(false);

            return fetch(hostRemoteEntryUrl)
                .then(mapToJson)
                .then(fillEmptyFields(hostRemoteEntryUrl))
                .then(markHostRemoteEntry)
                .catch(_ => {
                    return false;
                    //return Promise.reject(new NFError(`Fetching host metadata from '${hostRemoteEntryUrl}' failed: ${e.message}`));
                });
        }
    }
}

export { createRemoteEntryProvider }