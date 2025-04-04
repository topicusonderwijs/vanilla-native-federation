import type { LoggingConfig } from "./3.adapters/logging/logging.contract";
import type { StorageConfig } from "./3.adapters/storage/storage.contract";
import { createForGettingRemoteEntries } from "./4.factories/for-getting-remote-entries.factory";


const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    config: LoggingConfig & StorageConfig
) => {   
    const getRemoteEntries = createForGettingRemoteEntries(config);

    return getRemoteEntries(remotesOrManifestUrl);
}

export { initFederation };
