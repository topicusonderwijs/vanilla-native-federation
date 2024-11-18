import type { RemoteInfo } from "./remote-info.contract";
import type { SharedInfoHandler } from "./shared-info.handler";
import type { NativeFederationCache } from "../cache/cache.contract";
import type { CacheHandler } from "../cache/cache.handler";
import * as _path from "../utils/path";

type RemoteInfoHandler = {
    loadRemoteInfo: (remoteEntryUrl?: string, remoteName?: string) => Promise<RemoteInfo>
}

const remoteInfoHandlerFactory = (cacheHandler: CacheHandler<NativeFederationCache>, dependencyHandler: SharedInfoHandler): RemoteInfoHandler => {

    const fromEntryJson = (entryUrl: string): Promise<RemoteInfo> => {
        return fetch(entryUrl)
            .then(r => r.json() as unknown as RemoteInfo)
            .then(cfg => ({...cfg, baseUrl: _path.getDir(entryUrl)}))
    }

    const addRemoteModuleToCache = (remoteInfo: RemoteInfo, remoteName: string): RemoteInfo => {
        cacheHandler.mutate("remoteNamesToRemote", v => ({...v, [remoteName]: remoteInfo}));
        cacheHandler.mutate("baseUrlToRemoteNames", v => ({...v, [remoteInfo.baseUrl]: remoteName}));
        return remoteInfo;
    } 

    const loadRemoteInfo = (remoteEntryUrl?: string, remoteName?: string): Promise<RemoteInfo> => {
        if(!remoteName && !!remoteEntryUrl) remoteName = cacheHandler.fetch("baseUrlToRemoteNames")[_path.getDir(remoteEntryUrl)];
        if(!remoteName) return Promise.reject("Must provide valid remoteEntry or remoteName");

        const cachedRemote = cacheHandler.fetch("remoteNamesToRemote")[remoteName];
        if (!!cachedRemote) return Promise.resolve(cachedRemote);
        if(!remoteEntryUrl) return Promise.reject(`Module not registered, provide a valid remoteEntryUrl for '${remoteName}'`);

        return fromEntryJson(remoteEntryUrl)
            .then(info => addRemoteModuleToCache(info, remoteName ?? info.name))
            .then(dependencyHandler.addSharedDepsToCache)
    }

    return {loadRemoteInfo};
}

export {remoteInfoHandlerFactory, RemoteInfoHandler};