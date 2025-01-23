import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract";
import { tap } from "../utils/tap";

type FetchImportMaps = (remotesOrManifestUrl: string | Record<string, string>) => Promise<ImportMap[]>

const fetchImportMaps = (
    { remoteInfoHandler, importMapHandler, logHandler }: Handlers
): FetchImportMaps => 
    (remotesOrManifestUrl: string | Record<string, string> = {}) => {
    
        const fetchRemotes = (): Promise<Record<string, string>> => {
            return (typeof remotesOrManifestUrl === 'string')
                ? fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }

        const mapToImportMaps = ([remoteName, remoteEntryUrl]: [string,string]) => {
            return remoteInfoHandler.getFromCache(remoteEntryUrl, remoteName)
                .catch(e => {
                    logHandler.warn("Cache lookup failed: "+e.message)
                    return remoteInfoHandler.getFromEntry(remoteEntryUrl)
                })
                .then(tap(m => {
                    logHandler.debug(`Initialized remoteEntry: ${JSON.stringify({name: m.name, exposes: m.exposes})}`);
                    if(!!remoteName && m.name !== remoteName) {
                        logHandler.warn(`Fetched remote '${m.name}' does not match requested '${remoteName}'`);
                    }
                }))
                .then(importMapHandler.toImportMap)
                .catch(_ => {
                    logHandler.warn(`Error loading remoteEntry for ${remoteName} at '${remoteEntryUrl}', skipping module`);
                    return importMapHandler.createEmpty();
                })
        }

        return fetchRemotes()
            .then(r => Object.entries(r))
            .then(r => Promise.all(r.map(mapToImportMaps)))
    }

export {FetchImportMaps, fetchImportMaps}