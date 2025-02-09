import { LogHandler } from "../lib/handlers/logging/log.contract";
import { Remote } from "../lib/handlers/remote-info/remote-info.contract";
import { ExternalsHandler } from "../lib/handlers/externals";
import { NfCache, StorageHandler } from "../lib/handlers/storage/storage.contract";
import { VersionHandler } from "../lib/handlers/version/version.contract";

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
    addToStorage: jest.fn((r: Remote) => r),
    toScope: jest.fn(),
    getFromScope: jest.fn(),
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
    mockVersionHandler
}