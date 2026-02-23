import type { RemoteEntryUrl } from 'lib/1.domain/remote-entry/manifest.contract';
import type { RemoteName } from 'lib/1.domain/remote/remote-info.contract';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { LoggingConfig } from '../../config/log.contract';
import { NFError } from 'lib/native-federation.error';
import type { ModeConfig } from '../../config/mode.contract';
import type { ForGettingRemoteEntry } from '../../driver-ports/dynamic-init/for-getting-remote-entry.port';
import { Optional } from 'lib/utils/optional';
import type { RemoteEntry } from 'lib/1.domain';
import * as _path from 'lib/utils/path';

export function createGetRemoteEntry(
  config: LoggingConfig & ModeConfig,
  ports: Pick<DrivingContract, 'remoteEntryProvider' | 'remoteInfoRepo' | 'sse'>
): ForGettingRemoteEntry {
  return async (remoteEntryUrl: RemoteEntryUrl, remoteName?: RemoteName) => {
    if (!!remoteName && shouldSkipCachedRemote(remoteEntryUrl, remoteName)) {
      config.log.debug(7, `Found remote '${remoteName}' in storage, omitting fetch.`);
      return Optional.empty<RemoteEntry>();
    }

    try {
      const remoteEntry = await ports.remoteEntryProvider.provide(remoteEntryUrl);

      config.log.debug(
        7,
        `[${remoteEntry.name}] Fetched from '${remoteEntry.url}', exposing: ${JSON.stringify(remoteEntry.exposes)}`
      );
      if (!!remoteName && remoteEntry.name !== remoteName) {
        const errorMsg = `Fetched remote '${remoteEntry.name}' does not match requested '${remoteName}'.`;
        if (config.strict.strictRemoteEntry) {
          config.log.error(7, errorMsg);
          throw new NFError('Could not fetch remote entry');
        }
        config.log.warn(7, errorMsg + ' Omitting expected name.');
      }

      if (ports.remoteInfoRepo.contains(remoteEntry.name)) {
        remoteEntry.override = true;
        config.log.debug(7, `Overriding existing remote '${remoteName}' with '${remoteEntryUrl}'.`);
      }
      return Optional.of(checkForSSE(remoteEntry));
    } catch (error) {
      config.log.error(
        7,
        `[${remoteName ?? 'unknown'}] Could not fetch remoteEntry from ${remoteEntryUrl}.`,
        error
      );
      return Promise.reject(
        new NFError(`[${remoteName ?? remoteEntryUrl}] Could not fetch remoteEntry.`)
      );
    }
  };

  function shouldSkipCachedRemote(remoteEntryUrl: string, remoteName: RemoteName): boolean {
    return ports.remoteInfoRepo
      .tryGet(remoteName)
      .map(
        cachedRemoteInfo =>
          config.profile.overrideCachedRemotes !== 'always' ||
          (!config.profile.overrideCachedRemotesIfURLMatches &&
            remoteEntryUrl === _path.join(cachedRemoteInfo.scopeUrl, 'remoteEntry.json'))
      )
      .orElse(false);
  }

  function checkForSSE(entry: RemoteEntry): RemoteEntry {
    if (config.sse) {
      if (entry.buildNotificationsEndpoint) {
        ports.sse.watchRemoteBuilds(
          _path.join(_path.getScope(entry.url), entry.buildNotificationsEndpoint)
        );
        config.log.debug(7, `Registered SSE endpoint of remote '${entry.name}' `);
      } else {
        config.log.debug(7, `Remote ${entry.name} has no defined 'buildNotificationsEndpoint'`);
      }
    }
    return entry;
  }
}
