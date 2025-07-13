import type { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { ImportMap, Imports } from 'lib/1.domain/import-map/import-map.contract';
import type { ExternalsScope, RemoteInfo, SharedExternal, SharedVersion } from 'lib/1.domain';
import type { LoggingConfig } from '../../config/log.contract';
import type { ModeConfig } from '../../config/mode.contract';
import * as _path from 'lib/utils/path';
import { NFError } from 'lib/native-federation.error';

export function createGenerateImportMap(
  config: LoggingConfig & ModeConfig,
  ports: Pick<DrivingContract, 'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo'>
): ForGeneratingImportMap {
  /**
   * Step 4: Generate an importMap from the cached remoteEntries
   *
   * The processed externals in the storage/cache (step 2 & 3) are used
   * to generate an importMap. The step returns the generated importMap object.
   */
  return () => {
    const importMap: ImportMap = { imports: {} };
    try {
      addScopedExternals(importMap);
      addSharedScopeExternals(importMap);
      addGlobalSharedExternals(importMap);
      addRemoteInfos(importMap);
      return Promise.resolve(importMap);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  /**
   * Step 4.1: Begin with appending smallest scope of shared dependencies
   * @param importMap
   * @returns
   */
  function addScopedExternals(importMap: ImportMap): ImportMap {
    const scopedExternals = ports.scopedExternalsRepo.getAll();

    for (const [scope, externals] of Object.entries(scopedExternals)) {
      addToScope(importMap, scope, createScopeModules(externals, scope));
    }

    return importMap;
  }

  function createScopeModules(externals: ExternalsScope, scope: string): Imports {
    const modules: Imports = {};

    for (const [external, version] of Object.entries(externals)) {
      modules[external] = _path.join(scope, version.file);
    }

    return modules;
  }

  /**
   * Step 4.2: Added the shareScope externals, overriding the scoped externals that are shared
   * @param importMap
   * @returns
   */
  function addSharedScopeExternals(importMap: ImportMap): ImportMap {
    const sharedScopes = ports.sharedExternalsRepo.getScopes({ includeGlobal: false });

    for (const sharedScope of sharedScopes) {
      processSharedScope(importMap, sharedScope);
    }

    return importMap;
  }

  function processSharedScope(importMap: ImportMap, sharedScope: string): void {
    const sharedExternals = ports.sharedExternalsRepo.getAll(sharedScope);

    for (const [externalName, external] of Object.entries(sharedExternals)) {
      const override = findOverride(external, sharedScope, externalName);

      for (const version of external.versions) {
        if (!override || version.action === 'scope') {
          addToScope(importMap, _path.getScope(version.file), { [externalName]: version.file });
          version.cached = true;
        } else if (override) {
          // skip and share both get the same override
          addToScope(importMap, _path.getScope(version.file), { [externalName]: override.file });
          if (version.file === override.file) {
            version.cached = true;
          }
        }
      }
      ports.sharedExternalsRepo.addOrUpdate(externalName, external, sharedScope);
    }
  }

  function findOverride(
    external: SharedExternal,
    scope: string,
    externalName: string
  ): SharedVersion | undefined {
    const sharedVersions = external.versions.filter(v => v.action === 'share');

    const scopedExternalName = `${scope}.${externalName}`;

    if (sharedVersions.length > 1) {
      handleMultipleSharedVersions(scopedExternalName);
    }

    if (sharedVersions.length < 1) {
      config.log.warn(`ShareScope external ${scopedExternalName} has no shared versions.`);
    }

    return sharedVersions[0];
  }

  function handleMultipleSharedVersions(scopedExternalName: string): void {
    const message = `ShareScope external ${scopedExternalName} has multiple shared versions.`;

    if (config.strict) {
      config.log.error(message);
      throw new NFError('Could not create ImportMap.');
    }

    config.log.warn(message);
  }

  /**
   * Step 4.3: Added the globally shared externals.
   * @param importMap
   * @returns
   */
  function addGlobalSharedExternals(importMap: ImportMap): ImportMap {
    const sharedExternals = ports.sharedExternalsRepo.getAll();

    for (const [externalName, external] of Object.entries(sharedExternals)) {
      for (const version of external.versions) {
        if (version.action === 'scope') {
          addToScope(importMap, _path.getScope(version.file), { [externalName]: version.file });
          version.cached = true;
        }
        if (version.action === 'share') {
          if (importMap.imports[externalName]) {
            handleDuplicateGlobalExternal(externalName);
            continue; // skip
          }
          addToGlobal(importMap, { [externalName]: version.file });
          version.cached = true;
        }
      }
      ports.sharedExternalsRepo.addOrUpdate(externalName, external);
    }

    return importMap;
  }

  function handleDuplicateGlobalExternal(externalName: string): void {
    const message = `Singleton external ${externalName} has multiple shared versions.`;

    if (config.strict) {
      config.log.error(message);
      throw new NFError('Could not create ImportMap.');
    }

    config.log.warn(message);
  }

  function addToScope(importMap: ImportMap, scope: string, imports: Imports): void {
    if (!importMap.scopes) importMap.scopes = {};
    if (!importMap.scopes[scope]) importMap.scopes[scope] = {};
    importMap.scopes[scope] = Object.assign(importMap.scopes[scope], imports);
  }
  function addToGlobal(importMap: ImportMap, imports: Imports): void {
    importMap.imports = Object.assign(importMap.imports, imports);
  }

  /**
   * Step 4.4: Added the remote-modules (into the global scope).
   * @param importMap
   * @returns
   */
  function addRemoteInfos(importMap: ImportMap): void {
    const remotes = ports.remoteInfoRepo.getAll();

    for (const [remoteName, remote] of Object.entries(remotes)) {
      addRemoteExposedModules(importMap, remoteName, remote);
    }
  }

  function addRemoteExposedModules(
    importMap: ImportMap,
    remoteName: string,
    remote: RemoteInfo
  ): void {
    for (const exposed of remote.exposes) {
      const moduleName = _path.join(remoteName, exposed.moduleName);
      const moduleUrl = _path.join(remote.scopeUrl, exposed.file);
      importMap.imports[moduleName] = moduleUrl;
    }
  }
}
