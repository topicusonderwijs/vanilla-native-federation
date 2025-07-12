import type { RemoteEntry } from 'lib/1.domain/remote-entry/remote-entry.contract';
import type { RemoteEntryUrl } from 'lib/1.domain/remote-entry/manifest.contract';
import type { RemoteName } from 'lib/1.domain/remote/remote-info.contract';
import type { DrivingContract } from '../driving-ports/driving.contract';
import type { LoggingConfig } from '../config/log.contract';
import { NFError } from 'lib/native-federation.error';
import type { ModeConfig } from '../config/mode.contract';
import type { HostConfig } from '../config/host.contract';
import type { ForGettingDynamicRemoteEntry } from '../driver-ports/for-getting-dynamic-remote-entry.port';

export function createGetDynamicRemoteEntry(
  config: LoggingConfig & ModeConfig & HostConfig,
  ports: Pick<DrivingContract, 'remoteEntryProvider' | 'manifestProvider' | 'remoteInfoRepo'>
): ForGettingDynamicRemoteEntry {
  return async (remoteEntryUrl: RemoteEntryUrl, remoteName?: RemoteName) => {
    if (!!remoteName && shouldSkipCachedRemote(remoteName)) {
      config.log.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
      return [];
    }

    try {
      const remoteEntry = await ports.remoteEntryProvider.provide(remoteEntryUrl);
      return [processRemoteEntry(remoteEntry, remoteName)];
    } catch (error) {
      config.log.warn('Failed to fetch (dynamic) remoteEntry.', error);
      if (config.strict) throw new NFError('Could not fetch remoteEntry.');
      return [];
    }
  };

  function shouldSkipCachedRemote(remoteName: RemoteName): boolean {
    return config.profile.skipCachedRemotes && ports.remoteInfoRepo.contains(remoteName);
  }

  function processRemoteEntry(remoteEntry: RemoteEntry, expectedRemoteName?: string): RemoteEntry {
    remoteEntry.host = false;
    remoteEntry.dynamic = true;

    config.log.debug(
      `Fetched (dynamic) '${remoteEntry.name}' from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`
    );
    if (remoteEntry.name !== expectedRemoteName) {
      config.log.warn(
        `Fetched remote '${remoteEntry.name}' does not match requested '${expectedRemoteName}'.`
      );
    }

    return remoteEntry;
  }
}
