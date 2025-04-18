import type { ForDeterminingSharedExternals } from "./driver-ports/for-determining-shared-externals.port";
import type { SharedExternal } from "lib/1.domain";
import { NFError } from "lib/native-federation.error";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LoggingConfig } from "./config/log.contract";
import type { ModeConfig } from "./config/mode.contract";


/**
 * Step 3: Determine which version is the optimal version to share. 
 * 
 * Priority:
 * 1) Latest external defined in 'host' remoteEntry (if available).
 * 2) If defined in config, prioritize latest available version.
 * 3) Find most optimal version, by comparing potential extra downloads per version.
 * @param config 
 * @param adapters 
 * @returns 
 */
const createDetermineSharedExternals = (
    config: LoggingConfig & ModeConfig,
    {versionCheck, sharedExternalsRepo}: DrivingContract
): ForDeterminingSharedExternals => { 
    
    function determineVersionAction([externalName, external]: [string, SharedExternal]) {
        if (external.versions.length === 1) {
            external.versions[0]!.action = 'share';
            return;
        }

        let sharedVersion = external.versions.find(v => v.host);

        if(!sharedVersion && config.latestSharedExternal) {
            sharedVersion = external.versions[0];
        }

        if(!sharedVersion) {
            // find version with least extra downloads, sorted by SEMVER version (O^2 complexity)
            let leastExtraDownloads = Number.MAX_VALUE;
            external.versions.forEach(vA => {
                const extraDownloads = external.versions
                    .filter(vB => (!vB.cached && vB.strictVersion && !versionCheck.isCompatible(vA.version, vB.requiredVersion)))
                    .length;
                if (extraDownloads < leastExtraDownloads) {
                    leastExtraDownloads = extraDownloads;
                    sharedVersion = vA;
                }
            });
        }

        if(!sharedVersion) throw new NFError(`[${externalName}] Could not determine shared version!`);

        // Determine action of other versions based on chosen sharedVersion
        external.versions.forEach(v => {
            if(versionCheck.isCompatible(sharedVersion!.version, v.requiredVersion)) {
                v.action = "skip";
                return;
            }

            if(config.strict && v.strictVersion) {
                throw new NFError(`[${externalName}] Shared version ${sharedVersion!.version} is not compatible with range '${v.requiredVersion}'`);
            }

            config.log.warn(`[${externalName}] Shared version ${sharedVersion!.version} is not compatible with range '${v.requiredVersion}'`);
            v.action = (v.strictVersion) ? 'scope' : 'skip';
        });


        sharedVersion.action = 'share';
        external.dirty = false;
    }

    return () => {
        try {
            const sharedExternals = sharedExternalsRepo.getAll();
            Object.entries(sharedExternals).filter(([_, e]) => e.dirty).forEach(determineVersionAction);
            sharedExternalsRepo.set(sharedExternals);

            config.log.debug("Processed shared externals", sharedExternalsRepo.getAll());
            return Promise.resolve();
        } catch(err: unknown) {
            config.log.error("Failed to determine shared externals", err);
            config.log.debug("Currently processed shared externals", sharedExternalsRepo.getAll());
            throw new NFError("Failed to determine shared externals.");
        }
    };
}

export { createDetermineSharedExternals };