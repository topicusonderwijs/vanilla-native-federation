import type { ForUpdatingCache } from '../../driver-ports/dynamic-init/for-updating-cache';
import {
  FALLBACK_VERSION,
  type ScopedVersion,
  type RemoteEntry,
  type RemoteInfo,
  type RemoteName,
  type SharedInfo,
  type SharedInfoActions,
  type SharedVersion,
  type SharedVersionAction,
  type SharedVersionMeta,
  type SharedExternal,
} from 'lib/1.domain';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import * as _path from 'lib/utils/path';
import { NFError } from 'lib/native-federation.error';
import type { ModeConfig } from 'lib/2.app/config/mode.contract';

export function createUpdateCache(
  config: LoggingConfig & ModeConfig,
  ports: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >
): ForUpdatingCache {
  return remoteEntry => {
    try {
      addRemoteInfoToStorage(remoteEntry);
      const actions = mergeExternalsIntoStorage(remoteEntry);

      return Promise.resolve({ entry: remoteEntry, actions });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  function addRemoteInfoToStorage({ name, url, exposes }: RemoteEntry) {
    ports.remoteInfoRepo.addOrUpdate(name, {
      scopeUrl: _path.getScope(url),
      exposes: Object.values(exposes ?? []).map(m => ({
        moduleName: m.key,
        file: m.outFileName,
      })),
    } as RemoteInfo);
  }

  function mergeExternalsIntoStorage(remoteEntry: RemoteEntry): SharedInfoActions {
    const actions: SharedInfoActions = {};
    remoteEntry.shared.forEach(external => {
      if (!external.version || !ports.versionCheck.isValidSemver(external.version)) {
        config.log.debug(
          `[8][${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
        );
        if (config.strict)
          throw new NFError(`Invalid version '${external.packageName}@${external.version}'`);

        return;
      }

      if (external.singleton) {
        const { action, sharedVersion } = addSharedExternal(remoteEntry.name, external);
        actions[external.packageName] = { action };

        if (action === 'skip' && external.shareScope && sharedVersion?.remotes[0]?.file) {
          actions[external.packageName]!.override = ports.remoteInfoRepo
            .tryGetScope(sharedVersion.remotes[0]!.name)
            .map(scope => _path.join(scope, sharedVersion.remotes[0]!.file))
            .orThrow(() => {
              config.log.debug(
                `[8][${remoteEntry.name}][${external.packageName}@${external.version}][override] Remote name not found in cache.`
              );
              return new NFError(
                `Could not find override url from remote ${sharedVersion.remotes[0]!.name}`
              );
            });
        }
      } else {
        addScopedExternal(remoteEntry.name, external);
      }
    });
    return actions;
  }

  function addSharedExternal(
    remoteName: RemoteName,
    sharedInfo: SharedInfo
  ): { action: SharedVersionAction; sharedVersion?: SharedVersion } {
    const cached: SharedExternal = ports.sharedExternalsRepo
      .tryGet(sharedInfo.packageName, sharedInfo.shareScope)
      .orElse({ dirty: false, versions: [] });

    let action: SharedVersionAction = 'skip';

    const tag = sharedInfo.version ?? FALLBACK_VERSION;
    const remote: SharedVersionMeta = {
      file: sharedInfo.outFileName,
      strictVersion: sharedInfo.strictVersion,
      requiredVersion: sharedInfo.requiredVersion,
      name: remoteName,
      cached: false,
    };

    const scopeType = ports.sharedExternalsRepo.scopeType(sharedInfo.shareScope);

    if (scopeType === 'strict') {
      remote.requiredVersion = tag;
      action = 'share';
    }

    const sharedVersion = cached.versions.find(c => c.action === 'share');
    const isCompatible =
      !sharedVersion || ports.versionCheck.isCompatible(sharedVersion.tag, remote.requiredVersion);

    if (action === 'skip' && !isCompatible && remote.strictVersion) {
      config.log.debug(
        `[8][${remoteName}][${sharedInfo.packageName}@${sharedInfo.version}] Is not compatible with existing [${sharedInfo.packageName}@${sharedVersion!.tag}] requiredRange '${sharedVersion!.remotes[0]?.requiredVersion}'`
      );
      action = 'scope';
      if (config.strict) {
        throw new NFError(
          `${sharedInfo.packageName}@${sharedInfo.version} from remote ${remoteName} is not compatible with ${sharedVersion.remotes[0]!.name}.`
        );
      }
    }

    const matchingVersion = cached.versions.find(cached => cached.tag === tag);

    if (!!matchingVersion) {
      if (
        remote.strictVersion &&
        matchingVersion.remotes[0]!.requiredVersion !== remote.requiredVersion
      ) {
        config.log.warn(
          `[${remoteName}][${sharedInfo.packageName}@${sharedInfo.version}] Required version '${remote.requiredVersion}' does not match existing '${matchingVersion.remotes[0]!.requiredVersion}'`
        );
      }
      matchingVersion.remotes.push(remote);
    } else {
      if (!sharedVersion) action = 'share';
      remote.cached = action !== 'skip';
      cached.versions.push({ tag, action, host: false, remotes: [remote] });
    }

    ports.sharedExternalsRepo.addOrUpdate(
      sharedInfo.packageName,
      {
        dirty: cached.dirty,
        versions: cached.versions.sort((a, b) => ports.versionCheck.compare(b.tag, a.tag)),
      },
      sharedInfo.shareScope
    );

    return { action, sharedVersion };
  }

  function addScopedExternal(remoteName: RemoteName, sharedInfo: SharedInfo): void {
    ports.scopedExternalsRepo.addExternal(remoteName, sharedInfo.packageName, {
      tag: sharedInfo.version ?? FALLBACK_VERSION,
      file: sharedInfo.outFileName,
    } as ScopedVersion);
  }
}
