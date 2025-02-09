import type { Remote } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import { NFError } from "../native-federation.error";
import { tap } from "../utils/tap";

type FetchRemoteEntries = (remotesOrManifestUrl: string | Record<string, string>) => Promise<Remote[]>

const fetchRemoteEntries = (
    { remoteInfoHandler, logHandler }: Handlers
): FetchRemoteEntries => 
    (remotesOrManifestUrl: string | Record<string, string> = {}) => {
    
        const fetchRemotes = (): Promise<Record<string, string>> => {
            return (typeof remotesOrManifestUrl === 'string')
                ? fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }

        const mapToSharedInfo = ([remoteName, remoteEntryUrl]: [string,string]): Promise<Remote> => {
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
                .catch(_ => {
                    logHandler.warn(`Error loading remoteEntry for ${remoteName} at '${remoteEntryUrl}', skipping module`);
                    throw new NFError("Error loading remoteEntry for ${remoteName} at '${remoteEntryUrl}'")
                })
        }

        return fetchRemotes()
            .then(r => Object.entries(r))
            .then(r => Promise.all(r.map(mapToSharedInfo)))
    }

export {FetchRemoteEntries, fetchRemoteEntries}