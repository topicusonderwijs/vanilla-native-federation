import type { Version, VersionHandler } from './version.contract';
import { NFError } from '../../native-federation.error';

const versionHandlerFactory = (): VersionHandler => {

    const isSemver = (version: string) => {
        // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
        const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
        return SEMVER_REGEX.test(version);
    }

    const toParts = (version:string): [number,number,number,string] => {
        if(!isSemver(version)) throw new NFError(`Invalid version '${version}'.`);
        const parts = [...version.matchAll(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?/g)][0]!;
        return [Number(parts[1]), Number(parts[2]), Number(parts[3]), !!parts[4] ? `-${parts[4]}` : ""]
    }

    const toVersion = (requiredVersion:string) => (requiredVersion.split(' ').pop() ?? requiredVersion).replace(/^[~^>=<]+/, '');

    const getNextVersion = (version: string) => {
        const [major, minor, patch] = toParts(version);
        return `${major}.${minor}.${patch+1}`;
    }

    const compareVersions = (v1: string, v2: string): number => {
        try{
            const v1Parts = toParts(toVersion(v1));
            const v2Parts = toParts(toVersion(v2));
    
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

    const toRange = (requiredVersion: string): [string,string] => {
        if(requiredVersion.startsWith("^")) {
            const [major,minor,patch,flag] = toParts(requiredVersion.slice(1));
            return [`${major}.${minor}.${patch}${flag}`, `${major+1}.0.0`]
        }

        if(requiredVersion.startsWith("~")) {
            const [major,minor,patch,flag] = toParts(requiredVersion.slice(1));
            return [`${major}.${minor}.${patch}${flag}`, `${major}.${minor+1}.0`]
        }

        const matchVersionRange = requiredVersion.match(`^(>=|>)([^\\s]+)\\s+(<=|<)([^\\s]+)$`);
        if (matchVersionRange) {
            const [_, minOperator, minVersion, maxOperator, maxVersion] = matchVersionRange;
            if(!minVersion || !isSemver(minVersion)) throw new NFError(`Invalid min version '${requiredVersion}'`);
            if(!maxVersion || !isSemver(maxVersion)) throw new NFError(`Invalid max version '${requiredVersion}'`);

            const versionRange: [string,string] = [minVersion, maxVersion];

            if(minOperator === ">") versionRange[0] = getNextVersion(minVersion);
            if(maxOperator === "<=") versionRange[1] = getNextVersion(maxVersion);
            
            return versionRange;
        }

        if(isSemver(requiredVersion)) {
            return [requiredVersion, getNextVersion(requiredVersion)];
        }

        throw new NFError(`Could not convert '${requiredVersion}' to a version range.`);
    }


    const isCompatible = (version: string, [minVersion, maxVersion]: [string,string]): boolean => {
        const isAboveOrEqualToMin = compareVersions(version, minVersion) >= 0;    
        const isBelowMax = compareVersions(version, maxVersion) < 0;    
        return isAboveOrEqualToMin && isBelowMax;
    }

    const getLatestVersion = (newVersion: Version, currentVersion?: Version) => {
        if(!currentVersion) return newVersion;
        
        if(compareVersions(newVersion.version, currentVersion.version) > 0) {
            return newVersion;
        }
        return currentVersion;
    }

    const getSmallestVersionRange = (newRange: [string,string], currentRange?: [string,string]): [string,string] => {
        if(!currentRange) return newRange;
        const min = compareVersions(currentRange[0], newRange[0]) > 0 ? currentRange[0] : newRange[0];
        const max = compareVersions(currentRange[1], newRange[1]) < 0 ? currentRange[1] : newRange[1];
        return [min,max];
    }

    return {compareVersions, toRange, getLatestVersion, isCompatible, toVersion, getSmallestVersionRange};
}

export { versionHandlerFactory}