import type { SharedInfoHandler, SharedInfo } from "./shared-info.contract";
import * as _path from "../../utils/path";
import type { NfCache, StorageEntry } from "../storage/storage.contract";
import type { StorageHandler } from "../storage/storage.handler";
import type { Remote } from "./../remote-info/remote-info.contract";

/**
 * Handles the shared dependencies (Externals) from the remotes.
 * - Shared dependencies are cached in the 'externals' entry. This way the dependency HTTP calls can be
 *   reused instead of fetching the dependencies from multiple sources. 
 * @param storage 
 * @returns 
 */
const sharedInfoHandlerFactory = (
    storage: StorageHandler<{"externals": StorageEntry<Record<string, string>>}>
): SharedInfoHandler => {

    const toExternalKey = (shared: SharedInfo): string => {
        return `${shared.packageName}@${shared.version}`;
    }

    const getCachedSharedDepUrl = (dep: SharedInfo): string|undefined => {
        return storage.fetch("externals")[toExternalKey(dep)];
    }

    const mapSharedDeps = (remoteInfo: Remote) => {
        return remoteInfo.shared
            .reduce((dependencies, moduleDep) => ({
                ...dependencies,
                [moduleDep.packageName]: getCachedSharedDepUrl(moduleDep) || _path.join(remoteInfo.baseUrl, moduleDep.outFileName)
            }), {});
    }

    const addToExternalsList = (remoteInfo: Remote) => (externals: NfCache["externals"]) => {
        return remoteInfo.shared.reduce((existing, dep) => {
            if(!existing[toExternalKey(dep)]) {
                existing[toExternalKey(dep)] = _path.join(remoteInfo.baseUrl, dep.outFileName);
            }
            return existing;
        }, externals)
    }

    const addToCache = (remoteInfo: Remote) => {
        const mutation = addToExternalsList(remoteInfo);
        storage.mutate("externals", mutation)
        return remoteInfo;
    }

    return {mapSharedDeps, addToCache};
}

export {sharedInfoHandlerFactory};