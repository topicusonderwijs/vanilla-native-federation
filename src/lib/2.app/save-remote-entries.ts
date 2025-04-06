
import type { ForLogging } from "./driving-ports/for-logging.port";
import type { ForStoringRemoteInfo } from "./driving-ports/for-storing-remote-info.port";
import type { ForSavingRemoteEntries } from "./driver-ports/for-saving-remote-entries.port";
import type { RemoteEntry, RemoteInfo } from "lib/1.domain";
import type { ForResolvingPaths } from "./driving-ports/for-resolving-paths.port";
import type { ForStoringExternals } from "./driving-ports/for-storing-externals.port";
import { NFError } from "lib/native-federation.error";
import type { ForVersionVerification } from "./driving-ports/for-version-verification";

const createGetRemotesFederationInfo = (
    remoteInfoRepository: ForStoringRemoteInfo,
    externalsRepository: ForStoringExternals,
    pathResolver: ForResolvingPaths,
    versionVerifier: ForVersionVerification,
    logger: ForLogging
): ForSavingRemoteEntries => { 

    function addRemoteInfoToStorage(remoteEntry: RemoteEntry)
        : RemoteInfo {
            const scopeUrl =  pathResolver.getScope(remoteEntry.url);

            const remoteInfo: RemoteInfo = {
                remoteName: remoteEntry.name,
                scopeUrl,
                exposes: Object.values(remoteEntry.exposes ?? [])
                    .map(m => ({
                        moduleName: m.key,
                        url: pathResolver.join(scopeUrl, m.outFileName) 
                    }))
            };

            remoteInfoRepository.addOrUpdate(remoteInfo)
            return remoteInfo;
        }

    function checkSharedExternalsCompatibility(remote: RemoteEntry) 
        : RemoteEntry {
            const cache = externalsRepository.getShared();

            const sharedExternals = remote.shared.filter(e => e.singleton && cache[e.packageName]);

            for (const newExternal of sharedExternals) {
                if (!newExternal.version || !versionVerifier.isValidSemver(newExternal.version)) {
                    throw new NFError(`[${newExternal.packageName}] Shared version '${newExternal.version}' is not a valid version.`);
                }

                for (const cachedExternal of cache[newExternal.packageName]!) {
                    if (!versionVerifier.isCompatible(newExternal.version!, cachedExternal.requiredVersion)) {
                        if (cachedExternal.strictVersion) 
                            throw new NFError(`[${newExternal.packageName}] Shared (strict) version '${newExternal.version}' is not compatible to version range '${cachedExternal.requiredVersion}'`);

                        logger.warn(`[${newExternal.packageName}] Shared version '${newExternal.version}' is not compatible to version range '${cachedExternal.requiredVersion}'`);
                    }

                    if (!versionVerifier.isCompatible(cachedExternal.version!, newExternal.requiredVersion)) {
                        if (newExternal.strictVersion) 
                            throw new NFError(`[${newExternal.packageName}] Shared (strict) version '${cachedExternal.version}' is not compatible to version range '${newExternal.requiredVersion}'`);

                        logger.warn(`[${newExternal.packageName}] Shared version '${cachedExternal.version}' is not compatible to version range '${newExternal.requiredVersion}'`);
                    }
                }


            }

            return remote;
        }

    return e => {
        e.forEach(remoteEntry => {
            checkSharedExternalsCompatibility(remoteEntry)
            addRemoteInfoToStorage(remoteEntry);
        })
        return Promise.resolve(e);
    };
}

export { createGetRemotesFederationInfo };