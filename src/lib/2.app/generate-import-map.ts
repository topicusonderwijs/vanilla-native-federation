import type { ForGeneratingImportMap } from "./driver-ports/for-generating-import-map";
import type { DrivingContract } from "./driving-ports/driving.contract";
import type { ImportMap, Imports } from "lib/1.domain/import-map/import-map.contract";
import * as _path from "lib/utils/path";

const createGenerateImportMap = (
    {remoteInfoRepo, scopedExternalsRepo, sharedExternalsRepo}: DrivingContract
): ForGeneratingImportMap => { 
    
    function addRemoteInfos(importMap: Required<ImportMap>) {
        const remotes = remoteInfoRepo.getAll();

        Object.entries(remotes).forEach(([remoteName, remote]) => {
            remote.exposes.forEach((exposed) => {
                const moduleName = _path.join(remoteName, exposed.moduleName);
                importMap.imports[moduleName] = exposed.url;
            })
        });

        return importMap;
    }

    function addScopedExternals(importMap: Required<ImportMap>) {
        const scopedExternals = scopedExternalsRepo.getAll();

        Object.entries(scopedExternals).forEach(([scope, externals]) => {
            importMap.scopes[scope] = Object.entries(externals)
                .reduce((modules, [external, version]) => {
                    modules[external] = version.url
                    return modules;
                }, {} as Imports);
        });

        return importMap;
    }

    function addSharedExternals(importMap: Required<ImportMap>) {
        const sharedExternals = sharedExternalsRepo.getAll();

        Object.entries(sharedExternals).forEach(([externalName, external]) => {
            external.versions.forEach(v => {
                switch(v.action) {
                    case "skip": return;
                    case "share": 
                        importMap.imports[externalName] = v.url;
                        break;
                    case "scope":
                        const scope = _path.getScope(v.url);
                        if(!importMap.scopes[scope]) importMap.scopes[scope] = {};
                        importMap.scopes[scope][externalName] = v.url;
                        break;
                }
                v.cached = true;
            });

            sharedExternalsRepo.addOrUpdate(externalName, external);
        });

        return importMap;
    }

    return () => {
        return Promise.resolve({imports: {}, scopes: {}})
            .then(addRemoteInfos)
            .then(addScopedExternals)
            .then(addSharedExternals);
    };
}

export { createGenerateImportMap };