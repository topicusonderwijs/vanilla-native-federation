import type { ForGeneratingImportMap } from "./driver-ports/for-generating-import-map";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { ImportMap, Imports } from "lib/1.domain/import-map/import-map.contract";
import * as _path from "lib/utils/path";
import { NFError } from "lib/native-federation.error";
import type { LoggingConfig } from "./config/log.contract";
import type { ModeConfig } from "./config/mode.contract";
import type { SharedExternal, SharedVersion } from "lib/1.domain";


/**
 * Step 4: Generate an importMap from the cached remoteEntries
 * 
 * The processed externals in the storage/cache (step 2 & 3) are used 
 * to generate an importMap. The step returns the generated importMap object. 
 * 
 * @param config 
 * @param adapters 
 */
const createGenerateImportMap = (
    config: LoggingConfig & ModeConfig,
    ports: Pick<DrivingContract, 'remoteInfoRepo'|'scopedExternalsRepo'|'sharedExternalsRepo'>
): ForGeneratingImportMap => { 
    
    function addRemoteInfos(importMap: ImportMap) {
        const remotes = ports.remoteInfoRepo.getAll();

        Object.entries(remotes).forEach(([remoteName, remote]) => {
            remote.exposes.forEach((exposed) => {
                const moduleName = _path.join(remoteName, exposed.moduleName);
                importMap.imports[moduleName] = _path.join(remote.scopeUrl, exposed.file);
            })
        });

        return importMap;
    }

    function addScopedExternals(importMap: ImportMap) {
        const scopedExternals = ports.scopedExternalsRepo.getAll();

        Object.entries(scopedExternals).forEach(([scope, externals]) => {
            if(!importMap.scopes) importMap.scopes = {};
            importMap.scopes[scope] = Object.entries(externals)
                .reduce((modules, [external, version]) => {
                    modules[external] = _path.join(scope, version.file)
                    return modules;
                }, {} as Imports);
        });

        return importMap;
    }

    const addVersionToImportMap = (externalName: string) => (importMap: ImportMap, version: SharedVersion) => {
        if(version.action === "skip") return importMap; 

        if(version.action === "scope") {
            const scope = _path.getScope(version.file);
            if(!importMap.scopes) importMap.scopes = {};
            if(!importMap.scopes[scope]) importMap.scopes[scope] = {};
            importMap.scopes[scope][externalName] = version.file;
            version.cached = true;
            return importMap;
        }

        if(!!importMap.imports[externalName]) {
            if (config.strict) {
                config.log.error(`Singleton external ${externalName} has multiple shared versions.`);
                throw new NFError("Could not create ImportMap.");
            }
            config.log.warn(`Singleton external ${externalName} has multiple shared versions.`);
            return importMap;
        }

        importMap.imports[externalName] = version.file;
        version.cached = true;

        return importMap;
    }

    function addGlobalSharedExternals(importMap: ImportMap) {
        const sharedExternals = ports.sharedExternalsRepo.getAll();

        Object.entries(sharedExternals).forEach(([externalName, external]) => {
            importMap = external.versions.reduce(addVersionToImportMap(externalName), importMap);
            ports.sharedExternalsRepo.addOrUpdate(externalName, external);
        });

        return importMap;
    }

    const findOverride = (external: SharedExternal, scope: string, externalName: string): SharedVersion|undefined => {
        const sharedVersions = external.versions.filter(v => v.action === "share");
        if(sharedVersions.length > 1) {
            config.log.error(`ShareScope external ${scope}.${externalName} has multiple shared versions.`);
            throw new NFError("Could not create ImportMap.");
        }
        if(sharedVersions.length < 1) {
            config.log.warn(`Singleton external ${scope}.${externalName} has no shared versions.`);
        }
        return sharedVersions[0];
    }

    const addOrOverrideSkippedVersions = (externalName: string, override?: SharedVersion) => (importMap: ImportMap, version: SharedVersion) => {
        
        let scope = _path.getScope(version.file);

        if(!!override && version.action === "skip") {
            scope = _path.getScope(override.file);
        }

        if(!importMap.scopes) importMap.scopes = {};
        if(!importMap.scopes[scope]) importMap.scopes[scope] = {};
        importMap.scopes[scope]![externalName] = version.file;
        version.cached = true;
        return importMap;
    }

    function addSharedScopeExternals(importMap: ImportMap) {
        ports.sharedExternalsRepo.getScopes({includeGlobal: false})
            .forEach(sharedScope => {
                const sharedExternals = ports.sharedExternalsRepo.getAll(sharedScope);
                Object.entries(sharedExternals).forEach(([externalName, external]) => {
                    const override = findOverride(external, sharedScope, externalName);
                    importMap = external.versions.reduce(addOrOverrideSkippedVersions(externalName, override), importMap);
                    ports.sharedExternalsRepo.addOrUpdate(externalName, external);
                });
            })

        return importMap;
    }

    return () => {
        return Promise.resolve({imports: {}})
            .then(addRemoteInfos)
            .then(addScopedExternals)
            .then(addSharedScopeExternals)
            .then(addGlobalSharedExternals);
    };
}

export { createGenerateImportMap };