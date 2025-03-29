import type { ImportMap, ImportMapHandler, Imports, Scopes } from "./import-map.contract";
import type { ModuleLoaderConfig } from "../../config/config.contract";
import * as _path from "../../utils/path";
import type { ExternalsHandler } from "../externals/externals.contract";
import type { RemoteInfo, RemoteInfoHandler, RemoteName } from "../remote-info";
import type { LogHandler } from "../logging";


const importMapHandlerFactory = (
    {importMapType}: ModuleLoaderConfig,
    logHandler: LogHandler,
    externalsHandler: ExternalsHandler,
    remoteInfoHandler: RemoteInfoHandler
): ImportMapHandler => {

    const toImportMapFormat = (deps:Record<string, {version:string, url: string}>)
        : Record<string, string> => 
        Object.keys(deps).reduce((acc, v) => ({...acc, [v]: deps[v]!.url}), {});

    const appendExposedModules = (importMap: ImportMap, remoteInfo: RemoteInfo)
        : ImportMap => {
            remoteInfo.exposes.forEach(
                m => importMap.imports[_path.join(remoteInfo.remoteName, m.moduleName)] = m.url
            );
            return importMap;
        }

    const appendScopedExternals = (importMap: ImportMap, remoteInfo: RemoteInfo) 
        : ImportMap => {
            const scopedExternals = toImportMapFormat(externalsHandler.fromStorage(remoteInfo.scopeUrl));
            importMap.scopes[remoteInfo.scopeUrl] = scopedExternals;
            return importMap;
        }
       

    function create(from: ImportMap = {imports: {} as Imports, scopes: {} as Scopes}): ImportMap {
        return {...from}
    }


    function addToDOM(importMap: ImportMap) {
        document.head
            .querySelectorAll(`script[type="${importMapType}"]`)
            .forEach(importMap => importMap.remove());

        document.head.appendChild(
            Object.assign(document.createElement('script'), {
                type: importMapType,
                innerHTML: JSON.stringify(importMap),
            })
        );
        return importMap;
    }

    function fromStorage(remotes: RemoteName[]): ImportMap {
        const importMap = create({
            imports: toImportMapFormat(externalsHandler.fromStorage('global')),
            scopes: {}
        });

        return remotes.reduce(
            (importMap: ImportMap, remoteName: string) => {
                
                if(!remoteInfoHandler.inStorage(remoteName)) {
                    logHandler.warn(`Failed to init remote '${remoteName}': not found in storage.`);
                    return importMap;
                }
                
                const remoteInfo: RemoteInfo = remoteInfoHandler.fromStorage(remoteName);
                importMap = appendExposedModules(importMap, remoteInfo);
                importMap = appendScopedExternals(importMap, remoteInfo);
                return importMap;
            }, 
            importMap
        );
    }

    return {fromStorage, create, addToDOM};
}

export {importMapHandlerFactory};
