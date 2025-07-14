import type { ForProcessingDynamicRemoteEntry } from '../../driver-ports/dynamic-init/for-processing-dynamic-remote-entry';
import type {
  RemoteEntry,
  RemoteInfo,
  SharedInfo,
  SharedVersion,
  SharedVersionAction,
  Version,
} from 'lib/1.domain';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import * as _path from 'lib/utils/path';
import { NFError } from 'lib/native-federation.error';
import type { ModeConfig } from 'lib/2.app/config/mode.contract';

export function createProcessDynamicRemoteEntry(
  config: LoggingConfig & ModeConfig,
  ports: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'sharedExternalsRepo' | 'scopedExternalsRepo' | 'versionCheck'
  >
): ForProcessingDynamicRemoteEntry {
  return remoteEntry => {
    addRemoteInfoToStorage(remoteEntry);
    addExternalsToStorage(remoteEntry);
    return Promise.resolve(remoteEntry);
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

    remoteEntry.shared.forEach((external, idx) => {
      if (!external.version || !ports.versionCheck.isValidSemver(external.version)) {
        config.log.warn(
          `[${remoteEntry.name}][${external.packageName}] Version '${external.version}' is not a valid version, skipping version.`
        );
        return;
      }
      if (external.singleton) {
        const { action } = addSharedExternal(scopeUrl, external);
        if (action === 'skip') remoteEntry.shared.splice(idx, 1);
      } else {
        addScopedExternal(scopeUrl, external);
      }
    });
  }

  function addSharedExternal(
    scope: string,
    remoteEntryVersion: SharedInfo
  ): { action: SharedVersionAction } {
    const cached: SharedVersion[] = ports.sharedExternalsRepo
      .tryGetVersions(remoteEntryVersion.packageName, remoteEntryVersion.sharedScope)
      .orElse([]);

    if (~cached.findIndex(cache => cache.version === remoteEntryVersion.version)) {
      config.log.debug(
        `[dynamic][${scope}][${remoteEntryVersion.packageName}@${remoteEntryVersion.version}] Shared version already exists, skipping version.`
      );

      return { action: 'skip' };
    }

    const cachedVersion = cached.find(c => c.cached);
    const isCompabible =
      !cachedVersion ||
      ports.versionCheck.isCompatible(cachedVersion.version, remoteEntryVersion.requiredVersion);

    if (!isCompabible && remoteEntryVersion.strictVersion) {
      if (config.strict) {
        throw new NFError(
          `[dynamic][${scope}][${remoteEntryVersion.packageName}@${remoteEntryVersion.version}] Shared version ${remoteEntryVersion.version} is not compatible with range '${cachedVersion!.requiredVersion}'`
        );
      }
      config.log.warn(
        `[dynamic][${scope}][${remoteEntryVersion.packageName}@${remoteEntryVersion.version}] Shared version ${remoteEntryVersion.version} is not compatible with range '${cachedVersion!.requiredVersion}'`
      );
    }

    const action = !cachedVersion
      ? 'share'
      : !remoteEntryVersion.strictVersion || isCompabible
        ? 'skip'
        : 'scope';

    cached.push({
      version: remoteEntryVersion.version!,
      file: _path.join(scope, remoteEntryVersion.outFileName),
      requiredVersion: remoteEntryVersion.requiredVersion,
      strictVersion: remoteEntryVersion.strictVersion,
      host: false,
      cached: false,
      action: action,
    } as SharedVersion);

    ports.sharedExternalsRepo.addOrUpdate(
      remoteEntryVersion.packageName,
      {
        dirty: false,
        versions: cached.sort((a, b) => ports.versionCheck.compare(b.version, a.version)),
      },
      remoteEntryVersion.sharedScope
    );

    return { action };
  }

  function addScopedExternal(scope: string, sharedInfo: SharedInfo): void {
    ports.scopedExternalsRepo.addExternal(scope, sharedInfo.packageName, {
      version: sharedInfo.version!,
      file: sharedInfo.outFileName,
    } as Version);
  }
}
