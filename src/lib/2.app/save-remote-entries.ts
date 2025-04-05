
import type { ForLogging } from "./driving-ports/for-logging.port";
import type { ForStoringRemoteInfo } from "./driving-ports/for-storing-remote-info";
import type { ForSavingRemoteEntries } from "./driver-ports/for-saving-remote-entries.port";
import type { RemoteEntry, RemoteInfo } from "lib/1.domain";
import type { ForResolvingPaths } from "./driving-ports/for-resolving-paths.port";

const createGetRemotesFederationInfo = (
    remoteInfoRepository: ForStoringRemoteInfo,
    pathResolver: ForResolvingPaths,
    _: ForLogging
): ForSavingRemoteEntries => { 

    function addRemoteInfoToStorage(remoteEntry: RemoteEntry)
        : RemoteInfo {
            const scopeUrl =  pathResolver.getScope(remoteEntry.url);

            const remoteInfo: RemoteInfo = {
                remoteName: remoteEntry.name,
                scopeUrl,
                exposes: Object.values(remoteEntry.exposes ?? [])
                    .map(m => ({
                        moduleName: m.key,
                        url: pathResolver.join(scopeUrl, m.outFileName) 
                    }))
            };

            remoteInfoRepository.addOrUpdate(remoteInfo)
            return remoteInfo;
        }

    return e => {
        e.forEach(remoteEntry => {
            addRemoteInfoToStorage(remoteEntry);
        })
        return Promise.resolve(e);
    };
}

export { createGetRemotesFederationInfo };