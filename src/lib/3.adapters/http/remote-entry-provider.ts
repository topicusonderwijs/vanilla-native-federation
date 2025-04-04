import type { FederationInfo } from "lib/1.domain/remote-entry.contract";
import type { ForProvidingRemoteEntry } from "lib/2.app/driving-ports/for-providing-remote-entry.port";
import { NFError } from "lib/native-federation.error";

const createRemoteEntryProvider = (): ForProvidingRemoteEntry => {

    async function provide(remoteEntryUrl: string)
        : Promise<FederationInfo> {
            return fetch(remoteEntryUrl)
                .then(r => {
                    if (!r.ok) return Promise.reject(new NFError(`${r.status} - ${r.statusText}`));
                    return r.json() as Promise<FederationInfo>;
                })
                .then(federationInfo => {
                    if(!federationInfo.exposes) federationInfo.exposes = [];
                    if(!federationInfo.shared) federationInfo.shared = [];
                    return federationInfo;
                })
                .catch(e => {
                    return Promise.reject(new NFError(`Fetching remote from '${remoteEntryUrl}' failed: ${e.message}`));
                })
        }

    return {
        provide
    }
}

export { createRemoteEntryProvider }