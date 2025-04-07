import type { ForCheckingVersion } from "lib/2.app/driving-ports/for-checking-version.port";
import semverValid from "semver/functions/valid";
import semverSatisfies from "semver/functions/satisfies";

const createVersionCheck = (): ForCheckingVersion => {

    const isValidSemver = (version: string) => semverValid(version) !== null

    const isCompatible = (version: string, range: string): boolean => semverSatisfies(version, range);

    return { isValidSemver, isCompatible };
}

export { createVersionCheck}