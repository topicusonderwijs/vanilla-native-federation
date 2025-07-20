import type { ForUpdatingCache } from '../../driver-ports/dynamic-init/for-updating-cache';
import type {
  RemoteEntry,
  RemoteInfo,
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
    const scopeUrl = _path.getScope(remoteEntry.url);

    const actions: SharedInfoActions = {};
    remoteEntry.shared.forEach(external => {
      if (!external.version || !ports.versionCheck.isValidSemver(external.version)) {
        config.log.warn(
          `[dynamic][${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
        );
        return;
      }
      if (external.singleton) {
        const { action, sharedVersion } = addSharedExternal(scopeUrl, external);
        actions[external.packageName] = { action };

        if (action === 'override' && external.sharedScope && sharedVersion?.file) {
          actions[external.packageName]!.override = _path.getScope(sharedVersion!.file);
        }
      } else {
        addScopedExternal(scopeUrl, external);
      }
    });
    return actions;
  }

  function addSharedExternal(
    scope: string,
    remoteEntryVersion: SharedInfo
  ): { action: SharedVersionAction; sharedVersion?: SharedVersion } {
    const cachedVersions: SharedVersion[] = ports.sharedExternalsRepo
      .tryGetVersions(remoteEntryVersion.packageName, remoteEntryVersion.sharedScope)
      .orElse([]);

    if (~cachedVersions.findIndex(cache => cache.version === remoteEntryVersion.version)) {
      config.log.debug(
        `[dynamic][${scope}][${remoteEntryVersion.packageName}@${remoteEntryVersion.version}] Shared version already exists, skipping version.`
      );

      return { action: 'skip' };
    }

    const sharedVersion = cachedVersions.find(c => c.action === 'share');
    const isCompabible =
      !sharedVersion ||
      ports.versionCheck.isCompatible(sharedVersion.version, remoteEntryVersion.requiredVersion);

    if (!isCompabible && remoteEntryVersion.strictVersion) {
      config.log.debug(
        `[8][${scope}][${remoteEntryVersion.packageName}@${remoteEntryVersion.version}] Is not compatible with existing [${remoteEntryVersion.packageName}@${sharedVersion!.version}] requiredRange '${sharedVersion!.requiredVersion}'`
      );
      if (config.strict) {
        throw new NFError(
          `${scope}.${remoteEntryVersion.packageName}@${remoteEntryVersion.version} Is not compatible.`
        );
      }
    }

    let action: SharedVersionAction = 'share';
    let cached = true;
    const file = _path.join(scope, remoteEntryVersion.outFileName);

    if (sharedVersion) {
      action =
        isCompabible || !remoteEntryVersion.strictVersion
          ? ports.sharedExternalsRepo.isGlobalScope(scope)
            ? 'skip'
            : 'override'
          : 'scope';

      cached = action !== 'skip' && (action !== 'override' || sharedVersion.file === file);
    }

    cachedVersions.push({
      version: remoteEntryVersion.version!,
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
      remoteEntryVersion.sharedScope
    );

    return { action, sharedVersion };
  }

  function addScopedExternal(scope: string, sharedInfo: SharedInfo): void {
    ports.scopedExternalsRepo.addExternal(scope, sharedInfo.packageName, {
      version: sharedInfo.version!,
      file: sharedInfo.outFileName,
    } as Version);
  }
}
