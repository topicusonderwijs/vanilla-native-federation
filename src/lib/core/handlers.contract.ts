import type { ExternalsHandler } from "./externals";
import type { ImportMapHandler } from "./import-map";
import type { LogHandler } from "./logging";
import type { ManifestHandler } from "./manifest";
import type { RemoteInfoHandler } from "./remote-info";
import type { RemoteModuleHandler } from "./remote-module/remote-module.contract";
import type { NfCache, StorageHandler } from "./storage/storage.contract";

type Handlers = {
    importMapHandler: ImportMapHandler, 
    remoteInfoHandler: RemoteInfoHandler, 
    remoteModuleHandler: RemoteModuleHandler,
    externalsHandler: ExternalsHandler,
    logHandler: LogHandler,
    storageHandler: StorageHandler<NfCache>,
    manifestHandler: ManifestHandler
}

export { Handlers }