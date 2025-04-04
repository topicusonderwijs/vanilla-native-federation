import type { FederationInfo } from "../1.domain/remote-entry.contract";
import type { Manifest, RemoteEntryUrl } from "../1.domain/manifest.contract";
import type { RemoteName } from "../1.domain/remote-info.contract";
import type { ForLogging } from "./driving-ports/for-logging.port";
import type { ForProvidingManifest } from "./driving-ports/for-providing-manifest.port";
import type { ForProvidingRemoteEntry } from "./driving-ports/for-providing-remote-entry.port";
import type { ForStoringRemoteInfo } from "./driving-ports/for-storing-remote-info";
import type { ForGettingRemoteEntries } from "./driver-ports/for-getting-remote-entries.port";

const createGetRemotesFederationInfo = (
    manifestProvider: ForProvidingManifest,
    remoteEntryProvider: ForProvidingRemoteEntry,
    remoteInfoRepository: ForStoringRemoteInfo,
    logger: ForLogging
): ForGettingRemoteEntries => { 

    function fetchRemoteEntries(manifest: Manifest)
        : Promise<(FederationInfo|false)[]> {
            return Promise.all(Object.entries(manifest).map(fetchRemoteEntry))
        }

    function fetchRemoteEntry([remoteName, remoteEntry]: [RemoteName, RemoteEntryUrl])
        : Promise<FederationInfo|false> {
            if(remoteInfoRepository.contains(remoteName)) {
                logger.debug(`Found remote '${remoteName}' in storage, omitting fetch.`);
                return Promise.resolve(false);
            }
            return remoteEntryProvider.provide(remoteEntry)
                .then(notifyRemoteEntryFetched(remoteEntry, remoteName))
                .catch(e => {
                    logger.error(`Failed to fetch remote '${remoteName}'.`, e);
                    return false;
                });
        }

    function notifyRemoteEntryFetched(remoteEntry: RemoteEntryUrl, remoteName: RemoteName) 
        : (federationInfo: FederationInfo) => FederationInfo {
            return (federationInfo: FederationInfo): FederationInfo => {
                logger.debug(`fetched '${remoteEntry}': ${JSON.stringify({name: federationInfo.name, exposes: federationInfo.exposes})}`);

                if(federationInfo.name !== remoteName) {
                    logger.warn(`Fetched remote '${federationInfo.name}' does not match requested '${remoteName}'.`);
                }
                
                return federationInfo;
            };
        }


    function removeSkippedRemotes(federationInfos: (FederationInfo|false)[])
        : FederationInfo[] {
            return federationInfos.filter((f): f is FederationInfo => !!f);
        }
       
        
    return async (remotesOrManifestUrl: string | Manifest = {})
        : Promise<FederationInfo[]> => 
            manifestProvider.provide(remotesOrManifestUrl)
                .then(fetchRemoteEntries)
                .then(removeSkippedRemotes)
}

export { createGetRemotesFederationInfo }
