import type { FederationInfo } from "@softarc/native-federation-runtime";
import type { ForProvidingRemoteEntry } from "../../2.app/driving-ports/for-providing-remote-entry.port";
import { NFError } from "../../native-federation.error";

const remoteEntryProvider = (): ForProvidingRemoteEntry => {

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

export { remoteEntryProvider }