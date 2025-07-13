import type { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import type { RemoteEntry, RemoteInfo, SharedInfo, SharedVersion, Version } from 'lib/1.domain';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import * as _path from 'lib/utils/path';

export function createProcessRemoteEntries(
  config: LoggingConfig,
  ports: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >
): ForProcessingRemoteEntries {
  /**
   * Step 2: Process remoteEntry objects
   *
   * Extracts the externals and remote-info objects from the provided remoteEntry objects.
   * The metadata will be merged into the existing cache/storage but the changes are not persisted (yet).
   *
   * - For remotes and scoped externals that means a full replace.
   * - For shared externals that means merging the versions into the currently cached externals.
   *
   * @param config
   * @param adapters
   * @returns Promise<void>
   */
  return remoteEntries => {
    if (config.log.level === 'debug') logStorageStatus('Storage: before processing remoteEntries');
    remoteEntries.forEach(remoteEntry => {
      addRemoteInfoToStorage(remoteEntry);
      addExternalsToStorage(remoteEntry);
    });
    if (config.log.level === 'debug') logStorageStatus('Storage: after processing remoteEntries');

    return Promise.resolve();
  };

  function addRemoteInfoToStorage({ name, url, exposes }: RemoteEntry): void {
    ports.remoteInfoRepo.addOrUpdate(name, {
      scopeUrl: _path.getScope(url),
      exposes: Object.values(exposes ?? []).map(m => ({
        moduleName: m.key,
        file: m.outFileName,
      })),
    } as RemoteInfo);
  }

  function addExternalsToStorage(remoteEntry: RemoteEntry): void {
    const scopeUrl = _path.getScope(remoteEntry.url);

    remoteEntry.shared.forEach(external => {
      if (!external.version || !ports.versionCheck.isValidSemver(external.version)) {
        config.log.warn(
          `[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
        );
        return;
      }
      if (external.singleton) {
        addSharedExternal(scopeUrl, external, remoteEntry.host);
      } else {
        addScopedExternal(scopeUrl, external);
      }
    });
  }

  function addSharedExternal(scope: string, sharedInfo: SharedInfo, isHostVersion?: boolean): void {
    const cached: SharedVersion[] = ports.sharedExternalsRepo
      .tryGetVersions(sharedInfo.packageName, sharedInfo.sharedScope)
      .orElse([]);

    const matchingVersionIDX = cached.findIndex(c => c.version === sharedInfo.version);

    if (~matchingVersionIDX) {
      if (cached[matchingVersionIDX]!.host || !isHostVersion) {
        config.log.debug(
          `[${isHostVersion ? 'host' : 'remote'}][${scope}][${sharedInfo.packageName}] Shared version '${sharedInfo.version}' already exists, skipping version.`
        );
        return;
      }
      cached.splice(matchingVersionIDX, 1);
      config.log.debug(
        `[${isHostVersion ? 'host' : 'remote'}][${scope}][${sharedInfo.packageName}] Shared version '${sharedInfo.version}' already exists, replacing version.`
      );
    }

    cached.push({
      version: sharedInfo.version!,
      file: _path.join(scope, sharedInfo.outFileName),
      requiredVersion: sharedInfo.requiredVersion,
      strictVersion: sharedInfo.strictVersion,
      host: !!isHostVersion,
      cached: false,
      action: 'skip',
    } as SharedVersion);

    ports.sharedExternalsRepo.addOrUpdate(
      sharedInfo.packageName,
      {
        dirty: true,
        versions: cached.sort((a, b) => ports.versionCheck.compare(b.version, a.version)),
      },
      sharedInfo.sharedScope
    );
  }

  function addScopedExternal(scope: string, sharedInfo: SharedInfo): void {
    ports.scopedExternalsRepo.addExternal(scope, sharedInfo.packageName, {
      version: sharedInfo.version!,
      file: sharedInfo.outFileName,
    } as Version);
  }

  function logStorageStatus(status: string): void {
    config.log.debug(status, {
      remotes: { ...ports.remoteInfoRepo.getAll() },
      'shared-externals': ports.sharedExternalsRepo.getAll(),
      'scoped-externals': ports.scopedExternalsRepo.getAll(),
    });
  }
}
