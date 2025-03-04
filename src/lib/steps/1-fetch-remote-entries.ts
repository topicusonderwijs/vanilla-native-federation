import type { FederationInfo, RemoteEntry, RemoteInfo, RemoteName } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import {NF_HOST_REMOTE_ENTRY, NF_REMOTE_ENTRY_FILENAME} from "../config/namespace.contract";

type FetchRemoteEntries = (remotesOrManifestUrl: string|Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>

const fetchRemoteEntries = (
    { remoteInfoHandler, externalsHandler, logHandler}: Handlers
): FetchRemoteEntries => 
    async (remotesOrManifestUrl: string | Record<RemoteName, RemoteEntry> = {}) => {
   
        const appendHostRemoteEntry = (manifest: Record<RemoteName, RemoteEntry>, hostRemoteEntryUrl: string)
            : Record<RemoteName, RemoteEntry> => ({
                [NF_HOST_REMOTE_ENTRY]: hostRemoteEntryUrl, 
                ...manifest 
            })
        

        const fetchManifest = (): Promise<Record<RemoteName, RemoteEntry>> => {
            return (typeof remotesOrManifestUrl === 'string')
                ? remotesOrManifestUrl.endsWith(NF_REMOTE_ENTRY_FILENAME)
                    ? Promise.resolve(appendHostRemoteEntry({}, remotesOrManifestUrl))
                    : fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }
    
        const notifyRemoteEntryFetched = (remoteEntry: RemoteEntry, remoteName: RemoteName) => (federationInfo: FederationInfo) => {
            logHandler.debug(`fetched '${remoteEntry}': ${JSON.stringify({name: federationInfo.name, exposes: federationInfo.exposes})}`);

            if(federationInfo.name !== remoteName) {
                if(remoteName === NF_HOST_REMOTE_ENTRY) {
                    federationInfo.name = remoteName;
                } else {
                    logHandler.warn(`Fetched remote '${federationInfo.name}' does not match requested '${remoteName}'.`);
                }
            }
            return federationInfo;
        }

        const checkSharedExternalsCompatibility = (remote: FederationInfo): FederationInfo => {
            externalsHandler.checkForIncompatibleSingletons(remote.shared);
            return remote;
        }

        const addRemoteEntryToStorage = (remoteEntry: string) => (remote: FederationInfo): RemoteInfo|false => {
            const remoteInfo = remoteInfoHandler.toStorage(remote, remoteEntry);
            externalsHandler.toStorage(remote.shared, remoteInfo.scopeUrl);

            if(remote.exposes.length < 1){
                logHandler.debug(`RemoteEntry '${remote.name}' does not expose any modules.`)
            }

            return remoteInfo;
        }

        const fetchRemoteEntry = ([remoteName, remoteEntry]: [RemoteName,RemoteEntry]): Promise<RemoteInfo|false> => {
            if(remoteInfoHandler.inStorage(remoteName)) {
                logHandler.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                return Promise.resolve(remoteInfoHandler.fromStorage(remoteName));
            }
            return remoteInfoHandler.fetchRemoteEntry(remoteEntry)
                .then(notifyRemoteEntryFetched(remoteEntry, remoteName))
                .then(checkSharedExternalsCompatibility)
                .then(addRemoteEntryToStorage(remoteEntry))
                .catch(e => {
                    const message = (e instanceof Error) ? e.message : String(e);
                    logHandler.error(`Failed to initialize remote '${remoteName}'.`);
                    logHandler.debug(`Remote '${remoteName}' init failed: ` + message);
                    return false;
                })
        }

        const appendHostRemoteEntryIfInConfig = (manifest: Record<RemoteName, RemoteEntry>): Record<RemoteName, RemoteEntry> => {
            const hostRemoteEntryUrl = remoteInfoHandler.getHostRemoteEntryUrl();
            if(!!hostRemoteEntryUrl) {
                logHandler.debug(`Appended host '${hostRemoteEntryUrl}' from config.`)
                return appendHostRemoteEntry(manifest, hostRemoteEntryUrl);
            }
            return manifest;
        };
        return fetchManifest()
            .then(appendHostRemoteEntryIfInConfig)
            .then(
                m => Promise.all(Object.entries(m).map(fetchRemoteEntry)).then(_ => m)
            )
    }

export {FetchRemoteEntries, fetchRemoteEntries}
