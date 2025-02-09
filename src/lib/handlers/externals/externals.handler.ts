import type { ExternalsHandler, SharedInfo } from "./externals.contract";
import * as _path from "../../utils/path";
import type { NfCache, StorageHandler } from "../storage/storage.contract";
import type { VersionHandler } from "../version/version.contract";
import type { Remote } from "./../remote-info/remote-info.contract";
import type { BuilderConfig } from "../../utils/config/config.contract";

/**
 * Handles the shared dependencies (Externals) from the remotes.
 * - Shared dependencies are cached in the 'externals' entry. This way the dependency HTTP calls can be
 *   reused instead of fetching the dependencies from multiple sources. 
 * @param storage 
 * @returns 
 */
const externalsHandlerFactory = (
    {builderType}: BuilderConfig,
    storageHandler: StorageHandler<NfCache>,
    versionHandler: VersionHandler
): ExternalsHandler => {


    const filterByBuilderType = (dep: SharedInfo) => 
        (builderType === 'vite') === dep.packageName.startsWith('/@id/');

    const appendSharedInfo = (dep: SharedInfo, scopeUrl: string) => (externals: NfCache["externals"]) => {
        const SCOPE = toScope(dep.singleton ? 'global' : scopeUrl)

        externals[SCOPE] ??= {};

        const currentVersion = externals[SCOPE]?.[dep.packageName]?.version;
        if(!currentVersion || versionHandler.compareVersions(dep.version, currentVersion) > 0) {
            const scope = externals[SCOPE]!;
            scope[dep.packageName] = {
                version: dep.version,
                requiredVersion: dep.requiredVersion,
                url: _path.join(scopeUrl, dep.outFileName),

            }
        }
        
        return externals;
    }

    function toScope(baseUrl: string){
        return (baseUrl === 'global') ? baseUrl : baseUrl + '/';
    }

    function getFromScope(scope: 'global'|string) {
        return storageHandler.fetch('externals')[toScope(scope)] ?? {};
    } 

    function addToStorage(remoteInfo: Remote) {
        remoteInfo.shared
            .filter(filterByBuilderType)
            .map(d => appendSharedInfo(d, remoteInfo.baseUrl))
            .forEach(mutation => {
                storageHandler.update("externals", mutation);
            });        
        return remoteInfo;
    }

    return {toScope, getFromScope, addToStorage};
}

export {externalsHandlerFactory};