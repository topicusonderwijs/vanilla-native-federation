import type { Remote, RemoteInfoHandler } from "./remote-info.contract";
import { NFError } from "../../native-federation.error";
import * as _path from "../../utils/path";
import type { ExternalsHandler } from "../externals";
import type { NfCache, StorageHandler } from "../storage/storage.contract";

const remoteInfoHandlerFactory = <TCache extends NfCache>(
    storage: StorageHandler<TCache>, 
    sharedInfoHandler: ExternalsHandler
): RemoteInfoHandler => {

    const fetchRemoteEntryJson = (entryUrl: string): Promise<Remote> => {
        return fetch(entryUrl)
            .then(r => {
                if (!r.ok) return Promise.reject(new NFError(`${r.status} - ${r.statusText}`));
                return r.json() as unknown as Remote;
            })
            .then(cfg => ({...cfg, baseUrl: _path.getDir(entryUrl)}))
            .catch(e => {
                return Promise.reject(new NFError(`Fetching remote from '${entryUrl}' failed: ${e.message}`));
            })
    }

    const getFromEntry = (remoteEntryUrl: string): Promise<Remote> => {
        if(!remoteEntryUrl || typeof remoteEntryUrl !== "string") 
            return Promise.reject(new NFError(`Module not registered, provide a valid remoteEntryUrl.`));

        return fetchRemoteEntryJson(remoteEntryUrl).then(addToStorage)
    }

    const getRemoteNameFromUrl = (remoteEntryUrl?: string, remoteName?: string): string|undefined => {
        if(!!remoteName) return remoteName;
        
        if(!remoteEntryUrl) return undefined;
        return storage.fetch("baseUrlToRemoteNames")[_path.getDir(remoteEntryUrl)];
    }

    const getFromCache = (remoteEntryUrl?: string, remoteName?: string): Promise<Remote> => {
        remoteName = getRemoteNameFromUrl(remoteEntryUrl, remoteName);
        if (!remoteName) return Promise.reject(new NFError("Invalid remoteEntry or remoteName"));

        const cachedRemote = storage.fetch("remoteNamesToRemote")[remoteName!]
        if (!cachedRemote) return Promise.reject(new NFError(`Remote '${remoteName}' not found in cache.`))

        return Promise.resolve(cachedRemote);
    }

    const addToStorage = (remote: Remote): Remote => {
        storage.update("remoteNamesToRemote", v => ({...v, [remote.name]: remote}));
        storage.update("baseUrlToRemoteNames", v => ({...v, [remote.baseUrl]: remote.name}));
        
        sharedInfoHandler.addToStorage(remote)

        return remote;
    }

    return {addToStorage, getFromCache, getFromEntry};
}

export {remoteInfoHandlerFactory, RemoteInfoHandler};