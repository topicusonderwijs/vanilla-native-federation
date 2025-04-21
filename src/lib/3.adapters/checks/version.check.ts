import type { ForVersionChecking } from "lib/2.app/driving-ports/for-version-checking.port";
import semverValid from "semver/functions/valid";
import semverSatisfies from "semver/functions/satisfies";
import semverCompare from "semver/functions/compare";

const createVersionCheck = (): ForVersionChecking => {
    return { 
        isValidSemver: function (version: string) {
            return semverValid(version) !== null;
        }, 
        isCompatible: function (version: string, range: string) {
            return semverSatisfies(version, range);
        }, 
        compare: function (versionA: string, versionB: string) {
            return semverCompare(versionA, versionB, true)
        }
    };
}

export { createVersionCheck}