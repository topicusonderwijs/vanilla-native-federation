import type { DomHandler } from './../dom/dom.handler';
import type { ImportMap } from './../import-map/import-map.contract';
import type { ImportMapHandler } from './../import-map/import-map.handler';
import type { RemoteInfoHandler } from './../remote-entry/remote-info.handler';
import type { RemoteModuleHandler } from './../remote-module/remote-module.handler';
import type { InitFederation } from './init-federation.contract';



type InitFederationHandler = {
    init: InitFederation
}

const initFederationHandlerFactory = (
    domHandler: DomHandler,
    remoteInfoHandler: RemoteInfoHandler,
    importMapHandler: ImportMapHandler,
    remoteModuleLoader: RemoteModuleHandler
): InitFederationHandler => {

    const fetchRemotes = (remotesOrManifestUrl: string | Record<string, string> = {}): Promise<Record<string, string>> => {
        return (typeof remotesOrManifestUrl === 'string')
            ? fetch(remotesOrManifestUrl).then(r => r.json())
            : Promise.resolve(remotesOrManifestUrl)
    }

    
    const remoteToImportMap = ([remoteName, remoteEntryUrl]: [string,string]) => {
        return remoteInfoHandler.loadRemoteInfo(remoteEntryUrl, remoteName)
            .then(info => importMapHandler.toImportMap(info, remoteName))
            .catch(_ => {
                console.warn(`Error loading remoteEntry for ${remoteName} at '${remoteEntryUrl}', skipping module`);
                return importMapHandler.createEmpty();
            })
    }

    const createImportMapFromRemotes = (remotes: Record<string, string>): Promise<ImportMap> => {
        return Promise
            .all(Object.entries(remotes).map(remoteToImportMap))
            .then(importMapHandler.merge);
    }

    const init = (remotesOrManifestUrl: string | Record<string, string> = {}) => {
        return fetchRemotes(remotesOrManifestUrl)
            .then(createImportMapFromRemotes)
            .then(domHandler.createImportMap)
            .then(importMap => ({
                importMap,
                load: remoteModuleLoader.load
            }))
    }

    return {init}
}

export { InitFederationHandler, initFederationHandlerFactory }