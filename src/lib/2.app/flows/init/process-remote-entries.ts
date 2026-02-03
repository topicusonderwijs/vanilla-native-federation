import type { ForProcessingRemoteEntries } from '../../driver-ports/init/for-processing-remote-entries.port';
import {
  type RemoteName,
  type RemoteEntry,
  type RemoteInfo,
  type SharedInfo,
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
    | 'remoteInfoRepo'
    | 'sharedExternalsRepo'
    | 'scopedExternalsRepo'
    | 'sharedChunksRepo'
    | 'versionCheck'
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
    try {
      remoteEntries.forEach(remoteEntry => {
        if (remoteEntry?.override) removeCachedRemoteEntry(remoteEntry);
        addRemoteInfoToStorage(remoteEntry);
        addExternalsToStorage(remoteEntry);
        addSharedChunksToStorage(remoteEntry);
      });
      return Promise.resolve(remoteEntries);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  function removeCachedRemoteEntry(remoteEntry: RemoteEntry): void {
    ports.remoteInfoRepo.remove(remoteEntry.name);
    ports.scopedExternalsRepo.remove(remoteEntry.name);
    ports.sharedExternalsRepo.removeFromAllScopes(remoteEntry.name);
  }

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
        const errorMsg = `[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version.`;

        if (config.strict.strictExternalVersion) {
          config.log.error(2, errorMsg);
          throw new NFError(`Could not process remote '${remoteEntry.name}'`);
        }
        config.log.warn(2, errorMsg);
      }
      if (external.singleton) {
        addSharedExternal(remoteEntry.name, external, remoteEntry);
      } else {
        addScopedExternal(remoteEntry.name, external);
      }
    });
  }

  function addSharedChunksToStorage(remoteEntry: RemoteEntry): void {
    if (!remoteEntry.chunks) return;
    config.log.debug(
      2,
      `Adding chunks for remote "${remoteEntry.name}", bundles: [${Object.keys(remoteEntry.chunks).join(', ')}]`
    );
    Object.entries(remoteEntry.chunks).forEach(([bundleName, chunks]) => {
      ports.sharedChunksRepo.addOrReplace(remoteEntry.name, bundleName, chunks);
    });
  }

  function addSharedExternal(
    remoteName: RemoteName,
    sharedInfo: SharedInfo,
    remoteEntry: RemoteEntry
  ): void {
    let action: SharedVersionAction = 'skip';

    const tag =
      sharedInfo.version ?? ports.versionCheck.smallestVersion(sharedInfo.requiredVersion);
    const remote: SharedVersionMeta = {
      file: sharedInfo.outFileName,
      name: remoteName,
      bundle: sharedInfo.bundle,
      strictVersion: sharedInfo.strictVersion,
      cached: false,
      requiredVersion: sharedInfo.requiredVersion || tag,
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
        const errorMsg = `[${remoteName}][${sharedInfo.packageName}@${
          sharedInfo.version
        }] Required version-range '${
          remote.requiredVersion
        }' does not match cached version-range '${matchingVersion.remotes[0]!.requiredVersion}'`;
        if (config.strict.strictExternalCompatibility) {
          config.log.error(2, errorMsg);
          throw new NFError(`Could not process remote '${remoteEntry.name}'`);
        }
        config.log.warn(2, errorMsg);
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
      tag: sharedInfo.version ?? ports.versionCheck.smallestVersion(sharedInfo.requiredVersion),
      file: sharedInfo.outFileName,
      bundle: sharedInfo.bundle,
    } as ScopedVersion);
  }
}
