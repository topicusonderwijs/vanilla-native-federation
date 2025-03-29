import type { ExternalsHandler, SharedInfo } from "./externals.contract";
import { NFError } from "../../native-federation.error";
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
    storageHandler: StorageHandler<NfCache>,
    logHandler: LogHandler,
    versionHandler: VersionHandler,

): ExternalsHandler => {

    const appendToDependencyScope = (scopeUrl: string) => (external: SharedInfo) => (externals: NfCache["externals"]) => {
        if (!external.version || !versionHandler.isValid(external.version)) {
            logHandler.warn(`[${scopeUrl}][${external.packageName}] Version '${external.version}' is not a valid version.`);
        }
        const scope = (external.singleton) ? "global" : scopeUrl;
        const reqVersion = (external.strictVersion) ? 'strictRequiredVersion' : 'requiredVersion';

        externals[scope] ??= {};

        if(!externals[scope]?.[external.packageName]) {
            externals[scope]![external.packageName] = {
                version: external.version!,
                url: _path.join(scopeUrl, external.outFileName),
                [reqVersion]: external.requiredVersion
            }
            
            return externals;
        }
        
        const storedExternal:Version = externals[scope]![external.packageName]!;

        if(versionHandler.compareVersions(storedExternal.version, external.version!) < 0) {
            storedExternal.version = external.version!;
            storedExternal.url = _path.join(scopeUrl, external.outFileName);
        }

        storedExternal[reqVersion] = versionHandler.getSmallestVersionRange(
            external.requiredVersion, 
            storedExternal[reqVersion]
        );

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
            .filter(e => e.singleton && globalExternals[e.packageName]);

        for (const newExternal of sharedExternals) {
            const currentExternal = globalExternals[newExternal.packageName]!;

            if (!newExternal.version || !versionHandler.isValid(newExternal.version)) {
                throw new NFError(`[${newExternal.packageName}] Shared version '${newExternal.version}' is not a valid version.`);
            }
            if (currentExternal.strictRequiredVersion &&  
                !versionHandler.isCompatible(newExternal.version!, currentExternal.strictRequiredVersion)) {
                throw new NFError(`[${newExternal.packageName}] Shared (strict) version '${newExternal.version}' is not compatible to version range '${currentExternal.strictRequiredVersion}'`);
            }

            if (currentExternal.requiredVersion && 
                !versionHandler.isCompatible(newExternal.version!, currentExternal.requiredVersion)) {
                logHandler.warn(`[${newExternal.packageName}] Shared version '${newExternal.version}' is not compatible to version range '${currentExternal.requiredVersion}'`);
            }

            if (!versionHandler.isCompatible(currentExternal.version!, newExternal.requiredVersion)) {
                const err = `[${newExternal.packageName}] Stored shared version '${currentExternal.version}' is not compatible to version range '${newExternal.requiredVersion}'`;
                if(newExternal.strictVersion) throw new NFError(err);


                logHandler.warn(err);
            }
        }
    }

    function toStorage(externals: SharedInfo[], scopeUrl: string) {
        checkForIncompatibleSingletons(externals);
        clearDependencyScope(scopeUrl);

        externals
            .map(appendToDependencyScope(scopeUrl))
            .forEach(updateFn => storageHandler.update("externals", updateFn));

        return externals;
    }

    return {fromStorage, toStorage, checkForIncompatibleSingletons};
}

export {externalsHandlerFactory};
