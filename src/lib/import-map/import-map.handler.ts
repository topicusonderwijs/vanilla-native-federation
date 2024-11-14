import { createEmptyImportMap } from "./create-empty-import-map";
import type { ImportMap } from "./import-map.contract";
import type { TRemoteInfo } from "../remote-entry/remote-info.contract";
import type { TSharedInfoHandler } from "../remote-entry/shared-info.handler";
import * as _path from "../utils/path";

type TImportMapHandler = {
    toImportMap: (remoteInfo: TRemoteInfo, remoteName?: string) => ImportMap,
}

const importMapHandlerFactory = (sharedInfoHandler: TSharedInfoHandler): TImportMapHandler => {
    const getImports = (remoteInfo: TRemoteInfo, remoteName: string) => {
        return remoteInfo.exposes.reduce((acc,remote) => ({
            ...acc, 
            [_path.join(remoteName, remote.key)]: _path.join(remoteInfo.baseUrl, remote.outFileName)
        }), {});
    }

    const getScopedDeps = (remoteInfo: TRemoteInfo) => {
        return {[remoteInfo.baseUrl + '/']: sharedInfoHandler.mapSharedDeps(remoteInfo)}
    }

    const toImportMap = (remoteInfo: TRemoteInfo, remoteName?: string): ImportMap => {
        if(!remoteName) remoteName = remoteInfo.name as string;

        return { 
            imports: getImports(remoteInfo, remoteName), 
            scopes: getScopedDeps(remoteInfo)
        };
    }

    return {toImportMap};
}

export {createEmptyImportMap, importMapHandlerFactory, TImportMapHandler};