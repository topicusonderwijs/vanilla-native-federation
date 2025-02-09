import type { Version, VersionHandler } from './version.contract';
import { NFError } from '../../native-federation.error';

const versionHandlerFactory = (): VersionHandler => {
    // ^ = patch AND minor can be higher
    // ~ = only higher minor versions
    // singleton = in imports object
    // strictVersion = fail instead of warning (singleton mismatch)
    // requiredVersion = '>=1.0.0 <3.0.0'

    const isSemver = (version: string) => {
        // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
        const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
        return SEMVER_REGEX.test(version);
    }

    const toParts = (version:string): [number,number,number,string|undefined] => {
        if(!isSemver(version)) throw new NFError(`Invalid version '${version}'.`);
        return version.split(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?/) as [number,number,number,string];
    }

    const compareVersions = (v1: string, v2: string): number => {
        try{
            const v1Parts = toParts(v1);
            const v2Parts = toParts(v2);
    
            // Check numeric part (1.1.0)
            for (let i = 0; i < 3; i++) {
                v1Parts[i] ??= "0";
                v2Parts[i] ??= "0";
    
                if (Number(v1Parts[i]) > Number(v2Parts[i])) return 1;
                if (Number(v1Parts[i]) < Number(v2Parts[i])) return -1;
            }
    
            // Check flags like 1.1.0-patch
            let vDiff = 0, idx=3;
            while(vDiff === 0) {
                if(!v1Parts[idx] && !v2Parts[idx]) return 0;
                if(!v2Parts[idx]) return 1;
                if(!v1Parts[idx]) return -1;
    
                vDiff = (String(v1Parts[idx])).localeCompare(String(v2Parts[idx]));
                idx++;
            }
            return vDiff;
        }catch(_) {
            return v1.localeCompare(v2);
        }
    };

    const isCompatible = (version: string, requiredVersion: string): boolean => {
        const [major,minor,patch,_] = toParts(version);
        
        if(requiredVersion.startsWith("^") || requiredVersion.startsWith("~")){
            const [reqMajor,reqMinor,reqPatch] = toParts(requiredVersion.slice(1));

            if(
                requiredVersion.startsWith("^") // Most recent major
                && (major !== reqMajor || minor < reqMinor)
            ) {
                return false;
                // throw new NFError(`Version '${version}' is not supported by range '${requiredVersion}'`)
            }

            if(
                requiredVersion.startsWith("~") // Most recent minor
                && (major !== reqMajor || minor !== reqMinor || patch < reqPatch)
            ) {
                return false;
                //throw new NFError(`Version '${version}' is not supported by range '${requiredVersion}'`)
            }

            // TODO: Add support for version range
        }
        return true;
    }

    const getLatestVersion = (newVersion: Version, currentVersion?: Version) => {
        if(!currentVersion) return newVersion;
        
        if(compareVersions(newVersion.version, currentVersion.version) > 0) {
            if (!isCompatible(newVersion.version, currentVersion.requiredVersion)) {
                
            }
            return newVersion;
        }
        return currentVersion;
    }

    return {compareVersions, getLatestVersion, isCompatible};
}

export { versionHandlerFactory}