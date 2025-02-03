import type { ImportMap, ImportMapHandler } from "./import-map.contract";
import * as _path from "../../utils/path";
import type { Remote } from "../remote-info/remote-info.contract";
import type { SharedInfoHandler } from "../shared-info/shared-info.contract";

const importMapHandlerFactory = (sharedInfoHandler: SharedInfoHandler): ImportMapHandler => {
    
    const createEmpty = (): ImportMap => ({
        imports: {},
        scopes: {}
    })

    const toImportMap = (remotes: Remote[]) => {
        return remotes.reduce(
            (acc: ImportMap, remote: Remote) => {
                acc.scopes[remote.baseUrl + '/'] = sharedInfoHandler.mapSharedDeps(remote);
                return acc;
            },
            createEmpty()
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

    return {toImportMap, createEmpty};
}

export {importMapHandlerFactory};