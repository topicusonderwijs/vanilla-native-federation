import { NFError } from 'lib/native-federation.error';
import type { LoggingConfig, ModeConfig } from '../../config';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { RemoteEntry, SharedExternal, SharedVersion } from 'lib/1.domain';
import type { ForAuditingExternals } from '../../driver-ports/audit/for-auditing-externals.port';

export function createExternalsAudit(
  config: LoggingConfig & ModeConfig,
  ports: Pick<DrivingContract, 'versionCheck' | 'sharedExternalsRepo' | 'scopedExternalsRepo'>
): ForAuditingExternals {
  return remoteEntry => {
    let success = true;
    remoteEntry.shared
      .filter(external => !external.singleton)
      .forEach(external => {
        const isValid = checkIfExternalCouldBeSingleton(external, remoteEntry);
        if (!isValid) success = false;
      });

    const isValid = warnForScopedSingletons(remoteEntry);
    if (!isValid) success = false;

    if (!success && config.strict.strictExternalCompatibility) {
      config.log.error(3, `[${remoteEntry.name}] Not all externals are compatible.`);
      return Promise.reject(new NFError(`Failed externals audit`));
    }
    return Promise.resolve();
  };

  function checkIfExternalCouldBeSingleton(
    targetExternal: { packageName: string; requiredVersion: string },
    remoteEntry: RemoteEntry
  ) {
    for (const shareScope of ports.sharedExternalsRepo.getScopes()) {
      const sharedExternal =
        ports.sharedExternalsRepo.getFromScope(shareScope)[targetExternal.packageName];
      if (!sharedExternal) continue;

      for (const version of sharedExternal.versions) {
        if (version.action !== 'share') return true;

        if (ports.versionCheck.isCompatible(version.tag, targetExternal.requiredVersion)) {
          const msg = `[${remoteEntry.name}][scoped][${shareScope}][${targetExternal.packageName}] External is compatible with shared range '${version.remotes[0]!.requiredVersion}'. Should be 'singleton: true'`;
          config.log.warn(3, msg);
          return false;
        }
      }
    }
    return true;
  }

  function warnForScopedSingletons(remoteEntry: RemoteEntry) {
    let success = true;
    for (const shareScope of ports.sharedExternalsRepo.getScopes()) {
      for (const [packageName, external] of Object.entries<SharedExternal>(
        ports.sharedExternalsRepo.getFromScope(shareScope)
      )) {
        for (const version of external.versions as SharedVersion[]) {
          if (version.action !== 'scope') continue;

          if (version.remotes.some(remote => remote.name === remoteEntry.name)) {
            const sharedVersion = external.versions.find(v => v.action === 'share');
            const isOlder =
              sharedVersion && ports.versionCheck.compare(version.tag, sharedVersion.tag) === -1;

            let msg = `[${remoteEntry.name}][shared][${shareScope}][${packageName}@${version.tag}] External is ${
              isOlder ? 'older' : 'newer'
            } than shared compatible range '${sharedVersion?.remotes[0]!.requiredVersion}'.`;

            if (isOlder) {
              success = false;
              msg += " Should be 'singleton: false'";
            }
            config.log.warn(3, msg);
          }
        }
      }
    }
    return success;
  }
}
