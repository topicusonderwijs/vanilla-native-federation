import type { ExternalsHandler, SharedInfo } from "./externals.contract";
import type { BuilderConfig } from "../../utils/config/config.contract";
import * as _path from "../../utils/path";
import type { NfCache, StorageHandler } from "../storage/storage.contract";
import type { Version, VersionHandler } from "../version/version.contract";

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
        const reqVersion = (external.strictVersion) ? 'requiredVersion' : 'strictRequiredVersion';

        externals[scope] ??= {};

        if(!externals[scope]?.[external.packageName]) {
            externals[scope]![external.packageName] = {
                version: external.version!,
                url: _path.join(scopeUrl, external.outFileName),
            }

            externals[scope]![external.packageName]![reqVersion] = external.requiredVersion;
            
            return externals;
        }
        
        const storedExternal:Version = externals[scope]![external.packageName]!;
        if(versionHandler.compareVersions(external.version!, storedExternal.version) > 0) {
            storedExternal.version = external.version!;
            storedExternal.url = _path.join(scopeUrl, external.outFileName);
        }

        if(!storedExternal[reqVersion] || versionHandler.compareVersions(external.requiredVersion, storedExternal[reqVersion]) < 0) {
            storedExternal[reqVersion] = external.requiredVersion;
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