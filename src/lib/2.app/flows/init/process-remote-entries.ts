import type { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import {
  type RemoteName,
  type RemoteEntry,
  type RemoteInfo,
  type SharedInfo,
  FALLBACK_VERSION,
  type SharedVersionMeta,
  type ScopedVersion,
  type SharedVersionAction,
  type SharedExternal,
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
    remoteEntries.forEach(remoteEntry => {
      addRemoteInfoToStorage(remoteEntry);
      addExternalsToStorage(remoteEntry);
    });

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
        if (config.strict) {
          config.log.error(
            2,
            `[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
          );
          throw new NFError(`Invalid version '${external.packageName}@${external.version}'`);
        }

        config.log.warn(
          2,
          `[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
        );
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
    remoteEntry: RemoteEntry
  ): void {
    let action: SharedVersionAction = 'skip';

    const tag = sharedInfo.version ?? FALLBACK_VERSION;
    const remote: SharedVersionMeta = {
      file: sharedInfo.outFileName,
      name: remoteName,
      strictVersion: sharedInfo.strictVersion,
      cached: false,
      requiredVersion: sharedInfo.requiredVersion,
    };

    const scopeType = ports.sharedExternalsRepo.scopeType(sharedInfo.shareScope);

    if (scopeType === 'strict') {
      action = 'share';
      remote.requiredVersion = tag;
    }

    const cached: SharedExternal = ports.sharedExternalsRepo
      .tryGet(sharedInfo.packageName, sharedInfo.shareScope)
      .orElse({ dirty: false, versions: [] });

    const matchingVersion = cached.versions.find(version => version.tag === sharedInfo.version);
    let dirty = cached.dirty;

    if (!!matchingVersion) {
      if (
        remote.strictVersion &&
        matchingVersion.remotes[0]!.requiredVersion !== remote.requiredVersion
      ) {
        config.log.warn(
          2,
          `[${remoteName}][${sharedInfo.packageName}@${sharedInfo.version}] Required version '${remote.requiredVersion}' does not match existing '${matchingVersion.remotes[0]!.requiredVersion}'`
        );
      }

      if (!matchingVersion.host && !!remoteEntry?.host) {
        matchingVersion.host = true;
        matchingVersion.remotes.unshift(remote);
      } else matchingVersion.remotes.push(remote);
    } else {
      if (scopeType !== 'strict') dirty = true;
      cached.versions.push({ tag, action, host: !!remoteEntry?.host, remotes: [remote] });
    }

    ports.sharedExternalsRepo.addOrUpdate(
      sharedInfo.packageName,
      {
        dirty,
        versions: cached.versions.sort((a, b) => ports.versionCheck.compare(b.tag, a.tag)),
      },
      sharedInfo.shareScope
    );
  }

  function addScopedExternal(scope: string, sharedInfo: SharedInfo): void {
    ports.scopedExternalsRepo.addExternal(scope, sharedInfo.packageName, {
      tag: sharedInfo.version ?? FALLBACK_VERSION,
      file: sharedInfo.outFileName,
    } as ScopedVersion);
  }
}
