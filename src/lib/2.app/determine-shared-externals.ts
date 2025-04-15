import type { ForDeterminingSharedExternals } from "./driver-ports/for-determining-shared-externals.port";
import type { SharedExternal } from "lib/1.domain";
import { NFError } from "lib/native-federation.error";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LoggingConfig } from "./config/log.contract";
import type { ModeConfig } from "./config/mode.contract";

const createDetermineSharedExternals = (
    config: LoggingConfig & ModeConfig,
    {versionCheck, sharedExternalsRepo}: DrivingContract
): ForDeterminingSharedExternals => { 
    
    function determineVersionAction([externalName, external]: [string, SharedExternal]) {
        if (external.versions.length === 1) {
            external.versions[0]!.action = 'share';
        }

        // host version gets priority if exists
        let sharedVersion = external.versions.find(v => v.host);

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

        if(!sharedVersion) throw new NFError("Could not determine shared version!");

        external.versions.forEach(v => {
            if(versionCheck.isCompatible(sharedVersion!.version, v.requiredVersion)) {
                v.action = "skip";
                return;
            }

            if(config.strictVersionResolving && v.strictVersion) {
                throw new NFError(`[${externalName}] Shared version ${sharedVersion!.version} is not compatible with range '${v.requiredVersion}'`);
            }

            config.log.warn(`[${externalName}] Shared version ${sharedVersion!.version} is not compatible with range '${v.requiredVersion}'`);
            v.action = (v.strictVersion) ? 'scope' : 'skip';
        });
        sharedVersion.action = 'share';

        external.dirty = false;
    }

    return () => {
        const sharedExternals = sharedExternalsRepo.getAll();
        Object.entries(sharedExternals).filter(([_, e]) => e.dirty).forEach(determineVersionAction);
        sharedExternalsRepo.set(sharedExternals);
        return Promise.resolve();
    };
}

export { createDetermineSharedExternals };