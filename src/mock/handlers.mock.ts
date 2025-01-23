import { LogHandler } from "../lib/handlers/logging/log.contract";
import { Remote } from "../lib/handlers/remote-info/remote-info.contract";
import { SharedInfoHandler } from "../lib/handlers/shared-info";
import { StorageHandler } from "../lib/handlers/storage/storage.contract";

const mockLogHandler = (): LogHandler => ({
    debug: jest.fn(() => {}),
    warn: jest.fn(() => {}),
    error: jest.fn(() => {})
})

const mockStorageHandler = <TStorage extends Record<keyof TStorage, any>>(): StorageHandler<TStorage> => ({
    fetch: jest.fn(),
    entry: jest.fn(),
    get: jest.fn(),
    mutate: jest.fn().mockReturnThis(),
});

const mockSharedInfoHandler = (): SharedInfoHandler => ({
    mapSharedDeps: jest.fn(),
    addToCache: jest.fn((r: Remote) => r)
});

export {
    mockLogHandler,
    mockStorageHandler,
    mockSharedInfoHandler
}