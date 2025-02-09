import type { ImportMap, ImportMapHandler, Imports, Scopes } from "./import-map.contract";
import * as _path from "../../utils/path";
import type { ExternalsHandler } from "../externals/externals.contract";
import type { Remote } from "../remote-info/remote-info.contract";

const importMapHandlerFactory = (
    externalsHandler: ExternalsHandler
): ImportMapHandler => {

    const toImportMapFormat = (deps:Record<string, {version:string, url: string}>)
        : Record<string, string> => 
        Object.keys(deps).reduce((acc, v) => ({...acc, [v]: deps[v]!.url}), {});
        
    // const filterByBuilderType = (dep: {packageName: string}) => 
    //     (builderType === 'vite') === dep.packageName.startsWith('/@id/');

    // const mergeVersionIntoList = (module: SharedInfo, baseUrl: string) => (imports: Imports) => ({
    //     ...imports, 
    //     [module.packageName]: externalsHandler.getSharedInfoUrl(module, baseUrl)
    // })

    function create(from: ImportMap = {imports: {} as Imports, scopes: {} as Scopes}): ImportMap {
        return {...from}
    }

    // const appendDependencies = (importMap: ImportMap, remote: Remote): ImportMap => {

    //     importMap.scopes[remote.baseUrl + '/'] ??= {} as Record<string, string>;

    //     remote.shared
    //         .filter(filterByBuilderType)
    //         .reduce((importMap, moduleDep) => {
    //             if(moduleDep.singleton){
    //                 return importMap.updateGlobalImport(mergeVersionIntoList(moduleDep, remote.baseUrl));
    //             }
    //             return importMap.updateScopedImport(remote.baseUrl + '/', mergeVersionIntoList(moduleDep, remote.baseUrl));
    //         }, importMapBuilder())
    //         .get();

    //     return importMap;
    // }

    function appendScopedExternals(importMap: ImportMap, remote: Remote) {
        const scopedExternals = toImportMapFormat(externalsHandler.getFromScope(remote.baseUrl));
        importMap.scopes[externalsHandler.toScope(remote.baseUrl)] = scopedExternals;
        return importMap;
    }

    function appendExposedModules(importMap: ImportMap, remote: Remote) {
        remote.exposes.forEach((component) => {
            importMap.imports[_path.join(remote.name, component.key)] = _path.join(remote.baseUrl, component.outFileName);
        });
    }
    
    function createFromStorage(remotes: Remote[]) {
        const globalExternals = toImportMapFormat(externalsHandler.getFromScope('global'));
        const importMap = create({
            imports: globalExternals,
            scopes: {}
        });
        return remotes.reduce(
            (importMap: ImportMap, remote: Remote) => {
                appendExposedModules(importMap, remote);
                appendScopedExternals(importMap, remote);
                return importMap;
            },
            importMap
        );
    }

    // const getImports = ({exposes, name, baseUrl}: {exposes: ExposesInfo[], name: string, baseUrl: string}) => {
    //     return exposes.reduce((acc,remote) => ({
    //         ...acc, 
    //         [_path.join(name, remote.key)]: _path.join(baseUrl, remote.outFileName)
    //     }), {});
    // }

    // const getScopedDeps = (remoteInfo: Remote) => {
    //     return {[remoteInfo.baseUrl + '/']: sharedInfoHandler.mapSharedDeps(remoteInfo)}
    // }

    // const toImportMap = (remoteInfo: Remote): ImportMap => {
    //     return { 
    //         imports: getImports(remoteInfo), 
    //         scopes: getScopedDeps(remoteInfo)
    //     };
    // }

    return {createFromStorage, create};
}

export {importMapHandlerFactory};