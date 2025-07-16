import type { RemoteEntryUrl } from 'lib/1.domain/remote-entry/manifest.contract';
import type { RemoteName } from 'lib/1.domain/remote/remote-info.contract';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import { NFError } from 'lib/native-federation.error';
import type { ModeConfig } from '../../config/mode.contract';
import type { ForGettingRemoteEntry } from '../../driver-ports/dynamic-init/for-getting-remote-entry.port';

export function createGetRemoteEntry(
  config: LoggingConfig & ModeConfig,
  ports: Pick<DrivingContract, 'remoteEntryProvider' | 'remoteInfoRepo'>
): ForGettingRemoteEntry {
  return async (remoteEntryUrl: RemoteEntryUrl, remoteName?: RemoteName) => {
    if (!!remoteName && shouldSkipCachedRemote(remoteName)) {
      throw new NFError(`Found remote '${remoteName}' in storage, omitting fetch.`);
    }

    try {
      const remoteEntry = await ports.remoteEntryProvider.provide(remoteEntryUrl);

      config.log.debug(
        `Fetched (dynamic) '${remoteEntry.name}' from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`
      );
      if (!!remoteName && remoteEntry.name !== remoteName) {
        config.log.warn(
          `Fetched remote '${remoteEntry.name}' does not match requested '${remoteName}'.`
        );
      }
      return remoteEntry;
    } catch (error: unknown) {
      throw new NFError('Could not fetch remoteEntry.', error as Error);
    }
  };

  function shouldSkipCachedRemote(remoteName: RemoteName): boolean {
    return config.profile.skipCachedRemotes && ports.remoteInfoRepo.contains(remoteName);
  }
}
