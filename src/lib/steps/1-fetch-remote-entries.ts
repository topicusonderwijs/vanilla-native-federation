import type { FederationInfo, RemoteEntry, RemoteInfo, RemoteName } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";

type FetchRemoteEntries = (remotesOrManifestUrl: string|Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>

const fetchRemoteEntries = (
    { remoteInfoHandler, externalsHandler, logHandler}: Handlers
): FetchRemoteEntries => 
    async (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry> = {}) => {
    
        const fetchManifest = (): Promise<Record<RemoteName, RemoteEntry>> => {
            return (typeof remotesOrManifestUrl === 'string')
                ? fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }
    
        const notifyRemoteEntryFetched = (remoteName: RemoteName) => (federationInfo: FederationInfo) => {
            logHandler.debug(`Fetched remoteEntry: ${JSON.stringify({name: federationInfo.name, exposes: federationInfo.exposes})}`);
            if(!!remoteName && federationInfo.name !== remoteName) {
                logHandler.warn(`Fetched remote '${federationInfo.name}' does not match requested '${remoteName}'`);
            }
            return federationInfo;
        }

        const checkSharedExternalsCompatibility = (remote: FederationInfo): FederationInfo => {
            externalsHandler.checkForIncompatibleSingletons(remote.shared);
            return remote;
        }

        const addRemoteEntryToStorage = (remoteEntry: string) => (remote: FederationInfo): RemoteInfo => {
            const remoteInfo = remoteInfoHandler.toStorage(remote, remoteEntry);
            externalsHandler.toStorage(remote.shared, remoteInfo.scopeUrl);
            return remoteInfo;
        }

        const fetchRemoteEntries = ([remoteName, remoteEntry]: [RemoteName,RemoteEntry]): Promise<RemoteInfo|false> => {
            if(remoteInfoHandler.inStorage(remoteName)) {
                logHandler.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                return Promise.resolve(remoteInfoHandler.fromStorage(remoteName));
            }
            return remoteInfoHandler.fetchRemoteEntry(remoteEntry)
                .then(notifyRemoteEntryFetched(remoteName))
                .then(checkSharedExternalsCompatibility)
                .then(addRemoteEntryToStorage(remoteEntry))
                .catch(e => {
                    const message = (e instanceof Error) ? e.message : String(e);
                    logHandler.error(`Failed to initialize remote '${remoteName}'.`);
                    logHandler.debug(`Remote '${remoteName}' init failed: ` + message);
                    return false;
                })
        }

        return fetchManifest().then(
            m => Promise.all(Object.entries(m).map(fetchRemoteEntries)).then(_ => m)
        )
    }

export {FetchRemoteEntries, fetchRemoteEntries}
