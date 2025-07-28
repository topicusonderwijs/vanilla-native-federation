import type { ForUpdatingCache } from '../../driver-ports/dynamic-init/for-updating-cache';
import type {
  RemoteEntry,
  RemoteInfo,
  RemoteName,
  SharedInfo,
  SharedInfoActions,
  SharedVersion,
  SharedVersionAction,
  Version,
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

        if (action === 'skip' && external.shareScope && sharedVersion?.file) {
          actions[external.packageName]!.override = ports.remoteInfoRepo
            .tryGetScope(sharedVersion.remote)
            .orThrow(() => {
              config.log.debug(
                `[8][${remoteEntry.name}][${external.packageName}@${external.version}][override] Remote name not found in cache.`
              );
              return new NFError(`Could not find override url from remote ${sharedVersion.remote}`);
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
    remoteEntryVersion: SharedInfo
  ): { action: SharedVersionAction; sharedVersion?: SharedVersion } {
    const cachedVersions: SharedVersion[] = ports.sharedExternalsRepo
      .tryGetVersions(remoteEntryVersion.packageName, remoteEntryVersion.shareScope)
      .orElse([]);

    const matchingVersionIDX = cachedVersions.findIndex(
      cache => cache.version === remoteEntryVersion.version
    );
    if (~matchingVersionIDX) {
      ports.sharedExternalsRepo.markVersionAsUsedBy(
        remoteEntryVersion.packageName,
        matchingVersionIDX,
        remoteName,
        remoteEntryVersion.shareScope
      );
      return {
        action: 'skip',
        sharedVersion: cachedVersions[matchingVersionIDX],
      };
    }

    const sharedVersion = cachedVersions.find(c => c.action === 'share');
    const isCompabible =
      !sharedVersion ||
      ports.versionCheck.isCompatible(sharedVersion.version, remoteEntryVersion.requiredVersion);

    if (!isCompabible && remoteEntryVersion.strictVersion) {
      config.log.debug(
        `[8][${remoteName}][${remoteEntryVersion.packageName}@${remoteEntryVersion.version}] Is not compatible with existing [${remoteEntryVersion.packageName}@${sharedVersion!.version}] requiredRange '${sharedVersion!.requiredVersion}'`
      );
      if (config.strict) {
        throw new NFError(
          `${remoteEntryVersion.packageName}@${remoteEntryVersion.version} from remote ${remoteName} is not compatible with ${sharedVersion.remote}.`
        );
      }
    }

    let action: SharedVersionAction = 'share';
    let cached = true;
    const file = remoteEntryVersion.outFileName;

    if (sharedVersion) {
      action = isCompabible || !remoteEntryVersion.strictVersion ? 'skip' : 'scope';

      cached = action !== 'skip';
    }

    cachedVersions.push({
      version: remoteEntryVersion.version!,
      remote: remoteName,
      requiredVersion: remoteEntryVersion.requiredVersion,
      strictVersion: remoteEntryVersion.strictVersion,
      host: false,
      file,
      cached,
      action,
    } as SharedVersion);

    ports.sharedExternalsRepo.addOrUpdate(
      remoteEntryVersion.packageName,
      {
        dirty: false,
        versions: cachedVersions.sort((a, b) => ports.versionCheck.compare(b.version, a.version)),
      },
      remoteEntryVersion.shareScope
    );

    return { action, sharedVersion };
  }

  function addScopedExternal(remoteName: RemoteName, sharedInfo: SharedInfo): void {
    ports.scopedExternalsRepo.addExternal(remoteName, sharedInfo.packageName, {
      version: sharedInfo.version!,
      file: sharedInfo.outFileName,
    } as Version);
  }
}
