import type { FederationInfo, RemoteEntry, RemoteName } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import { NFError } from "../native-federation.error";
import { tap } from "../utils/tap";

type FetchRemoteEntries = (remotesOrManifestUrl: Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>

const fetchRemoteEntries = (
    { remoteInfoHandler, externalsHandler, logHandler }: Handlers
): FetchRemoteEntries => 
    (manifest: Record<RemoteName, RemoteEntry> = {}) => {
    
        const addRemoteEntryToStorage = (remoteEntry: string) => (remote: FederationInfo) => {
            try{
                externalsHandler.checkForIncompatibleSingletons(remote.shared);

                const remoteInfo = remoteInfoHandler.toStorage(remote, remoteEntry);
                externalsHandler.toStorage(remote.shared, remoteInfo.scopeUrl);
            }catch(e:unknown ) {
                const message = (e instanceof Error) ? e.message : String(e);
                logHandler.error(`Failed to load remote '${remote.name}': ` + message);
            }
            
            return remote;
        }


        const fetchRemoteEntries = ([remoteName, remoteEntry]: [RemoteName,RemoteEntry]): Promise<FederationInfo> => {
            return remoteInfoHandler.getFromEntry(remoteEntry)
                .then(tap(m => {
                    logHandler.debug(`Initialized remoteEntry: ${JSON.stringify({name: m.name, exposes: m.exposes})}`);
                    if(!!remoteName && m.name !== remoteName) {
                        logHandler.warn(`Fetched remote '${m.name}' does not match requested '${remoteName}'`);
                    }
                }))
                .catch(_ => {
                    logHandler.warn(`Error loading remoteEntry for ${remoteName} at '${remoteEntry}', skipping module`);
                    throw new NFError(`Error loading remoteEntry for ${remoteName} at '${remoteEntry}'`)
                })
                .then(addRemoteEntryToStorage(remoteEntry))
        }

        return Promise.resolve(Object.entries(manifest))
            .then(r => Promise.all(r.map(fetchRemoteEntries)))
            .then(_ => manifest)
    }

export {FetchRemoteEntries, fetchRemoteEntries}