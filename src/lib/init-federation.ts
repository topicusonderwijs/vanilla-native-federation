import { type DomHandler } from './dom/dom.handler';
import type { ImportMap } from './import-map/import-map.contract';
import { type ImportMapHandler } from './import-map/import-map.handler';
import { remoteModuleLoaderFactory, type LoadRemoteModule } from './load-remote-module';
import type { LogHandler } from './logging/log.handler';
import type { RemoteInfoHandler } from './remote-entry/remote-info.handler';
import { defaultConfig, resolver, type Config } from './resolver';

type InitFederation = (
    remotesOrManifestUrl: string | Record<string, string>
) => Promise<{
    load: LoadRemoteModule, 
    importMap: ImportMap
}>

type FederationInitializer = {
    init: InitFederation
}

const federationInitializerFactory = (
    log: LogHandler,
    remoteInfoHandler: RemoteInfoHandler,
    importMapHandler: ImportMapHandler,
    domHandler: DomHandler
): FederationInitializer => {
    const remoteModuleLoader = remoteModuleLoaderFactory(remoteInfoHandler, domHandler);

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

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string> = {},
    options: Partial<Config> = {}
): Promise<{load: LoadRemoteModule, importMap: ImportMap}> => {   
    const {
        logHandler,
        remoteInfoHandler, 
        importMapHandler,
        domHandler
    } = resolver(defaultConfig(options));

    const nfInitializer = federationInitializerFactory( 
        logHandler,
        remoteInfoHandler, 
        importMapHandler, 
        domHandler 
    );
    return nfInitializer.init(remotesOrManifestUrl)
}

export { initFederation, federationInitializerFactory, FederationInitializer};