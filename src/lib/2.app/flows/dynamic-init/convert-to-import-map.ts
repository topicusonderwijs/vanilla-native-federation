import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';
import type { RemoteEntry } from 'lib/1.domain';
import type { LoggingConfig } from '../../config/log.contract';
import type { ModeConfig } from '../../config/mode.contract';
import * as _path from 'lib/utils/path';
import type { ForConvertingToImportMap } from 'lib/2.app/driver-ports/dynamic-init/for-converting-to-import-map';

export function createConvertToImportMap(
  { log }: LoggingConfig & ModeConfig,
  ports: Pick<DrivingContract, 'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo'>
): ForConvertingToImportMap {
  return (remoteEntry: RemoteEntry) => {
    const importMap: ImportMap = { imports: {} };
    try {
      log.debug('Converting remote entry to import map:', remoteEntry);
      addExternals(remoteEntry, importMap);
      addRemoteInfos(remoteEntry, importMap);
      log.debug('Final importMap:', importMap);
      return Promise.resolve(importMap);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  function addExternals(remoteEntry: RemoteEntry, importMap: ImportMap): void {
    if (!remoteEntry.shared) {
      return;
    }
    remoteEntry.shared.forEach(external => {
      //  Global shared externals
      if (external.singleton && !external.sharedScope) {
        importMap.imports[external.packageName] = _path.join(remoteEntry.url, external.outFileName);
        return;
      }

      // Scoped shared externals
      if (external.singleton) {
        importMap.imports[external.packageName] = ports.sharedExternalsRepo
          .tryGetVersions(external.packageName, external.sharedScope)
          .map(v => v.find(c => c.cached)?.file)
          .orElse(_path.join(remoteEntry.url, external.outFileName));
        return;
      }

      // Scoped externals
      const scope = _path.getScope(remoteEntry.url);
      importMap['scopes'] = importMap.scopes || {};
      importMap.scopes[scope] = importMap.scopes[scope] || {};
      importMap.scopes[scope][external.packageName] = _path.join(
        remoteEntry.url,
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
