import type { SharedInfoHandler, SharedInfo } from "./shared-info.contract";
import type { Config } from "../../utils";
import * as _path from "../../utils/path";
import type { NfCache, StorageHandler } from "../storage/storage.contract";
import type { Remote } from "./../remote-info/remote-info.contract";

/**
 * Handles the shared dependencies (Externals) from the remotes.
 * - Shared dependencies are cached in the 'externals' entry. This way the dependency HTTP calls can be
 *   reused instead of fetching the dependencies from multiple sources. 
 * @param storage 
 * @returns 
 */
const sharedInfoHandlerFactory = (
    {builderType}: Config<NfCache>,
    storage: StorageHandler<NfCache>
): SharedInfoHandler => {

    const toExternalKey = (shared: SharedInfo): string => {
        return `${shared.packageName}@${shared.version}`;
    }

    const getCachedSharedDepUrl = (dep: SharedInfo): string|undefined => {
        return storage.fetch("externals")[toExternalKey(dep)];
    }

    const filterByBuilderType = (dep: SharedInfo) => 
        (builderType === 'vite') === dep.packageName.startsWith('/@id/');

    const mapSharedDeps = (remoteInfo: Remote) => {
        return remoteInfo.shared
            .filter(filterByBuilderType)
            .reduce((dependencies, moduleDep) => ({
                ...dependencies,
                [moduleDep.packageName]: getCachedSharedDepUrl(moduleDep) || _path.join(remoteInfo.baseUrl, moduleDep.outFileName)
            }), {});
    }

    const addToExternalsList = (remoteInfo: Remote) => (externals: NfCache["externals"]) => {
        return remoteInfo.shared
                .filter(filterByBuilderType)
                .reduce((existing, dep) => {
                    if(!existing[toExternalKey(dep)]) {
                        existing[toExternalKey(dep)] = _path.join(remoteInfo.baseUrl, dep.outFileName);
                    }
                    return existing;
                }, externals)
    }

    const addToCache = (remoteInfo: Remote) => {
        const mutation = addToExternalsList(remoteInfo);
        storage.update("externals", mutation)
        return remoteInfo;
    }

    return {mapSharedDeps, addToCache};
}

export {sharedInfoHandlerFactory};