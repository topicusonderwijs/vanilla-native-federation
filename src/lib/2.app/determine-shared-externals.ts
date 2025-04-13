import type { ForDeterminingSharedExternals } from "./driver-ports/for-determining-shared-externals.port";
import type { SharedVersion } from "lib/1.domain";
import { NFError } from "lib/native-federation.error";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { LogHandler } from "./handlers/log.contract";

const createDetermineSharedExternals = (
    handle: {log: LogHandler},
    {versionCheck, sharedExternalsRepo}: DrivingContract
): ForDeterminingSharedExternals => { 
    
    function determineVersionAction([external, versions]: [string, SharedVersion[]]) {
        if (versions.length === 1) {
            versions[0]!.action = 'share';
        }

        // host version gets priority if exists
        let sharedVersion = versions.find(v => v.host);

        if(!sharedVersion) {
            // find version with least extra downloads, sorted by SEMVER version (O^2 complexity)
            let leastExtraDownloads = Number.MAX_VALUE;
            versions.forEach(vA => {
                const extraDownloads = versions
                    .filter(vB => (!vB.cached && vB.strictVersion && !versionCheck.isCompatible(vA.version, vB.requiredVersion)))
                    .length;
                if (extraDownloads < leastExtraDownloads) {
                    leastExtraDownloads = extraDownloads;
                    sharedVersion = vA;
                }
            });
        }

        if(!sharedVersion) throw new NFError("Could not determine shared version!");

        versions.forEach(v => {
            if(versionCheck.isCompatible(sharedVersion!.version, v.requiredVersion)) {
                v.action = "skip";
                return;
            }

            handle.log.warn(`[${external}] Shared version ${sharedVersion!.version} is not compatible with range '${v.requiredVersion}'`);
            v.action = (v.strictVersion) ? 'scope' : 'skip';
        });
        sharedVersion.action = 'share';
    }

    return () => {
        const sharedExternals = sharedExternalsRepo.getAll();
        Object.entries(sharedExternals).forEach(determineVersionAction);
        sharedExternalsRepo.set(sharedExternals);
        return Promise.resolve();
    };
}

export { createDetermineSharedExternals };