import type { ForVersionVerification } from "lib/2.app/driving-ports/for-version-verification";
import semverValid from "semver/functions/valid";
import semverSatisfies from "semver/functions/satisfies";

const createVersionVerifier = (): ForVersionVerification => {

    const isValidSemver = (version: string) => semverValid(version) !== null

    const isCompatible = (version: string, range: string): boolean => semverSatisfies(version, range);

    return { isValidSemver, isCompatible };
}

export { createVersionVerifier}