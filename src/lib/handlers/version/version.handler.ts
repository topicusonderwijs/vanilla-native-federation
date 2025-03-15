import type { Version, VersionHandler } from './version.contract';
import semverValid from "semver/functions/valid";
import semverCompare from "semver/functions/compare";
import semverValidRange from "semver/ranges/valid";
import semverSubsetRange from "semver/ranges/subset";
import semverMinVersion from "semver/ranges/min-version";
import semverSatisfies from "semver/functions/satisfies";

const versionHandlerFactory = (): VersionHandler => {

    const isValid = (version: string) => semverValid(version) !== null

    const compareVersions = (v1: string, v2: string): number => semverCompare(v1, v2)

    const isCompatible = (version: string, range: string): boolean => semverSatisfies(version, range);
    
    const getLatestVersion = (newVersion: Version, currentVersion?: Version) => {
        if(!currentVersion) return newVersion;
        
        if(compareVersions(newVersion.version, currentVersion.version) > 0) {
            return newVersion;
        }
        return currentVersion;
    }

    const getSmallestVersionRange = (newRange: string, currentRange?: string): string => {
        if(!currentRange || !semverValidRange(currentRange)) return newRange;
        if(!semverValidRange(newRange)) throw new TypeError(`Version range '${newRange}' is not valid.`);

        // If one range fits entirely in the other range, choose the smallest one
        if(semverSubsetRange(newRange, currentRange)) return newRange;
        if(semverSubsetRange(currentRange, newRange)) return currentRange;

        // If not, choose the oldest minVersion
        return semverCompare(semverMinVersion(currentRange)!, semverMinVersion(newRange)!) > 0
            ? newRange
            : currentRange
    }

    return {compareVersions, isValid, getLatestVersion, isCompatible, getSmallestVersionRange};
}

export { versionHandlerFactory}
