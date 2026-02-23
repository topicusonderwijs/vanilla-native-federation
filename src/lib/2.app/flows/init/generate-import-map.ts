import type { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import type { DrivingContract } from '../../driving-ports/driving.contract';
import type { ImportMap, Imports } from 'lib/1.domain/import-map/import-map.contract';
import {
  GLOBAL_SCOPE,
  type RemoteName,
  type ScopedExternal,
  type RemoteInfo,
  type SharedExternal,
  type SharedVersion,
} from 'lib/1.domain';
import type { LoggingConfig } from '../../config/log.contract';
import type { ModeConfig } from '../../config/mode.contract';
import * as _path from 'lib/utils/path';
import { NFError } from 'lib/native-federation.error';
import { toChunkImport } from 'lib/utils/to-chunk-import';

export function createGenerateImportMap(
  config: LoggingConfig & ModeConfig,
  ports: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedChunksRepo' | 'sharedExternalsRepo'
  >
): ForGeneratingImportMap {
  /**
   * Step 4: Generate an importMap from the cached remoteEntries
   *
   * The processed externals in the storage/cache (step 2 & 3) are used
   * to generate an importMap. The step returns the generated importMap object.
   */
  return () => {
    const importMap: ImportMap = { imports: {} };
    const chunkBundles: Record<string, Set<string>> = {};
    try {
      addScopedExternals(importMap, chunkBundles);
      addshareScopeExternals(importMap, chunkBundles);
      addGlobalSharedExternals(importMap, chunkBundles);
      addRemoteInfos(importMap, chunkBundles);

      addChunkImports(importMap, chunkBundles);

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
  function addScopedExternals(
    importMap: ImportMap,
    chunkBundles: Record<string, Set<string>>
  ): ImportMap {
    const scopedExternals = ports.scopedExternalsRepo.getAll();

    for (const [remoteName, externals] of Object.entries(scopedExternals)) {
      const remote = ports.remoteInfoRepo.tryGet(remoteName).orThrow(() => {
        config.log.error(4, `[scoped][${remoteName}] Remote name not found in cache.`);
        return new NFError('Could not create ImportMap.');
      });
      addToScope(importMap, remote.scopeUrl, createScopeModules(externals, remote.scopeUrl));

      Object.values(externals)
        .filter(e => !!e.bundle)
        .forEach(e => registerBundleChunks(chunkBundles, remoteName, e.bundle));
    }

    return importMap;
  }

  function createScopeModules(externals: ScopedExternal, scope: string): Imports {
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
  function addshareScopeExternals(
    importMap: ImportMap,
    chunkBundles: Record<string, Set<string>>
  ): ImportMap {
    const shareScopes = ports.sharedExternalsRepo.getScopes({ includeGlobal: false });

    for (const shareScope of shareScopes) {
      processshareScope(importMap, shareScope, chunkBundles);
    }

    return importMap;
  }

  function processshareScope(
    importMap: ImportMap,
    shareScope: string,
    chunkBundles: Record<string, Set<string>>
  ): void {
    const sharedExternals = ports.sharedExternalsRepo.getFromScope(shareScope);

    for (const [externalName, external] of Object.entries(sharedExternals)) {
      let override: SharedVersion | undefined | 'NOT_AVAILABLE' = undefined;
      let overrideScope: string | undefined = undefined;

      for (const version of external.versions) {
        if (version.action === 'scope') {
          for (const remote of version.remotes) {
            const remoteScope = getScope(shareScope, remote.name, externalName);
            addToScope(importMap, remoteScope, {
              [externalName]: _path.join(remoteScope, remote.file),
            });
            registerBundleChunks(chunkBundles, remote.name, remote.bundle);
            remote.cached = true;
          }
          continue;
        }

        const scope = getScope(shareScope, version.remotes[0]!.name, externalName);

        let targetFileUrl: string = _path.join(scope, version.remotes[0]!.file);
        version.remotes[0]!.cached = true;

        if (version.action === 'share') {
          registerBundleChunks(chunkBundles, version.remotes[0]!.name, version.remotes[0]!.bundle);
        }

        if (version.action === 'skip') {
          if (!override) {
            override = findOverride(external, shareScope, externalName) ?? 'NOT_AVAILABLE';
          }
          if (override !== 'NOT_AVAILABLE') {
            if (!overrideScope)
              overrideScope = getScope(shareScope, override.remotes[0]!.name, externalName);
            targetFileUrl = _path.join(overrideScope, override.remotes[0]!.file);
            override.remotes[0]!.cached = true;
            version.remotes[0]!.cached = false;
          }
        }
        version.remotes.forEach(r => {
          const scope = getScope(shareScope, r.name, externalName);
          addToScope(importMap, scope, { [externalName]: targetFileUrl });
        });
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
      if (config.strict.strictImportMap) {
        config.log.error(4, `[${shareScope}][${externalName}] shareScope has no override version.`);
        throw new NFError('Could not create ImportMap.');
      }
      config.log.debug(
        4,
        `[${shareScope}][${externalName}] shareScope has no override version, scoping override versions.`
      );
    }

    return sharedVersions[0];
  }

  function handleMultipleSharedVersions(scopedExternalName: string): void {
    if (config.strict.strictImportMap) {
      config.log.error(
        4,
        `[${scopedExternalName}] ShareScope external has multiple shared versions.`
      );
      throw new NFError('Could not create ImportMap.');
    }

    config.log.warn(4, `ShareScope external ${scopedExternalName} has multiple shared versions.`);
  }

  /**
   * Step 4.3: Added the globally shared externals.
   * @param importMap
   * @returns
   */
  function addGlobalSharedExternals(
    importMap: ImportMap,
    chunkBundles: Record<string, Set<string>>
  ): ImportMap {
    const sharedExternals = ports.sharedExternalsRepo.getFromScope();

    for (const [externalName, external] of Object.entries(sharedExternals)) {
      for (const version of external.versions) {
        if (version.action === 'skip') continue;
        if (version.action === 'scope') {
          for (const remote of version.remotes) {
            const remoteScope = getScope(GLOBAL_SCOPE, remote.name, externalName);
            addToScope(importMap, remoteScope, {
              [externalName]: _path.join(remoteScope, remote.file),
            });
            remote.cached = true;
            registerBundleChunks(chunkBundles, remote.name, remote.bundle);
          }
          continue;
        }

        if (importMap.imports[externalName]) {
          notifyDuplicateGlobalExternal(externalName);
          continue;
        }

        const scope = getScope(GLOBAL_SCOPE, version.remotes[0]!.name, externalName);
        addToGlobal(importMap, { [externalName]: _path.join(scope, version.remotes[0]!.file) });
        registerBundleChunks(chunkBundles, version.remotes[0]!.name, version.remotes[0]!.bundle);

        version.remotes[0]!.cached = true;
      }
      ports.sharedExternalsRepo.addOrUpdate(externalName, external);
    }

    return importMap;
  }

  function notifyDuplicateGlobalExternal(externalName: string): void {
    if (config.strict.strictImportMap) {
      config.log.error(4, `[${externalName}] Shared external has multiple shared versions.`);
      throw new NFError('Could not create ImportMap.');
    }

    config.log.warn(4, `Singleton external ${externalName} has multiple shared versions.`);
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
  function addRemoteInfos(importMap: ImportMap, chunkBundles: Record<string, Set<string>>): void {
    const remotes = ports.remoteInfoRepo.getAll();

    for (const [remoteName, remote] of Object.entries(remotes)) {
      addRemoteExposedModules(importMap, remoteName, remote);
      registerBundleChunks(chunkBundles, remoteName, 'mapping-or-exposed');
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

  function registerBundleChunks(
    chunkBundles: Record<string, Set<string>>,
    remoteName: string,
    bundleName?: string
  ) {
    if (!bundleName) return chunkBundles;
    if (!chunkBundles[remoteName]) chunkBundles[remoteName] = new Set();
    chunkBundles[remoteName].add(bundleName);
    return chunkBundles;
  }

  function addChunkImports(importMap: ImportMap, chunkBundles: Record<string, Set<string>>) {
    Object.entries(chunkBundles).forEach(([remoteName, bundles]) => {
      const baseUrl = getScope('CHUNKS', remoteName);

      const imports = Array.from(bundles).reduce((_imports, bundleName) => {
        ports.sharedChunksRepo.tryGet(remoteName, bundleName).ifPresent(files => {
          files.forEach(file => {
            _imports[toChunkImport(file)] = _path.join(baseUrl, file);
          });
        });
        return _imports;
      }, {} as Imports);

      if (Object.keys(imports).length > 0) addToScope(importMap, baseUrl, imports);
    });

    return importMap;
  }

  function getScope(ctx: string, remoteName: RemoteName, externalName?: string) {
    return ports.remoteInfoRepo
      .tryGet(remoteName)
      .map(remote => remote.scopeUrl)
      .orThrow(() => {
        if (externalName) {
          config.log.error(
            4,
            `[${ctx}][${externalName}][${remoteName}] Remote name not found in cache.`
          );
        } else {
          config.log.error(4, `[${ctx}][${remoteName}] Remote name not found in cache.`);
        }

        return new NFError('Could not create ImportMap.');
      });
  }
}
