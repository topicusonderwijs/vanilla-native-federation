import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract";

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
            return remoteInfoHandler.loadRemoteInfo(remoteEntryUrl, remoteName)
                .then(info => importMapHandler.toImportMap(info, remoteName))
                .catch(_ => {
                    logHandler.warn(`Error loading remoteEntry for ${remoteName} at '${remoteEntryUrl}', skipping module`);
                    return importMapHandler.createEmpty();
                })
        }

        return fetchRemotes().then(r => Promise.all(Object.entries(r).map(mapToImportMaps)))
    }

export {FetchImportMaps, fetchImportMaps}