import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';
import type { RemoteEntry } from 'lib/1.domain';
import type { LoggingConfig } from '../../config/log.contract';
import * as _path from 'lib/utils/path';
import type { ForConvertingToImportMap } from 'lib/2.app/driver-ports/dynamic-init/for-converting-to-import-map';

export function createConvertToImportMap({ log }: LoggingConfig): ForConvertingToImportMap {
  return (remoteEntry: RemoteEntry) => {
    const importMap: ImportMap = { imports: {} };
    try {
      addExternals(remoteEntry, importMap);
      addRemoteInfos(remoteEntry, importMap);
      log.debug('[10] Updated importMap:', importMap);
      return Promise.resolve(importMap);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  function addExternals(remoteEntry: RemoteEntry, importMap: ImportMap): void {
    if (!remoteEntry.shared) {
      return;
    }

    const remoteEntryScope = _path.getScope(remoteEntry.url);
    remoteEntry.shared.forEach(external => {
      const externalScope = external.scopeOverride || remoteEntryScope;

      //  Shared externals
      if (external.singleton && !external.shareScope) {
        importMap.imports[external.packageName] = _path.join(externalScope, external.outFileName);
        return;
      }

      // Scoped externals
      importMap['scopes'] = importMap.scopes || {};
      importMap.scopes[remoteEntryScope] = importMap.scopes[remoteEntryScope] || {};
      importMap.scopes[remoteEntryScope][external.packageName] = _path.join(
        externalScope,
        external.outFileName
      );
    });
  }

  function addRemoteInfos(remoteEntry: RemoteEntry, importMap: ImportMap): void {
    if (!remoteEntry.exposes) return;
    const scope = _path.getScope(remoteEntry.url);

    remoteEntry.exposes.forEach(exposed => {
      const moduleName = _path.join(remoteEntry.name, exposed.key);
      const moduleUrl = _path.join(scope, exposed.outFileName);
      importMap.imports[moduleName] = moduleUrl;
    });
  }
}
