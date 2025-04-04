import type { LoggingConfig } from "lib/3.adapters/logging/logging.contract";
import type { StorageConfig } from "lib/3.adapters/storage/storage.contract";
import { createForGettingRemoteEntries } from "lib/3.adapters/_factories/for-getting-remote-entries.factory";


const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    config: LoggingConfig & StorageConfig
) => {   
    const getRemoteEntries = createForGettingRemoteEntries(config);

    return getRemoteEntries(remotesOrManifestUrl);
}

export { initFederation };
