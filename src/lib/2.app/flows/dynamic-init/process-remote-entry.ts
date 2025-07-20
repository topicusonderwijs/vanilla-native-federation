import type { RemoteEntry, SharedInfo, SharedInfoActions } from 'lib/1.domain';
import type { LoggingConfig } from '../../config/log.contract';
import * as _path from 'lib/utils/path';
import type { ForProcessingRemoteEntry } from 'lib/2.app/driver-ports/dynamic-init/for-processing-remote-entry';

export function createProcessRemoteEntry({ log }: LoggingConfig): ForProcessingRemoteEntry {
  return ({ entry, actions }) => {
    const processedEntry: RemoteEntry = {
      ...entry,
      shared: [],
      exposes: JSON.parse(JSON.stringify(entry.exposes)),
    };
    log.debug(`[8][${entry.name}] Processing actions:`, actions);
    log.debug(`[8][${entry.name}] Original remote entry:`, entry);
    try {
      addExternals(processedEntry, entry.shared, actions);
      log.debug(`[8][${entry.name}] Processed remote entry:`, processedEntry);
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
        log.debug(
          `[9][${entry.name}] No action found for shared external '${external.packageName}'.`
        );
        return;
      }

      if (actions[external.packageName]!.action === 'skip') return;

      const processedExternal = { ...external };

      if (actions[external.packageName]!.action === 'scope') {
        processedExternal.singleton = false;
        if (actions[external.packageName]!.override)
          processedExternal.scopeOverride = actions[external.packageName]!.override;
      }

      entry.shared.push(processedExternal);
    });
  }
}
