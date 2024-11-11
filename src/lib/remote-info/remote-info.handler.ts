import type { RemoteEntry, RemoteInfo } from "./remote-info.contract";
import type { NativeFederationCache } from "../cache/cache.contract";
import type { TCacheHandler } from "../cache/cache.handler";
import type { TDependencyHandler } from "../dependency/dependency.handler";
import * as _path from "../utils/path";

type TRemoteInfoHandler = {
    loadRemoteInfo: (remoteEntryUrl?: string, remoteName?: string) => Promise<RemoteInfo>
}

const remoteInfoHandlerFactory = (cacheHandler: TCacheHandler<NativeFederationCache>, dependencyHandler: TDependencyHandler): TRemoteInfoHandler => {

    const fromEntryJson = (entryUrl: string): Promise<RemoteInfo> => {
        return fetch(entryUrl)
            .then(r => r.json() as unknown as RemoteEntry)
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

export {remoteInfoHandlerFactory, TRemoteInfoHandler};