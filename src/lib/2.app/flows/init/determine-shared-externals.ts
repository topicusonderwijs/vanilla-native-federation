import type { ForDeterminingSharedExternals } from '../../driver-ports/init/for-determining-shared-externals.port';
import { GLOBAL_SCOPE, type SharedExternal } from 'lib/1.domain';
import { NFError } from 'lib/native-federation.error';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import type { ModeConfig } from '../../config/mode.contract';

export function createDetermineSharedExternals(
  config: LoggingConfig & ModeConfig,
  ports: Pick<DrivingContract, 'versionCheck' | 'sharedExternalsRepo'>
): ForDeterminingSharedExternals {
  /**
   * Step 3: Determine which version is the optimal version to share.
   *
   * The shared external versions that were merged into the cache/storage caused the shared
   * external to be 'dirty', this step cleans all dirty externals in the storage by calculating
   * the most optimal version to share since only 1 version can be shared globally. All other
   * versions that are compatible are skipped and the incompatible ones are defined as scoped external.
   *
   * Check the docs for a full explanation of the dependency resolver.
   *
   * Priority:
   * 1) Latest external defined in 'host' remoteEntry (if available).
   * 2) If defined in config, prioritize latest available version.
   * 3) Find most optimal version, by comparing potential extra downloads per version.
   *
   * @param config
   * @param adapters
   * @returns
   */
  return () => {
    for (const shareScope of ports.sharedExternalsRepo.getScopes()) {
      const sharedExternals = ports.sharedExternalsRepo.getAll(shareScope);

      try {
        Object.entries(sharedExternals)
          .filter(([_, e]) => e.dirty)
          .forEach(([name, external]) =>
            ports.sharedExternalsRepo.addOrUpdate(
              name,
              setVersionActions(name, external),
              shareScope
            )
          );
      } catch (error) {
        config.log.error(
          3,
          `[${shareScope ?? GLOBAL_SCOPE}] failed to determine shared externals.`,
          {
            sharedExternals,
            error,
          }
        );
        return Promise.reject(
          new NFError(
            `Could not determine shared externals in scope ${shareScope}.`,
            error as Error
          )
        );
      }
    }
    return Promise.resolve();
  };

  function setVersionActions(externalName: string, external: SharedExternal) {
    if (external.versions.length === 1) {
      external.versions[0]!.action = 'share';
      external.dirty = false;
      return external;
    }

    let sharedVersion = external.versions.find(v => v.host);

    if (!sharedVersion && config.profile.latestSharedExternal) {
      sharedVersion = external.versions[0];
    }

    if (!sharedVersion) {
      // find version with least extra downloads, sorted by SEMVER version (O^2 complexity)
      let leastExtraDownloads = Number.MAX_VALUE;
      external.versions.forEach(vA => {
        const extraDownloads = external.versions.filter(
          vB =>
            !vB.remotes[0]!.cached &&
            vB.remotes[0]!.strictVersion &&
            !ports.versionCheck.isCompatible(vA.tag, vB.remotes[0]!.requiredVersion)
        ).length;
        if (extraDownloads < leastExtraDownloads) {
          leastExtraDownloads = extraDownloads;
          sharedVersion = vA;
        }
      });
    }

    if (!sharedVersion) {
      throw new NFError(`[${externalName}] Could not determine shared version!`);
    }

    // Determine action of other versions based on chosen sharedVersion
    external.versions.forEach(v => {
      if (ports.versionCheck.isCompatible(sharedVersion!.tag, v.remotes[0]!.requiredVersion)) {
        v.action = 'skip';
        return;
      }

      if (config.strict && v.remotes[0]!.strictVersion) {
        throw new NFError(
          `[${v.remotes[0]!.name}] ${externalName}@${v.tag} is not compatible with existing ${sharedVersion!.remotes[0]!.requiredVersion}@${sharedVersion!.tag} requiredRange '${sharedVersion!.remotes[0]?.requiredVersion}'`
        );
      }
      v.action = v.remotes[0]!.strictVersion ? 'scope' : 'skip';
    });

    sharedVersion.action = 'share';
    external.dirty = false;
    return external;
  }
}
