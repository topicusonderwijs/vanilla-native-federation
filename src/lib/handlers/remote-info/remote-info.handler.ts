import type { Remote, RemoteInfoHandler } from "./remote-info.contract";
import { NFError } from "../../native-federation.error";
import * as _path from "../../utils/path";
import type { LogHandler } from "../logging/log.contract";
import type { SharedInfoHandler } from "../shared-info/shared-info.contract";
import type { NfStorage, StorageHandler } from "../storage/storage.contract";

const remoteInfoHandlerFactory = (
    storage: StorageHandler<NfStorage>, 
    logger: LogHandler,
    sharedInfoHandler: SharedInfoHandler,
): RemoteInfoHandler => {

    const fromEntryJson = (entryUrl: string): Promise<Remote> => {
        return fetch(entryUrl)
            .then(r => r.json() as unknown as Remote)
            .then(cfg => {
                return {...cfg, baseUrl: _path.getDir(entryUrl)}
            })
    }

    const addRemoteModuleToCache = (remote: Remote, remoteName: string): Remote => {
        storage.mutate("remoteNamesToRemote", v => ({...v, [remoteName]: remote}));
        storage.mutate("baseUrlToRemoteNames", v => ({...v, [remote.baseUrl]: remoteName}));

        logger.debug(`Added remote '${remoteName}' to the cache.`);

        return remote;
    } 

    const loadRemoteInfo = (remoteEntryUrl?: string, remoteName?: string): Promise<Remote> => {
        if(!remoteName && !!remoteEntryUrl) remoteName = storage.fetch("baseUrlToRemoteNames")[_path.getDir(remoteEntryUrl)];
        if(!remoteName) return Promise.reject(new NFError("Must provide valid remoteEntry or remoteName"));

        const cachedRemote = storage.fetch("remoteNamesToRemote")[remoteName];
        if (!!cachedRemote) {
            logger.debug(`Remote '${cachedRemote.name}' retrieved from cache.`);
            return Promise.resolve(cachedRemote)
        };
        if(!remoteEntryUrl) return Promise.reject(new NFError(`Module not registered, provide a valid remoteEntryUrl for '${remoteName}'`));

        logger.debug(`Fetching '${remoteName}' remoteEntry.json from: ` + remoteEntryUrl);
        return fromEntryJson(remoteEntryUrl)
            .then(info => addRemoteModuleToCache(info, remoteName ?? info.name))
            .then(sharedInfoHandler.addSharedDepsToCache)
            .catch(e => {
                logger.error("Failed to load remoteEntry: " + (e?.message ?? e));
                return Promise.reject(new NFError("Failed to load remoteEntry"));
            })
    }

    return {loadRemoteInfo};
}

export {remoteInfoHandlerFactory, RemoteInfoHandler};