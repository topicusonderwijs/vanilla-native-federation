import { LogHandler } from "../lib/handlers/logging/log.contract";
import { ExternalsHandler } from "../lib/handlers/externals";
import { NfCache, StorageHandler } from "../lib/handlers/storage/storage.contract";
import { VersionHandler } from "../lib/handlers/version/version.contract";
import { RemoteInfoHandler } from "../lib/handlers/remote-info";

const mockLogHandler = (): LogHandler => ({
    debug: jest.fn(() => {}),
    warn: jest.fn(() => {}),
    error: jest.fn(() => {})
})

const mockStorageHandler = <TCache extends NfCache>(): StorageHandler<TCache> => ({
    fetch: jest.fn(),
    entry: jest.fn(),
    get: jest.fn(),
    update: jest.fn().mockReturnThis(),
});

const mockExternalsHandler = (): ExternalsHandler => ({
    toStorage: jest.fn(),
    fromStorage: jest.fn(),
});

const mockRemoteInfoHandler = (): RemoteInfoHandler => ({
    toStorage: jest.fn(),
    fromStorage: jest.fn(),
    getFromEntry: jest.fn(),
    toScope: jest.fn()
});

const mockVersionHandler = (): VersionHandler => ({
    compareVersions: jest.fn<number, [string, string]>(),
    getLatestVersion: jest.fn(),
    isCompatible: jest.fn()
});

export {
    mockLogHandler,
    mockStorageHandler,
    mockExternalsHandler,
    mockVersionHandler,
    mockRemoteInfoHandler
}