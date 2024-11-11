import type { SharedConfig } from "./shared-config";
import type { NativeFederationProps, TCacheEntry } from "../cache/cache.contract";
import type { TCacheHandler } from "../cache/cache.handler";
import type { RemoteInfo } from "../remote-info/remote-info.contract";
import * as _path from "../utils/path";

const toExternalKey = (shared: SharedConfig): string => {
    return `${shared.packageName}@${shared.version}`;
}

type TDependencyHandler = {
    mapSharedDeps: (remoteInfo: RemoteInfo) => Record<string, string>,
    addSharedDepsToCache: (remoteInfo: RemoteInfo) => RemoteInfo
}

const dependencyHandlerFactory = (cache: TCacheHandler<{"externals": TCacheEntry<Record<string, string>>}>): TDependencyHandler => {
    const getSharedDepRef = (dep: SharedConfig): string|undefined => {
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

export {toExternalKey, dependencyHandlerFactory, TDependencyHandler};