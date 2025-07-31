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
  ports: Pick<DrivingContract, 'remoteEntryProvider' | 'remoteInfoRepo'>
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
        if (remoteEntry.name !== remoteName) {
          const errorDetails = `Fetched remote '${remoteEntry.name}' does not match requested '${remoteName}'.`;
          if (config.strict) {
            config.log.error(7, errorDetails);
            return Promise.reject(
              new NFError(`[${remoteName ?? remoteEntryUrl}] Could not fetch remoteEntry.`)
            );
          }
          config.log.warn(7, `${errorDetails} Omitting expected name.`);
        }
      }

      if (ports.remoteInfoRepo.contains(remoteEntry.name)) {
        remoteEntry.override = true;
        config.log.debug(7, `Overriding existing remote '${remoteName}' with '${remoteEntryUrl}'.`);
      }
      return Optional.of(remoteEntry);
    } catch (error: unknown) {
      config.log.error(
        7,
        `[${remoteName ?? 'unknown'}] Could not fetch remoteEntry from ${remoteEntryUrl}.`
      );
      return Promise.reject(
        new NFError(`[${remoteName ?? remoteEntryUrl}] Could not fetch remoteEntry.`)
      );
    }
  };

  function shouldSkipCachedRemote(remoteEntryUrl: string, remoteName: RemoteName): boolean {
    let shouldSkip = false;
    ports.remoteInfoRepo.tryGet(remoteName).ifPresent(remoteInfo => {
      if (config.profile.skipCachedRemotes !== 'never') {
        shouldSkip = true;
        return;
      }

      if (_path.join(remoteInfo.scopeUrl, 'remoteEntry.json') === remoteEntryUrl) {
        shouldSkip = true;
        return;
      }
    });
    return shouldSkip;
  }
}
