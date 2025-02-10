import type { ExternalsHandler } from "./externals";
import type { ImportMapHandler } from "./import-map";
import type { LogHandler } from "./logging";
import type { RemoteInfoHandler } from "./remote-info";
import type { NfCache, StorageHandler } from "./storage/storage.contract";

type Handlers = {
    importMapHandler: ImportMapHandler, 
    remoteInfoHandler: RemoteInfoHandler, 
    externalsHandler: ExternalsHandler,
    logHandler: LogHandler,
    storageHandler: StorageHandler<NfCache>
}

export { Handlers }