import type { ExposesInfo, FederationInfo, RemoteEntry, RemoteInfo, RemoteInfoHandler, RemoteModule } from "./remote-info.contract";
import { NFError } from "../../native-federation.error";
import * as _path from "../../utils/path";
import type { NfCache, StorageHandler } from "../storage/storage.contract";

const remoteInfoHandlerFactory = <TCache extends NfCache>(
    storageHandler: StorageHandler<TCache>, 
): RemoteInfoHandler => {

    const fetchRemoteEntryJson = (entryUrl: RemoteEntry)
        : Promise<FederationInfo> => {
            return fetch(entryUrl)
                .then(r => {
                    if (!r.ok) return Promise.reject(new NFError(`${r.status} - ${r.statusText}`));
                    return r.json() as unknown as FederationInfo;
                })
                .catch(e => {
                    return Promise.reject(new NFError(`Fetching remote from '${entryUrl}' failed: ${e.message}`));
                })
        }

    const getFromEntry = (remoteEntryUrl: RemoteEntry)
        : Promise<FederationInfo> => {
            if(!remoteEntryUrl || typeof remoteEntryUrl !== "string") 
                return Promise.reject(new NFError(`Module not registered, provide a valid remoteEntryUrl.`));

            return fetchRemoteEntryJson(remoteEntryUrl);
        }

    function toScope(baseUrl: string): string {
        if (baseUrl === "global") return baseUrl;
        return baseUrl.endsWith("remoteEntry.json") 
            ? baseUrl.slice(0, -16) 
            : baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    }

    function fromStorage(remoteName: string): RemoteInfo;
    function fromStorage(remoteName: string, exposedModule: string): RemoteModule;
    function fromStorage(remoteName: string, exposedModule?: string): RemoteInfo | RemoteModule {
        const storage = storageHandler.fetch("remotes");
        if(!storage[remoteName]) throw new NFError(`Remote '${remoteName}' not found in storage.`);

        if (!exposedModule) return storage[remoteName];
    
        const remoteModule = storage[remoteName].exposes.find(m => m.moduleName === exposedModule);
        if(!remoteModule) throw new NFError(`Exposed module '${exposedModule}' from remote '${remoteName}' not found in storage.`);
    
        return remoteModule;
    }

    function toStorage(remote: {name: string; exposes: ExposesInfo[]}, remoteEntry: string): RemoteInfo {
        const remoteInfo: RemoteInfo = {
            remoteName: remote.name,
            scopeUrl: toScope(remoteEntry),
            exposes: Object.values(remote.exposes ?? [])
                        .map(m => ({
                            moduleName: m.key,
                            url: _path.join(toScope(remoteEntry), m.outFileName) 
                        }))    
        };

        storageHandler.update("remotes", v => ({ ...v, [remote.name]: remoteInfo }));
        
        return remoteInfo;
    }

    return {toStorage, fromStorage, getFromEntry, toScope};
}

export {remoteInfoHandlerFactory, RemoteInfoHandler};