import type { ForGettingRemoteEntries } from "lib/2.app/driver-ports/for-getting-remote-entries.port";
import { createGetRemotesFederationInfo } from "lib/2.app/get-remote-entries";
import { createManifestProvider } from "lib/3.adapters/http/manifest-provider";
import { createRemoteEntryProvider } from "lib/3.adapters/http/remote-entry-provider";
import { createLogger } from "lib/3.adapters/logging/logger";
import type { LoggingConfig } from "lib/3.adapters/logging/logging.contract";
import { createRemoteInfoRepository } from "lib/3.adapters/storage/remote-info.repository";
import type { StorageConfig } from "lib/3.adapters/storage/storage.contract";


const createForGettingRemoteEntries = 
    (ctx: LoggingConfig & StorageConfig): ForGettingRemoteEntries => {
        return createGetRemotesFederationInfo(
            createManifestProvider(),
            createRemoteEntryProvider(),
            createRemoteInfoRepository(ctx),
            createLogger(ctx)
        )
    }

export { createForGettingRemoteEntries }