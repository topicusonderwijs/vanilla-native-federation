import type { LogHandler } from '../logging/log.handler';
import type { DomHandler } from './../dom/dom.contract';
import type { ImportMap } from './../import-map/import-map.contract';
import type { ImportMapHandler } from './../import-map/import-map.handler';
import type { RemoteInfoHandler } from './../remote-info/remote-info.handler';
import type { RemoteModuleHandler } from './../remote-module/remote-module.handler';
import type { InitFederationHandler } from './init-federation.contract';

const initFederationHandlerFactory = (
    domHandler: DomHandler,
    logHandler: LogHandler,
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
                logHandler.warn(`Error loading remoteEntry for ${remoteName} at '${remoteEntryUrl}', skipping module`);
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
            .then(domHandler.appendImportMap)
            .then(importMap => ({
                importMap,
                load: remoteModuleLoader.load
            }))
    }

    return {init}
}

export { InitFederationHandler, initFederationHandlerFactory }