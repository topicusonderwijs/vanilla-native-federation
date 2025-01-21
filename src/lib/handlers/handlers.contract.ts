import type { ImportMapHandler } from "./import-map/import-map.contract";
import type { LogHandler } from "./logging";
import type { RemoteInfoHandler } from "./remote-info/remote-info.contract";
import type { RemoteModuleHandler } from "./remote-module/remote-module.contract";
import type { SharedInfoHandler } from "./shared-info/shared-info.contract";
import type { NfStorage, StorageExtension, StorageHandler } from "./storage/storage.contract";

type Handlers = {
    importMapHandler: ImportMapHandler, 
    remoteInfoHandler: RemoteInfoHandler, 
    sharedInfoHandler: SharedInfoHandler,
    remoteModuleHandler: RemoteModuleHandler,
    logHandler: LogHandler,
    storageHandler: StorageHandler<NfStorage & StorageExtension>
}

export { Handlers }