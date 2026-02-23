import { ForSharedChunksStorage } from 'lib/2.app/driving-ports/for-shared-chunks-storage.port';
import { Optional } from 'lib/sdk.index';

export const mockChunkRepository = (): jest.Mocked<ForSharedChunksStorage> => ({
  addOrReplace: jest.fn(),
  commit: jest.fn(),
  tryGet: jest.fn((_a, _b) => Optional.empty<string[]>()),
});
