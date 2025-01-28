import type { ExposedModuleHandler } from "./exposed-module";
import type { ImportMapHandler } from "./import-map";
import type { LogHandler } from "./logging";
import type { RemoteInfoHandler } from "./remote-info";
import type { SharedInfoHandler } from "./shared-info/shared-info.contract";
import type { NfCache, StorageHandler } from "./storage/storage.contract";

type Handlers = {
    importMapHandler: ImportMapHandler, 
    remoteInfoHandler: RemoteInfoHandler, 
    sharedInfoHandler: SharedInfoHandler,
    logHandler: LogHandler,
    storageHandler: StorageHandler<NfCache>,
    exposedModuleHandler: ExposedModuleHandler
}

export { Handlers }