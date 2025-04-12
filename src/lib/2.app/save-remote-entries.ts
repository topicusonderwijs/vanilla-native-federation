
import type { ForLogging } from "./driving-ports/for-logging.port";
import type { ForStoringRemoteInfo } from "./driving-ports/for-storing-remote-info.port";
import type { ForSavingRemoteEntries } from "./driver-ports/for-saving-remote-entries.port";
import type { RemoteEntry, RemoteInfo, SharedInfo, SharedVersion, Version } from "lib/1.domain";
import type { ForResolvingPaths } from "./driving-ports/for-resolving-paths.port";
import type { ForStoringSharedExternals } from "./driving-ports/for-storing-shared-externals.port";
import type { ForCheckingVersion } from "./driving-ports/for-checking-version.port";
import type { ForStoringScopedExternals } from "./driving-ports/for-storing-scoped-externals.port";

const createSaveRemoteEntries = (
    remoteInfoRepository: ForStoringRemoteInfo,
    sharedExternalsRepository: ForStoringSharedExternals,
    scopedExternalsRepository: ForStoringScopedExternals,
    pathResolver: ForResolvingPaths,
    versionCheck: ForCheckingVersion,
    logger: ForLogging
): ForSavingRemoteEntries => { 

    function addRemoteInfoToStorage({name, url, exposes}: RemoteEntry)
        : void {
            const scopeUrl =  pathResolver.getScope(url);

            remoteInfoRepository.addOrUpdate({
                remoteName: name,
                scopeUrl,
                exposes: Object.values(exposes ?? [])
                    .map(m => ({
                        moduleName: m.key,
                        url: pathResolver.join(scopeUrl, m.outFileName) 
                    }))
            } as RemoteInfo)
        }

    function addSharedExternal(scope: string, sharedInfo: SharedInfo) {
        const cached: SharedVersion[] = sharedExternalsRepository
            .tryGetVersions(sharedInfo.packageName)
            .orElse([]);

        cached.push({
            version: sharedInfo.version!,
            url: pathResolver.join(scope, sharedInfo.outFileName),
            requiredVersion: sharedInfo.requiredVersion,
            strictVersion: sharedInfo.strictVersion,
            action: 'skip'
        } as SharedVersion);

        sharedExternalsRepository.addOrUpdate(
            sharedInfo.packageName, 
            cached.sort((a,b) => versionCheck.compare(b.version, a.version))
        );
    }

    function addScopedExternal(scope: string, sharedInfo: SharedInfo) {
        scopedExternalsRepository.addExternal(
            scope, 
            sharedInfo.packageName, 
            {
                version: sharedInfo.version!,
                url: pathResolver.join(scope, sharedInfo.outFileName)
            } as Version
        );
    }

    function addExternalsToStorage(remoteEntry: RemoteEntry) {
        const scopeUrl =  pathResolver.getScope(remoteEntry.url);

        remoteEntry.shared.forEach(external => {
            if (!external.version || !versionCheck.isValidSemver(external.version)) {
                logger.warn(`[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping.`);
                return;
            }
            if(external.singleton) {
                addSharedExternal(scopeUrl, external);
            } else {
                addScopedExternal(scopeUrl, external);
            }      
        });
    }

    return remoteEntries => {
        remoteEntries.forEach(remoteEntry => {
            addRemoteInfoToStorage(remoteEntry);
            addExternalsToStorage(remoteEntry);
        });

        return Promise.resolve(remoteEntries);
    };
}

export { createSaveRemoteEntries };