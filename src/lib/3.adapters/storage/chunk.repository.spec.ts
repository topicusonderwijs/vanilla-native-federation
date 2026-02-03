import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { StorageConfig } from 'lib/2.app/config';
import { createChunkRepository } from './chunk.repository';

describe('createChunkRepository', () => {
  const setupWithCache = (storage: any) => {
    const mockStorage = { 'shared-chunks': storage };
    const mockStorageEntry = createStorageHandlerMock(mockStorage);

    const mockConfig: StorageConfig = {
      storage: mockStorageEntry,
      clearStorage: false,
    };
    const chunksRepo = createChunkRepository(mockConfig);
    return { mockStorage, chunksRepo };
  };

  describe('initialization', () => {
    it('should initialize the entry with the first value', () => {
      const { mockStorage } = setupWithCache(undefined);
      expect(mockStorage['shared-chunks']).toEqual({});
    });

    it('should reset cache when in config', () => {
      const mockStorage = {
        'shared-chunks': {
          ['team/mfe1']: ['chunk-ABC.js', 'chunk-DEF.js'],
        },
      };
      const mockStorageEntry = createStorageHandlerMock(mockStorage);
      const mockConfig: StorageConfig = {
        storage: mockStorageEntry,
        clearStorage: true,
      };
      createChunkRepository(mockConfig);
      expect(mockStorage['shared-chunks']).toEqual({});
    });
  });

  describe('addOrReplace', () => {
    it('should not add chunks if no commit', () => {
      const { chunksRepo, mockStorage } = setupWithCache({});

      chunksRepo.addOrReplace('team/mfe1', 'shared-browser', ['chunk-ABC.js', 'chunk-DEF.js']);

      expect(mockStorage['shared-chunks']).toEqual({});
    });

    it('should add chunks to storage after commit', () => {
      const { chunksRepo, mockStorage } = setupWithCache({});

      chunksRepo.addOrReplace('team/mfe1', 'shared-browser', ['chunk-ABC.js', 'chunk-DEF.js']);

      expect(mockStorage['shared-chunks']).toEqual({});

      chunksRepo.commit();

      expect(mockStorage['shared-chunks']).toEqual({
        'team/mfe1': {
          'shared-browser': ['chunk-ABC.js', 'chunk-DEF.js'],
        },
      });
    });

    it('should add chunks to the same remote', () => {
      const { chunksRepo, mockStorage } = setupWithCache({
        'team/mfe1': {
          'shared-browser': ['chunk-ABC.js'],
        },
      });

      chunksRepo.addOrReplace('team/mfe1', 'different-build', ['chunk-DEF.js']);

      chunksRepo.commit();

      expect(mockStorage['shared-chunks']).toEqual({
        'team/mfe1': {
          'shared-browser': ['chunk-ABC.js'],
          'different-build': ['chunk-DEF.js'],
        },
      });
    });

    it('should add scope to a new remote', () => {
      const { chunksRepo, mockStorage } = setupWithCache({
        'team/mfe1': {
          'shared-browser': ['chunk-ABC.js'],
        },
      });

      chunksRepo.addOrReplace('team/mfe2', 'shared-browser', ['chunk-DEF.js']);

      chunksRepo.commit();

      expect(mockStorage['shared-chunks']).toEqual({
        'team/mfe1': {
          'shared-browser': ['chunk-ABC.js'],
        },
        'team/mfe2': {
          'shared-browser': ['chunk-DEF.js'],
        },
      });
    });

    it('should overwrite an existing build in a remote', () => {
      const { chunksRepo, mockStorage } = setupWithCache({
        'team/mfe1': {
          'shared-browser': ['chunk-ABC.js'],
        },
      });

      chunksRepo.addOrReplace('team/mfe1', 'shared-browser', ['chunk-DEF.js']);

      chunksRepo.commit();

      expect(mockStorage['shared-chunks']).toEqual({
        'team/mfe1': {
          'shared-browser': ['chunk-DEF.js'],
        },
      });
    });

    it('should return the repository instance for chaining', () => {
      const { chunksRepo } = setupWithCache({
        'team/mfe1': {
          'shared-browser': ['chunk-ABC.js'],
        },
      });

      const result = chunksRepo.addOrReplace('team/mfe1', 'shared-browser', ['chunk-DEF.js']);

      expect(result).toBe(chunksRepo);
    });
  });
});
