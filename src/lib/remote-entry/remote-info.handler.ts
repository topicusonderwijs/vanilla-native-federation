import type { RemoteInfo } from "./remote-info.contract";
import type { SharedInfoHandler } from "./shared-info.handler";
import type { NativeFederationCache } from "../cache/cache.contract";
import type { CacheHandler } from "../cache/cache.handler";
import type { LogHandler } from "../logging/log.handler";
import { NFError } from "../native-federation.error";
import * as _path from "../utils/path";

type RemoteInfoHandler = {
    loadRemoteInfo: (remoteEntryUrl?: string, remoteName?: string) => Promise<RemoteInfo>
}

const remoteInfoHandlerFactory = (
    cacheHandler: CacheHandler<NativeFederationCache>, 
    logger: LogHandler,
    dependencyHandler: SharedInfoHandler,
): RemoteInfoHandler => {

    const fromEntryJson = (entryUrl: string): Promise<RemoteInfo> => {
        return fetch(entryUrl)
            .then(r => r.json() as unknown as RemoteInfo)
            .then(cfg => {
                return {...cfg, baseUrl: _path.getDir(entryUrl)}
            })
    }

    const addRemoteModuleToCache = (remoteInfo: RemoteInfo, remoteName: string): RemoteInfo => {
        cacheHandler.mutate("remoteNamesToRemote", v => ({...v, [remoteName]: remoteInfo}));
        cacheHandler.mutate("baseUrlToRemoteNames", v => ({...v, [remoteInfo.baseUrl]: remoteName}));

        logger.debug(`Added remote '${remoteName}' to the cache.`);

        return remoteInfo;
    } 

    const loadRemoteInfo = (remoteEntryUrl?: string, remoteName?: string): Promise<RemoteInfo> => {
        if(!remoteName && !!remoteEntryUrl) remoteName = cacheHandler.fetch("baseUrlToRemoteNames")[_path.getDir(remoteEntryUrl)];
        if(!remoteName) return Promise.reject(new NFError("Must provide valid remoteEntry or remoteName"));

        const cachedRemote = cacheHandler.fetch("remoteNamesToRemote")[remoteName];
        if (!!cachedRemote) {
            logger.debug(`Remote '${cachedRemote.name}' retrieved from cache.`);
            return Promise.resolve(cachedRemote)
        };
        if(!remoteEntryUrl) return Promise.reject(new NFError(`Module not registered, provide a valid remoteEntryUrl for '${remoteName}'`));

        logger.debug(`Fetching remote '${remoteName}' from: ` + remoteEntryUrl);
        return fromEntryJson(remoteEntryUrl)
            .then(info => addRemoteModuleToCache(info, remoteName ?? info.name))
            .then(dependencyHandler.addSharedDepsToCache)
            .catch(e => {
                logger.error("Failed to load remoteEntry: " + (e?.message ?? e));
                return Promise.reject(new NFError("Failed to load remoteEntry"));
            })
    }

    return {loadRemoteInfo};
}

export {remoteInfoHandlerFactory, RemoteInfoHandler};