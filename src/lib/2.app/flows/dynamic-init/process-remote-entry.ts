import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { RemoteEntry, SharedInfo, SharedInfoActions } from 'lib/1.domain';
import type { LoggingConfig } from '../../config/log.contract';
import type { ModeConfig } from '../../config/mode.contract';
import * as _path from 'lib/utils/path';
import type { ForProcessingRemoteEntry } from 'lib/2.app/driver-ports/dynamic-init/for-processing-remote-entry';

export function createProcessRemoteEntry(
  { log }: LoggingConfig & ModeConfig,
  _drivers: DrivingContract
): ForProcessingRemoteEntry {
  return ({ entry, actions }) => {
    const processedEntry: RemoteEntry = {
      ...entry,
      shared: [],
      exposes: JSON.parse(JSON.stringify(entry.exposes)),
    };
    try {
      log.debug('Original remote entry:', entry);

      addExternals(processedEntry, entry.shared, actions);
      log.debug('Processed remote entry:', processedEntry);
      return Promise.resolve(processedEntry);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  function addExternals(
    entry: RemoteEntry,
    externals: SharedInfo[],
    actions: SharedInfoActions
  ): void {
    if (!externals) return;

    externals.forEach(external => {
      if (!external.singleton) {
        entry.shared.push({ ...external });
        return;
      }

      if (!actions[external.packageName]) {
        log.warn(
          `No action found for shared external '${external.packageName}' in remote entry '${entry.name}'.`
        );
        return;
      }
      //  Globally shared externals
      if (actions[external.packageName]!.action === 'share') {
        entry.shared.push({ ...external });
        return;
      }

      // Scoped globally shared externals
      if (actions[external.packageName]!.action === 'scope') {
        entry.shared.push({ ...external, singleton: false });
        return;
      }

      // Shared shareScope externals
      if (actions[external.packageName]!.action === 'skip' && external.sharedScope) {
        entry.shared.push({
          ...external,
          singleton: false,
          scopeOverride: actions[external.packageName]!.override,
        });
        return;
      }
    });
  }
}
