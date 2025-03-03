import type { FederationInfo, RemoteEntry, RemoteInfo, RemoteName } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import { tap } from "../utils/tap";
import {NF_HOST_REMOTE_ENTRY} from "../config/namespace.contract";

type FetchRemoteEntries = (remotesOrManifestUrl: Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>

const fetchRemoteEntries = (
    { remoteInfoHandler, externalsHandler, logHandler}: Handlers
): FetchRemoteEntries => 
    async (manifest: Record<RemoteName, RemoteEntry> = {}) => {
        const checkSharedExternalsCompatibility = (remote: FederationInfo): FederationInfo => {
            externalsHandler.checkForIncompatibleSingletons(remote.shared);
            return remote;
        }

        const addRemoteEntryToStorage = (remoteEntry: string) => (remote: FederationInfo): RemoteInfo|false => {
            const remoteInfo = remoteInfoHandler.toStorage(remote, remoteEntry);
            externalsHandler.toStorage(remote.shared, remoteInfo.scopeUrl);

            if(remote.exposes.length < 1){
                logHandler.debug(`RemoteEntry '${remote.name}' does not expose any modules.`)
            }

            return remoteInfo;
        }

        const fetchRemoteEntry = ([remoteName, remoteEntry]: [RemoteName,RemoteEntry]): Promise<RemoteInfo|false> => {
            if(remoteInfoHandler.inStorage(remoteName)) {
                logHandler.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                return Promise.resolve(remoteInfoHandler.fromStorage(remoteName));
            }
            return remoteInfoHandler.fetchRemoteEntry(remoteEntry)
                .then(tap(federationInfo => {
                    logHandler.debug(`fetched '${remoteEntry}': ${JSON.stringify({name: federationInfo.name, exposes: federationInfo.exposes})}`);
                    
                    if(federationInfo.name !== remoteName) {
                        if(remoteName === NF_HOST_REMOTE_ENTRY) {
                            federationInfo.name = remoteName;
                        } else {
                            logHandler.warn(`Fetched remote '${federationInfo.name}' does not match requested '${remoteName}'.`);
                        }
                    }
                }))
                .then(checkSharedExternalsCompatibility)
                .then(addRemoteEntryToStorage(remoteEntry))
                .catch(e => {
                    const message = (e instanceof Error) ? e.message : String(e);
                    logHandler.error(`Failed to initialize remote '${remoteName}'.`);
                    logHandler.debug(`Remote '${remoteName}' init failed: ` + message);
                    return false;
                })
        }

        return Promise.resolve(Object.entries(manifest))
            .then(r => Promise.all(r.map(fetchRemoteEntry)))
            .then(_ => manifest)
    }

export {FetchRemoteEntries, fetchRemoteEntries}
