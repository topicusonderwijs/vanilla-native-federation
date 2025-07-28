import type { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import {
  type RemoteName,
  STRICT_SCOPE,
  type RemoteEntry,
  type RemoteInfo,
  type SharedInfo,
  type SharedVersion,
  type Version,
} from 'lib/1.domain';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import * as _path from 'lib/utils/path';
import type { ModeConfig } from 'lib/2.app/config/mode.contract';
import { NFError } from 'lib/native-federation.error';

export function createProcessRemoteEntries(
  config: LoggingConfig & ModeConfig,
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
    if (config.log.level === 'debug')
      logStorageStatus('[2] Storage: before processing remoteEntries');
    remoteEntries.forEach(remoteEntry => {
      addRemoteInfoToStorage(remoteEntry);
      addExternalsToStorage(remoteEntry);
    });
    if (config.log.level === 'debug')
      logStorageStatus('[2] Storage: after processing remoteEntries');

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
    remoteEntry.shared.forEach(external => {
      if (!external.version || !ports.versionCheck.isValidSemver(external.version)) {
        config.log.warn(
          `[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
        );
        if (config.strict)
          throw new NFError(`Invalid version '${external.packageName}@${external.version}'`);
        return;
      }
      if (external.singleton) {
        addSharedExternal(remoteEntry.name, external, remoteEntry);
      } else {
        addScopedExternal(remoteEntry.name, external);
      }
    });
  }

  function addSharedExternal(
    remoteName: RemoteName,
    sharedInfo: SharedInfo,
    remoteEntry?: RemoteEntry
  ): void {
    const cached: SharedVersion[] = ports.sharedExternalsRepo
      .tryGetVersions(sharedInfo.packageName, sharedInfo.shareScope)
      .orElse([]);

    const matchingVersionIDX = cached.findIndex(c => c.version === sharedInfo.version);

    if (~matchingVersionIDX) {
      if (cached[matchingVersionIDX]!.host || !remoteEntry?.host) {
        return;
      }
      cached.splice(matchingVersionIDX, 1);
      config.log.debug(
        `[2][${remoteEntry?.host ? 'host' : 'remote'}][${remoteName}][${sharedInfo.packageName}@${sharedInfo.version}] Shared version already exists, replacing version.`
      );
    }
    const action =
      sharedInfo.shareScope && sharedInfo.shareScope === STRICT_SCOPE ? 'strict' : 'skip';

    cached.push({
      version: sharedInfo.version!,
      file: sharedInfo.outFileName,
      remote: remoteName,
      requiredVersion: sharedInfo.requiredVersion,
      strictVersion: sharedInfo.strictVersion,
      host: !!remoteEntry?.host,
      cached: false,
      action: action,
    } as SharedVersion);

    ports.sharedExternalsRepo.addOrUpdate(
      sharedInfo.packageName,
      {
        dirty: action !== 'strict',
        versions: cached.sort((a, b) => ports.versionCheck.compare(b.version, a.version)),
      },
      sharedInfo.shareScope
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
