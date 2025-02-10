import type { ExternalsHandler, SharedInfo } from "./externals.contract";
import type { BuilderConfig } from "../../utils/config/config.contract";
import * as _path from "../../utils/path";
import type { NfCache, StorageHandler } from "../storage/storage.contract";
import type { VersionHandler } from "../version/version.contract";

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

    const appendToDependencyScope = (scopeUrl: string) => (external: SharedInfo) => (externals: NfCache["externals"]) => {
        const scope = (external.singleton) ? "global" : scopeUrl;
        externals[scope] ??= {};

        const currentVersion = externals[scope]?.[external.packageName]?.version;
        if(!currentVersion || versionHandler.compareVersions(external.version!, currentVersion) > 0) {
            externals[scope]![external.packageName] = {
                version: external.version!,
                requiredVersion: external.requiredVersion,
                url: _path.join(scopeUrl, external.outFileName),
            }
        }
        
        return externals;
    }

    function clearDependencyScope(scopeUrl: string) {
        storageHandler.update("externals", e => ({...e, [scopeUrl]: {}}));
    }

    function fromStorage(scope: 'global'|string) {
        return storageHandler.fetch('externals')[scope] ?? {};
    } 

    function toStorage(externals: SharedInfo[], scopeUrl: string) {
        clearDependencyScope(scopeUrl);

        externals
            .filter(filterByBuilderType)
            .map(appendToDependencyScope(scopeUrl))
            .forEach(updateFn => storageHandler.update("externals", updateFn));

        return externals;
    }



    return {fromStorage, toStorage};
}

export {externalsHandlerFactory};