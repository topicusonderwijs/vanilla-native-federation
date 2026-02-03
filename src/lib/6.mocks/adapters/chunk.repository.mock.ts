import { ForSharedChunksStorage } from 'lib/2.app/driving-ports/for-shared-chunks-storage.port';

export const mockChunkRepository = (): jest.Mocked<ForSharedChunksStorage> => ({
  addOrReplace: jest.fn(),
  commit: jest.fn(),
});
