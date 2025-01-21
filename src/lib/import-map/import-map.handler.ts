import type { ImportMap } from "./import-map.contract";
import type { Remote } from "../remote-info/remote-info.contract";
import type { SharedInfoHandler } from "../shared-info/shared-info.contract";
import * as _path from "../utils/path";

type ImportMapHandler = {
    toImportMap: (remoteInfo: Remote, remoteName?: string) => ImportMap,
    createEmpty: () => ImportMap,
    merge: (maps: ImportMap[]) => ImportMap
}

const importMapHandlerFactory = (sharedInfoHandler: SharedInfoHandler): ImportMapHandler => {
    
    const createEmpty = (): ImportMap => ({
        imports: {},
        scopes: {}
    })

    const merge = (maps: ImportMap[]) => {
        return maps.reduce(
            (acc: ImportMap, map: ImportMap) => ({
                imports: { ...acc.imports, ...map.imports },
                scopes: { ...acc.scopes, ...map.scopes },
            }),
            createEmpty()
        );
    }

    const getImports = (remoteInfo: Remote, remoteName: string) => {
        return remoteInfo.exposes.reduce((acc,remote) => ({
            ...acc, 
            [_path.join(remoteName, remote.key)]: _path.join(remoteInfo.baseUrl, remote.outFileName)
        }), {});
    }

    const getScopedDeps = (remoteInfo: Remote) => {
        return {[remoteInfo.baseUrl + '/']: sharedInfoHandler.mapSharedDeps(remoteInfo)}
    }

    const toImportMap = (remoteInfo: Remote, remoteName?: string): ImportMap => {
        if(!remoteName) remoteName = remoteInfo.name as string;

        return { 
            imports: getImports(remoteInfo, remoteName), 
            scopes: getScopedDeps(remoteInfo)
        };
    }

    return {toImportMap, createEmpty, merge};
}

export {importMapHandlerFactory, ImportMapHandler};