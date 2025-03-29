import { LogHandler } from "../lib/core/logging/log.contract";
import { ExternalsHandler } from "../lib/core/externals";
import { NfCache, StorageHandler } from "../lib/core/storage/storage.contract";
import { VersionHandler } from "../lib/core/version/version.contract";
import { RemoteInfoHandler } from "../lib/core/remote-info";

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
    checkForIncompatibleSingletons: jest.fn()
});

const mockRemoteInfoHandler = (): RemoteInfoHandler => ({
    toStorage: jest.fn(),
    fromStorage: jest.fn(),
    fetchRemoteEntry: jest.fn(),
    getHostRemoteEntryUrl: jest.fn(),
    inStorage: jest.fn(),
    toScope: jest.fn()
});

const mockVersionHandler = (): VersionHandler => ({
    isValid: jest.fn(),
    compareVersions: jest.fn<number, [string, string]>(),
    getLatestVersion: jest.fn(),
    isCompatible: jest.fn(),
    getSmallestVersionRange: jest.fn()
});

export {
    mockLogHandler,
    mockStorageHandler,
    mockExternalsHandler,
    mockVersionHandler,
    mockRemoteInfoHandler
}
