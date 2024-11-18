import type { SharedInfo, RemoteInfo } from "./remote-info.contract";
import type { NativeFederationProps, CacheEntry } from "../cache/cache.contract";
import type { CacheHandler } from "../cache/cache.handler";
import * as _path from "../utils/path";

const toExternalKey = (shared: SharedInfo): string => {
    return `${shared.packageName}@${shared.version}`;
}

type SharedInfoHandler = {
    mapSharedDeps: (remoteInfo: RemoteInfo) => Record<string, string>,
    addSharedDepsToCache: (remoteInfo: RemoteInfo) => RemoteInfo
}

const sharedInfoHandlerFactory = (cache: CacheHandler<{"externals": CacheEntry<Record<string, string>>}>): SharedInfoHandler => {
    const getSharedDepRef = (dep: SharedInfo): string|undefined => {
        return cache.fetch("externals")[toExternalKey(dep)];
    }

    const mapSharedDeps = (remoteInfo: RemoteInfo) => {
        return remoteInfo.shared.reduce((dependencies, moduleDep) => {
            return {
                ...dependencies,
                [moduleDep.packageName]: getSharedDepRef(moduleDep) || _path.join(remoteInfo.baseUrl, moduleDep.outFileName)
            }
        }, {});
    }

    const mapModuleDepsIntoSharedDepsList = (remoteInfo: RemoteInfo) => (sharedList: NativeFederationProps["externals"]) => {
        return remoteInfo.shared.reduce((existing, dep) => {
            if(!existing[toExternalKey(dep)]) {
                existing[toExternalKey(dep)] = _path.join(remoteInfo.baseUrl, dep.outFileName);
            }
            return existing;
        }, sharedList)
    }

    const addSharedDepsToCache = (remoteInfo: RemoteInfo) => {
        cache.mutate("externals", mapModuleDepsIntoSharedDepsList(remoteInfo))
        return remoteInfo;
    }

    return {mapSharedDeps, addSharedDepsToCache};
}

export {toExternalKey, sharedInfoHandlerFactory, SharedInfoHandler};