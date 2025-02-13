import type { ExternalsHandler, SharedInfo } from "./externals.contract";
import { NFError } from "../../native-federation.error";
import type { BuilderConfig } from "../../utils/config/config.contract";
import * as _path from "../../utils/path";
import type { LogHandler } from "../logging";
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
    logHandler: LogHandler,
    versionHandler: VersionHandler,

): ExternalsHandler => {

    const filterByBuilderType = (dep: SharedInfo) => 
        (builderType === 'vite') === dep.packageName.startsWith('/@id/');

    const appendToDependencyScope = (scopeUrl: string) => (external: SharedInfo) => (externals: NfCache["externals"]) => {
        const scope = (external.singleton) ? "global" : scopeUrl;
        const reqVersion = (external.strictVersion) ? 'strictRequiredVersion' : 'requiredVersion';

        externals[scope] ??= {};

        if(!externals[scope]?.[external.packageName]) {
            externals[scope]![external.packageName] = {
                version: external.version!,
                url: _path.join(scopeUrl, external.outFileName),
                [reqVersion]: versionHandler.toRange(external.requiredVersion)
            }
            
            return externals;
        }
        
        const storedExternal:Version = externals[scope]![external.packageName]!;

        if(versionHandler.compareVersions(storedExternal.version, external.version!) < 0) {
            storedExternal.version = external.version!;
            storedExternal.url = _path.join(scopeUrl, external.outFileName);
        }

        storedExternal[reqVersion] = versionHandler.getSmallestVersionRange(
            versionHandler.toRange(external.requiredVersion), 
            storedExternal[reqVersion]
        );

        if(!storedExternal[reqVersion]) {
        }
        externals[scope]![external.packageName] = storedExternal;
        
        return externals;
    }

    function clearDependencyScope(scopeUrl: string) {
        storageHandler.update("externals", e => ({...e, [scopeUrl]: {}}));
    }

    function fromStorage(scope: 'global'|string) {
        return storageHandler.fetch('externals')[scope] ?? {};
    } 

    function checkForIncompatibleSingletons(externals: SharedInfo[]): void {
        const globalExternals = storageHandler.fetch('externals')["global"];

        const sharedExternals = externals
            .filter(filterByBuilderType)
            .filter(e => e.singleton && globalExternals[e.packageName]);

        for (const newExternal of sharedExternals) {
            const currentExternal = globalExternals[newExternal.packageName]!;

            if (currentExternal.strictRequiredVersion &&  
                !versionHandler.isCompatible(newExternal.version!, currentExternal.strictRequiredVersion)) {
                throw new NFError(`[${newExternal.packageName}] Version '${newExternal.version}' is not compatible to version range '${currentExternal.strictRequiredVersion.join(" - ")}'`);
            }

            if (currentExternal.requiredVersion && 
                !versionHandler.isCompatible(newExternal.version!, currentExternal.requiredVersion)) {
                logHandler.warn(`[${newExternal.packageName}] Version '${newExternal.version}' is not compatible to version range '${currentExternal.requiredVersion.join(" - ")}'`);
            }

            const newVersionRange = versionHandler.toRange(newExternal.requiredVersion);
            if (!versionHandler.isCompatible(currentExternal.version!, newVersionRange)) {
                const err = `[${newExternal.packageName}] Stored version '${currentExternal.version}' is not compatible to version range '${newVersionRange.join(" - ")}'`;
                if(newExternal.strictVersion) throw new NFError(err);


                logHandler.warn(err);
            }
        }
    }

    function toStorage(externals: SharedInfo[], scopeUrl: string) {
        clearDependencyScope(scopeUrl);

        externals
            .filter(filterByBuilderType)
            .map(appendToDependencyScope(scopeUrl))
            .forEach(updateFn => storageHandler.update("externals", updateFn));

        return externals;
    }

    return {fromStorage, toStorage, checkForIncompatibleSingletons};
}

export {externalsHandlerFactory};