import { StorageEntry } from 'lib/2.app/config/storage.contract';

export const createStorageHandlerMock = (storageRef: any) =>
  jest.fn(<TValue>(key: string, fallback: TValue) => {
    if (!storageRef[key]) storageRef[key] = fallback;

    const mockStorageEntry = {
      get: jest.fn(() => JSON.parse(JSON.stringify(storageRef[key]))),
      set: jest.fn(value => {
        storageRef[key] = value;
        return mockStorageEntry;
      }),
      clear: jest.fn(() => {
        storageRef[key] = fallback;
        return mockStorageEntry;
      }),
    } as StorageEntry<any>;

    return mockStorageEntry;
  });
