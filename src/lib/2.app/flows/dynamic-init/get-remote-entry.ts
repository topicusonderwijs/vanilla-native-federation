import type { RemoteEntryUrl } from 'lib/1.domain/remote-entry/manifest.contract';
import type { RemoteName } from 'lib/1.domain/remote/remote-info.contract';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import { NFError } from 'lib/native-federation.error';
import type { ModeConfig } from '../../config/mode.contract';
import type { ForGettingRemoteEntry } from '../../driver-ports/dynamic-init/for-getting-remote-entry.port';
import { Optional } from 'lib/utils/optional';
import type { RemoteEntry } from 'lib/1.domain';

export function createGetRemoteEntry(
  config: LoggingConfig & ModeConfig,
  ports: Pick<DrivingContract, 'remoteEntryProvider' | 'remoteInfoRepo'>
): ForGettingRemoteEntry {
  return async (remoteEntryUrl: RemoteEntryUrl, remoteName?: RemoteName) => {
    if (!!remoteName && shouldSkipCachedRemote(remoteName)) {
      config.log.debug(`[7][${remoteName}] Skipped initialization of cached remote.`);
      return Optional.empty<RemoteEntry>();
    }

    try {
      const remoteEntry = await ports.remoteEntryProvider.provide(remoteEntryUrl);

      config.log.debug(
        `[7][${remoteEntry.name}] Fetched from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`
      );
      if (!!remoteName && remoteEntry.name !== remoteName) {
        config.log.warn(
          `remoteEntry '${remoteEntry.name}' Does not match expected '${remoteName}'.`
        );
      }
      return Optional.of(remoteEntry);
    } catch (error: unknown) {
      throw new NFError(
        `[${remoteName ?? remoteEntryUrl}] Could not fetch remoteEntry.`,
        error as Error
      );
    }
  };

  function shouldSkipCachedRemote(remoteName: RemoteName): boolean {
    return (
      config.profile.skipCachedRemotes !== 'never' && ports.remoteInfoRepo.contains(remoteName)
    );
  }
}
