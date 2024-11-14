import type { TSharedInfo, TRemoteInfo } from "./remote-info.contract";
import type { NativeFederationProps, TCacheEntry } from "../cache/cache.contract";
import type { TCacheHandler } from "../cache/cache.handler";
import * as _path from "../utils/path";

const toExternalKey = (shared: TSharedInfo): string => {
    return `${shared.packageName}@${shared.version}`;
}

type TSharedInfoHandler = {
    mapSharedDeps: (remoteInfo: TRemoteInfo) => Record<string, string>,
    addSharedDepsToCache: (remoteInfo: TRemoteInfo) => TRemoteInfo
}

const sharedInfoHandlerFactory = (cache: TCacheHandler<{"externals": TCacheEntry<Record<string, string>>}>): TSharedInfoHandler => {
    const getSharedDepRef = (dep: TSharedInfo): string|undefined => {
        return cache.fetch("externals")[toExternalKey(dep)];
    }

    const mapSharedDeps = (remoteInfo: TRemoteInfo) => {
        return remoteInfo.shared.reduce((dependencies, moduleDep) => {
            return {
                ...dependencies,
                [moduleDep.packageName]: getSharedDepRef(moduleDep) || _path.join(remoteInfo.baseUrl, moduleDep.outFileName)
            }
        }, {});
    }

    const mapModuleDepsIntoSharedDepsList = (remoteInfo: TRemoteInfo) => (sharedList: NativeFederationProps["externals"]) => {
        return remoteInfo.shared.reduce((existing, dep) => {
            if(!existing[toExternalKey(dep)]) {
                existing[toExternalKey(dep)] = _path.join(remoteInfo.baseUrl, dep.outFileName);
            }
            return existing;
        }, sharedList)
    }

    const addSharedDepsToCache = (remoteInfo: TRemoteInfo) => {
        cache.mutate("externals", mapModuleDepsIntoSharedDepsList(remoteInfo))
        return remoteInfo;
    }

    return {mapSharedDeps, addSharedDepsToCache};
}

export {toExternalKey, sharedInfoHandlerFactory, TSharedInfoHandler};