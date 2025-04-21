
import type { ForProcessingRemoteEntries } from "./driver-ports/for-processing-remote-entries.port";
import type { RemoteEntry, RemoteInfo, SharedInfo, SharedVersion, Version } from "lib/1.domain";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LoggingConfig } from "./config/log.contract";
import * as _path from "../utils/path";

/**
 * Extract the externals and remote-infos from the remoteEntry files and merge them into storage. 
 * 
 * @param config 
 * @param adapters 
 * @returns Promise<void>
 */
const createProcessRemoteEntries = (
    config: LoggingConfig,
    { remoteInfoRepo, sharedExternalsRepo, scopedExternalsRepo, versionCheck }: Pick<DrivingContract,  'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'>
): ForProcessingRemoteEntries => { 

    function addRemoteInfoToStorage({name, url, exposes}: RemoteEntry)
        : void {
            const scopeUrl =  _path.getScope(url);

            remoteInfoRepo.addOrUpdate(name, {
                scopeUrl,
                exposes: Object.values(exposes ?? [])
                    .map(m => ({
                        moduleName: m.key,
                        file: m.outFileName 
                    }))
            } as RemoteInfo);
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
    

    function addSharedExternal(scope: string, sharedInfo: SharedInfo, isHostVersion?: boolean) 
        : void {
            const cached: SharedVersion[] = sharedExternalsRepo
                .tryGetVersions(sharedInfo.packageName)
                .orElse([]);

            const matchingVersionIDX = cached.findIndex(c => c.version === sharedInfo.version);

            if (~matchingVersionIDX) {
                if(cached[matchingVersionIDX]!.host || !isHostVersion) {
                    config.log.warn(`[${scope}] Shared version '${sharedInfo.version}' already exists, skipping.`);
                    return;
                }
                delete cached[matchingVersionIDX];
            }

            cached.push({
                version: sharedInfo.version!,
                file: _path.join(scope, sharedInfo.outFileName),
                requiredVersion: sharedInfo.requiredVersion,
                strictVersion: sharedInfo.strictVersion,
                host: !!isHostVersion,
                cached: false,               
                action: 'skip'
            } as SharedVersion);

            sharedExternalsRepo.addOrUpdate(
                sharedInfo.packageName, 
                { dirty: true, versions: cached.sort((a,b) => versionCheck.compare(b.version, a.version)) }
            );
        }

    function addScopedExternal(scope: string, sharedInfo: SharedInfo) 
        : void {
            scopedExternalsRepo.addExternal(
                scope, 
                sharedInfo.packageName, 
                {
                    version: sharedInfo.version!,
                    file: sharedInfo.outFileName
                } as Version
            );
        }

    function logStorageStatus(status: string)
        : void {
            config.log.debug(status, {
                "remotes": remoteInfoRepo.getAll(),
                "shared-externals": sharedExternalsRepo.getAll(),
                "scoped-externals": scopedExternalsRepo.getAll(),
            })
        }
        
    return remoteEntries => {
        if(config.log.level === "debug") logStorageStatus("temp cache state: Initial");
        remoteEntries.forEach(remoteEntry => {
            addRemoteInfoToStorage(remoteEntry);
            addExternalsToStorage(remoteEntry);
        });
        if(config.log.level === "debug") logStorageStatus("temp cache state: After merging remoteEntries");
       

        return Promise.resolve();
    };
}

export { createProcessRemoteEntries };