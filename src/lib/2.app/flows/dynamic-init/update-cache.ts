import type { ForUpdatingCache } from '../../driver-ports/dynamic-init/for-updating-cache';
import {
  FALLBACK_VERSION,
  type RemoteEntry,
  type RemoteInfo,
  type RemoteName,
  type SharedInfo,
  type SharedInfoActions,
  type SharedVersion,
  type SharedVersionAction,
  type Version,
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
      if (!isValidExternalVersion(external, remoteEntry.name)) {
        return;
      }

      if (external.singleton) {
        handleSharedExternal(remoteEntry, external, actions);
      } else {
        addScopedExternal(remoteEntry.name, external);
      }
    });

    return actions;
  }

  function isValidExternalVersion(external: SharedInfo, remoteName: string): boolean {
    if (external.version && ports.versionCheck.isValidSemver(external.version)) {
      return true;
    }

    config.log.debug(
      `[8][${remoteName}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
    );

    if (config.strict) {
      throw new NFError(`Invalid version '${external.packageName}@${external.version}'`);
    }

    return false;
  }

  function handleSharedExternal(
    remoteEntry: RemoteEntry,
    external: SharedInfo,
    actions: SharedInfoActions
  ): void {
    const { action, sharedVersion } = addSharedExternal(remoteEntry.name, external);
    actions[external.packageName] = { action };

    if (action === 'skip' && !!external.shareScope && !!sharedVersion?.file) {
      actions[external.packageName]!.override = getOverrideUrl(
        sharedVersion!,
        remoteEntry.name,
        external
      );
    }
  }

  function getOverrideUrl(
    sharedVersion: SharedVersion,
    remoteName: string,
    external: SharedInfo
  ): string {
    return ports.remoteInfoRepo
      .tryGetScope(sharedVersion.remote)
      .map(scope => _path.join(scope, sharedVersion.file))
      .orThrow(() => {
        config.log.debug(
          `[8][${remoteName}][${external.packageName}@${external.version}][override] Remote name not found in cache.`
        );
        return new NFError(`Could not find override url from remote ${sharedVersion.remote}`);
      });
  }

  function addSharedExternal(
    remoteName: RemoteName,
    remoteEntryVersion: SharedInfo
  ): { action: SharedVersionAction; sharedVersion?: SharedVersion } {
    const cachedVersions: SharedVersion[] = ports.sharedExternalsRepo
      .tryGetVersions(remoteEntryVersion.packageName, remoteEntryVersion.shareScope)
      .orElse([]);

    const existingVersionIndex = cachedVersions.findIndex(
      cache => cache.version === remoteEntryVersion.version
    );
    if (existingVersionIndex !== -1) {
      return handleExistingVersion(
        remoteEntryVersion,
        existingVersionIndex,
        remoteName,
        cachedVersions
      );
    }

    if (ports.sharedExternalsRepo.scopeType(remoteEntryVersion.shareScope) === 'strict') {
      return handleStrictScopeVersion(remoteName, remoteEntryVersion, cachedVersions);
    }

    return handleNormalScopeVersion(remoteName, remoteEntryVersion, cachedVersions);
  }

  function handleExistingVersion(
    remoteEntryVersion: SharedInfo,
    versionIndex: number,
    remoteName: RemoteName,
    cachedVersions: SharedVersion[]
  ): { action: SharedVersionAction; sharedVersion: SharedVersion } {
    const existingVersion = cachedVersions[versionIndex]!; // Safe because index was found

    ports.sharedExternalsRepo.markVersionAsUsedBy(
      remoteEntryVersion.packageName,
      versionIndex,
      remoteName,
      remoteEntryVersion.shareScope
    );

    return {
      action: 'skip',
      sharedVersion: existingVersion,
    };
  }

  function handleStrictScopeVersion(
    remoteName: RemoteName,
    remoteEntryVersion: SharedInfo,
    cachedVersions: SharedVersion[]
  ): { action: SharedVersionAction } {
    const newVersion = createSharedVersion(remoteName, remoteEntryVersion, {
      action: 'share',
      cached: true,
    });

    cachedVersions.push(newVersion);
    updateSharedExternalsRepo(remoteEntryVersion, cachedVersions);

    return { action: 'share' };
  }

  function handleNormalScopeVersion(
    remoteName: RemoteName,
    remoteEntryVersion: SharedInfo,
    cachedVersions: SharedVersion[]
  ): { action: SharedVersionAction; sharedVersion?: SharedVersion } {
    const sharedVersion = cachedVersions.find(c => c.action === 'share');
    const isCompatible =
      !sharedVersion ||
      ports.versionCheck.isCompatible(sharedVersion.version, remoteEntryVersion.requiredVersion);

    if (!isCompatible && remoteEntryVersion.strictVersion) {
      handleIncompatibleVersion(remoteName, remoteEntryVersion, sharedVersion);
    }

    const { action, cached } = determineActionAndCaching(
      sharedVersion,
      isCompatible,
      remoteEntryVersion
    );

    const newVersion = createSharedVersion(remoteName, remoteEntryVersion, {
      action,
      cached,
    });

    cachedVersions.push(newVersion);
    updateSharedExternalsRepo(remoteEntryVersion, cachedVersions);

    return { action, sharedVersion };
  }

  function handleIncompatibleVersion(
    remoteName: RemoteName,
    remoteEntryVersion: SharedInfo,
    sharedVersion: SharedVersion | undefined
  ): void {
    config.log.debug(
      `[8][${remoteName}][${remoteEntryVersion.packageName}@${remoteEntryVersion.version}] Is not compatible with existing [${remoteEntryVersion.packageName}@${sharedVersion!.version}] requiredRange '${sharedVersion!.requiredVersion}'`
    );

    if (config.strict) {
      throw new NFError(
        `${remoteEntryVersion.packageName}@${remoteEntryVersion.version} from remote ${remoteName} is not compatible with ${sharedVersion!.remote}.`
      );
    }
  }

  function determineActionAndCaching(
    sharedVersion: SharedVersion | undefined,
    isCompatible: boolean,
    remoteEntryVersion: SharedInfo
  ): { action: SharedVersionAction; cached: boolean } {
    if (!sharedVersion) {
      return { action: 'share', cached: true };
    }

    const action: SharedVersionAction =
      isCompatible || !remoteEntryVersion.strictVersion ? 'skip' : 'scope';

    return { action, cached: action !== 'skip' };
  }

  function createSharedVersion(
    remoteName: RemoteName,
    remoteEntryVersion: SharedInfo,
    options: { action: SharedVersionAction; cached: boolean }
  ): SharedVersion {
    return {
      version: remoteEntryVersion.version!,
      remote: remoteName,
      requiredVersion:
        remoteEntryVersion.requiredVersion ?? remoteEntryVersion.version ?? FALLBACK_VERSION,
      strictVersion: remoteEntryVersion.strictVersion,
      host: false,
      file: remoteEntryVersion.outFileName,
      cached: options.cached,
      action: options.action,
    } as SharedVersion;
  }

  function updateSharedExternalsRepo(
    remoteEntryVersion: SharedInfo,
    cachedVersions: SharedVersion[]
  ): void {
    ports.sharedExternalsRepo.addOrUpdate(
      remoteEntryVersion.packageName,
      {
        dirty: false,
        versions: cachedVersions.sort((a, b) => ports.versionCheck.compare(b.version, a.version)),
      },
      remoteEntryVersion.shareScope
    );
  }

  function addScopedExternal(remoteName: RemoteName, sharedInfo: SharedInfo): void {
    ports.scopedExternalsRepo.addExternal(remoteName, sharedInfo.packageName, {
      version: sharedInfo.version!,
      file: sharedInfo.outFileName,
    } as Version);
  }
}
