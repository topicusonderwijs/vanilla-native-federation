import type { Remote, RemoteInfoHandler } from "./remote-info.contract";
import { NFError } from "../../native-federation.error";
import * as _path from "../../utils/path";
import { tap } from "../../utils/tap";
import type { LogHandler } from "../logging/log.contract";
import type { SharedInfoHandler } from "../shared-info";
import type { NfStorage, StorageHandler } from "../storage/storage.contract";

const remoteInfoHandlerFactory = (
    storage: StorageHandler<NfStorage>, 
    logger: LogHandler,
    sharedInfoHandler: SharedInfoHandler
): RemoteInfoHandler => {

    const addToCache = (remote: Remote, remoteName?: string): Remote => {
        if (!remoteName) remoteName = remote.name;
        storage.mutate("remoteNamesToRemote", v => ({...v, [remoteName]: remote}));
        storage.mutate("baseUrlToRemoteNames", v => ({...v, [remote.baseUrl]: remoteName}));
        
        sharedInfoHandler.addToCache(remote)

        logger.debug(`Added remote '${remoteName}' to the cache.`);

        return remote;
    }

    const getFromRemote = (entryUrl: string): Promise<Remote> => {
        return fetch(entryUrl)
            .then(r => r.json() as unknown as Remote)
            .then(cfg => ({...cfg, baseUrl: _path.getDir(entryUrl)}))
    }

    const getFromCache = (remoteEntryUrl?: string, remoteName?: string): Remote|undefined => {
        if(!remoteName) {
            if(!remoteEntryUrl) return undefined;
            remoteName = storage.fetch("baseUrlToRemoteNames")[_path.getDir(remoteEntryUrl)];
            if(!remoteName) return undefined;
        }

        return storage.fetch("remoteNamesToRemote")[remoteName!];
    }

    const get = (remoteEntryUrl?: string, remoteName?: string): Promise<Remote> => {
        if(!remoteName && !remoteEntryUrl) {
            throw new NFError("Must provide valid remoteEntry or remoteName");
        }

        const cachedRemote = getFromCache(remoteEntryUrl, remoteName);
        if (!!cachedRemote) return Promise.resolve(cachedRemote);

        logger.debug(`Remote '${remoteName ?? remoteEntryUrl}' not found in cache.`);

        if(!remoteEntryUrl) return Promise.reject(new NFError(`Module not registered, provide a valid remoteEntryUrl for '${remoteName}'`));

        return getFromRemote(remoteEntryUrl)
            .then(addToCache)
            .then(tap(m => {
                logger.debug(`Initialized Remote ${JSON.stringify({name: m.name, exposes: m.exposes})}`);
                if(!!remoteName && m.name !== remoteName) {
                    logger.warn(`Fetched remote '${m.name}' does not match requested '${remoteName}'`);
                }
            }))
            .catch(e => {
                logger.debug("Fetching remote entry failed: " + e.message)
                return Promise.reject(new NFError(`Failed to load remoteEntry '${remoteName ?? remoteEntryUrl}'`));
            })
    }

    return {addToCache, get};
}

export {remoteInfoHandlerFactory, RemoteInfoHandler};