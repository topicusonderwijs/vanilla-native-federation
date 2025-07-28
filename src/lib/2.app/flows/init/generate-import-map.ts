import type { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { ImportMap, Imports } from 'lib/1.domain/import-map/import-map.contract';
import {
  GLOBAL_SCOPE,
  type RemoteName,
  type ExternalsScope,
  type RemoteInfo,
  type SharedExternal,
  type SharedVersion,
} from 'lib/1.domain';
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
      addshareScopeExternals(importMap);
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

    for (const [remoteName, externals] of Object.entries(scopedExternals)) {
      const scope = ports.remoteInfoRepo.tryGetScope(remoteName).orThrow(() => {
        config.log.debug(`[4][scoped][${remoteName}] Remote name not found in cache.`);
        return new NFError('Could not create ImportMap.');
      });
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
  function addshareScopeExternals(importMap: ImportMap): ImportMap {
    const shareScopes = ports.sharedExternalsRepo.getScopes({ includeGlobal: false });

    for (const shareScope of shareScopes) {
      processshareScope(importMap, shareScope);
    }

    return importMap;
  }

  function processshareScope(importMap: ImportMap, shareScope: string): void {
    const sharedExternals = ports.sharedExternalsRepo.getAll(shareScope);

    for (const [externalName, external] of Object.entries(sharedExternals)) {
      let override: SharedVersion | undefined | 'NOT_AVAILABLE' = undefined;
      let overrideScope: string | undefined = undefined;

      for (const version of external.versions) {
        if (version.action === 'skip') continue;

        const scope = getScope(externalName, shareScope, version.remote);

        let targetFileUrl: string = _path.join(scope, version.file);
        version.cached = true;

        if (version.action === 'override') {
          if (!override) {
            override = findOverride(external, shareScope, externalName) ?? 'NOT_AVAILABLE';
          }
          if (override !== 'NOT_AVAILABLE') {
            if (!overrideScope) overrideScope = getScope(externalName, shareScope, override.remote);
            targetFileUrl = _path.join(overrideScope, override.file);
            override.cached = true;
            version.cached = false;
          }
        }
        addToScope(importMap, scope, { [externalName]: targetFileUrl });
        if (!!version.usedBy) {
          version.usedBy.forEach(remoteName => {
            const scope = getScope(externalName, shareScope, remoteName);
            addToScope(importMap, scope, { [externalName]: targetFileUrl });
          });
        }
      }
      ports.sharedExternalsRepo.addOrUpdate(externalName, external, shareScope);
    }
  }

  function findOverride(
    external: SharedExternal,
    shareScope: string,
    externalName: string
  ): SharedVersion | undefined {
    const sharedVersions = external.versions.filter(v => v.action === 'share');
    const scopedExternalName = `${shareScope}.${externalName}`;

    if (sharedVersions.length > 1) {
      handleMultipleSharedVersions(scopedExternalName);
    }

    if (sharedVersions.length < 1) {
      if (config.strict) {
        config.log.debug(`[4][${shareScope}][${externalName}] shareScope has no override version.`);
        throw new NFError('Could not create ImportMap.');
      }
      config.log.debug(
        `[4][${shareScope}][${externalName}] shareScope has no override version, scoping override versions.`
      );
    }

    return sharedVersions[0];
  }

  function handleMultipleSharedVersions(scopedExternalName: string): void {
    if (config.strict) {
      config.log.debug(
        `[4][${scopedExternalName}] ShareScope external has multiple shared versions.`
      );
      throw new NFError('Could not create ImportMap.');
    }

    config.log.warn(`ShareScope external ${scopedExternalName} has multiple shared versions.`);
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
        if (version.action === 'override' || version.action === 'skip') continue;
        const scope = getScope(externalName, GLOBAL_SCOPE, version.remote);
        if (version.action === 'scope') {
          addToScope(importMap, scope, { [externalName]: _path.join(scope, version.file) });
          version.cached = true;
          continue;
        }

        if (importMap.imports[externalName]) {
          handleDuplicateGlobalExternal(externalName);
          continue;
        }

        addToGlobal(importMap, { [externalName]: _path.join(scope, version.file) });
        version.cached = true;
      }
      ports.sharedExternalsRepo.addOrUpdate(externalName, external);
    }

    return importMap;
  }

  function handleDuplicateGlobalExternal(externalName: string): void {
    if (config.strict) {
      config.log.debug(`[4][${externalName}] Shared external has multiple shared versions.`);
      throw new NFError('Could not create ImportMap.');
    }

    config.log.warn(`Singleton external ${externalName} has multiple shared versions.`);
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

  function getScope(externalName: string, shareScope: string, remoteName: RemoteName) {
    return ports.remoteInfoRepo.tryGetScope(remoteName).orThrow(() => {
      config.log.debug(
        `[4][${shareScope}][${externalName}][${remoteName}] Remote name not found in cache.`
      );
      return new NFError('Could not create ImportMap.');
    });
  }
}
