
import type { ForSavingRemoteEntries } from "./driver-ports/for-saving-remote-entries.port";
import type { RemoteEntry, RemoteInfo, SharedInfo, SharedVersion, Version } from "lib/1.domain";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LoggingConfig } from "./config/log.contract";
import * as _path from "lib/utils/path";

const createSaveRemoteEntries = (
    config: LoggingConfig,
    { remoteInfoRepo, sharedExternalsRepo, scopedExternalsRepo, versionCheck }: DrivingContract
): ForSavingRemoteEntries => { 

    function addRemoteInfoToStorage({name, url, exposes}: RemoteEntry)
        : void {
            const scopeUrl =  _path.getScope(url);

            remoteInfoRepo.addOrUpdate({
                remoteName: name,
                scopeUrl,
                exposes: Object.values(exposes ?? [])
                    .map(m => ({
                        moduleName: m.key,
                        url: _path.join(scopeUrl, m.outFileName) 
                    }))
            } as RemoteInfo)
        }

        function addExternalsToStorage(remoteEntry: RemoteEntry) 
            : void {
                const scopeUrl =  _path.getScope(remoteEntry.url);

                remoteEntry.shared.forEach(external => {
                    if (!external.version || !versionCheck.isValidSemver(external.version)) {
                        config.log.warn(`[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping.`);
                        return;
                    }
                    if(external.singleton) {
                        addSharedExternal(scopeUrl, external, remoteEntry.host);
                    } else {
                        addScopedExternal(scopeUrl, external);
                    }      
                });
            }
    

    function addSharedExternal(scope: string, sharedInfo: SharedInfo, host?: boolean) 
        : void {
            const cached: SharedVersion[] = sharedExternalsRepo
                .tryGetVersions(sharedInfo.packageName)
                .orElse([]);

            if(cached.find(e => e.version === sharedInfo.version)) {
                config.log.debug(`[${scope}] Shared version '${sharedInfo.version}' already exists, skipping.`);
                return;
            }

            cached.push({
                version: sharedInfo.version!,
                url: _path.join(scope, sharedInfo.outFileName),
                requiredVersion: sharedInfo.requiredVersion,
                strictVersion: sharedInfo.strictVersion,
                host,               
                action: 'skip'
            } as SharedVersion);

            sharedExternalsRepo.addOrUpdate(
                sharedInfo.packageName, 
                cached.sort((a,b) => versionCheck.compare(b.version, a.version))
            );
        }

    function addScopedExternal(scope: string, sharedInfo: SharedInfo) 
        : void {
            scopedExternalsRepo.addExternal(
                scope, 
                sharedInfo.packageName, 
                {
                    version: sharedInfo.version!,
                    url: _path.join(scope, sharedInfo.outFileName)
                } as Version
            );
        }

        
    return remoteEntries => {
        remoteEntries.forEach(remoteEntry => {
            addRemoteInfoToStorage(remoteEntry);
            addExternalsToStorage(remoteEntry);
        });

        return Promise.resolve();
    };
}

export { createSaveRemoteEntries };