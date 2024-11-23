import type { DomHandler } from './dom/dom.handler';
import type { ImportMap } from './import-map/import-map.contract';
import type { ImportMapHandler } from './import-map/import-map.handler';
import type { RemoteInfoHandler } from './remote-entry/remote-info.handler';
import type { LoadRemoteModule } from './remote-module/remote-module.contract';
import type { RemoteModuleHandler } from './remote-module/remote-module.handler';
import { defaultConfig, resolver, type Config } from './resolver';

type InitFederation = (
    remotesOrManifestUrl: string | Record<string, string>
) => Promise<{ load: LoadRemoteModule, importMap: ImportMap }>

type FederationInitializer = {
    init: InitFederation
}

const federationInitializerFactory = (
    domHandler: DomHandler,
    remoteInfoHandler: RemoteInfoHandler,
    importMapHandler: ImportMapHandler,
    remoteModuleLoader: RemoteModuleHandler
): FederationInitializer => {

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

const resolveInitFederation = (
    options: Partial<Config> = {}
): FederationInitializer => {
    const {
        domHandler,
        remoteInfoHandler, 
        importMapHandler,
        remoteModuleHandler
    } = resolver(defaultConfig(options));

    return federationInitializerFactory( 
        domHandler,
        remoteInfoHandler, 
        importMapHandler, 
        remoteModuleHandler
    );
}

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string> = {},
    options: Partial<Config> = {}
): Promise<{load: LoadRemoteModule, importMap: ImportMap}> => {   
    return resolveInitFederation(options).init(remotesOrManifestUrl)
}

export { resolveInitFederation, initFederation, federationInitializerFactory, FederationInitializer};