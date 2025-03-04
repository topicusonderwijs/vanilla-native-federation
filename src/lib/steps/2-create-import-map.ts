import type { Handlers } from "../handlers/handlers.contract";
import type { RemoteEntry, RemoteName } from "../handlers/remote-info/remote-info.contract";

type CreateImportMap = (manifest: Record<RemoteName, RemoteEntry>) => Promise<Record<RemoteName, RemoteEntry>>;

const createImportMap = (
    { importMapHandler }: Handlers
): CreateImportMap => 
    (manifest: Record<RemoteName, RemoteEntry>) => {
        const importMap = importMapHandler.fromStorage(Object.keys(manifest));
        importMapHandler.addToDOM(importMap);
        return Promise.resolve(manifest);
    }

export {CreateImportMap, createImportMap}