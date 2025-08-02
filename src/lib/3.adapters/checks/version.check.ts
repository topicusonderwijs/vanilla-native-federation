import type { ForVersionChecking } from 'lib/2.app/driving-ports/for-version-checking.port';
import semverValid from 'semver/functions/valid';
import semverSatisfies from 'semver/functions/satisfies';
import semverCompare from 'semver/functions/compare';
import semverMinVersion from 'semver/ranges/min-version';
import semverValidRange from 'semver/ranges/valid';

const createVersionCheck = (): ForVersionChecking => {
  return {
    isValidSemver: function (version: string) {
      return semverValid(version) !== null;
    },
    isCompatible: function (version: string, range: string) {
      return semverSatisfies(version, range);
    },
    compare: function (versionA: string, versionB: string) {
      return semverCompare(versionA, versionB, true);
    },
    smallestVersion: function (versionRange: string) {
      if (!semverValidRange(versionRange)) return '0.0.0';
      const minVersion = semverMinVersion(versionRange);
      return minVersion?.raw ?? '0.0.0';
    },
  };
};

export { createVersionCheck };
