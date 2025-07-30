import { createScopedExternalsRepository } from './scoped-externals.repository';
import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { MOCK_EXTERNALS_SCOPE } from 'lib/6.mocks/domain/externals/external.mock';
import { ScopedVersion } from 'lib/1.domain/externals/version.contract';
import { MOCK_VERSION_I } from 'lib/6.mocks/domain/externals/version.mock';
import { StorageConfig } from 'lib/2.app/config';

describe('createScopedExternalsRepository', () => {
  const setupWithCache = (storage: any) => {
    const mockStorage = { 'scoped-externals': storage };
    const mockStorageEntry = createStorageHandlerMock(mockStorage);

    const mockConfig: StorageConfig = {
      storage: mockStorageEntry,
      clearStorage: false,
    };
    const externalsRepo = createScopedExternalsRepository(mockConfig);
    return { mockStorage, externalsRepo };
  };

  describe('initialization', () => {
    it('should initialize the entry with the first value', () => {
      const { mockStorage } = setupWithCache(undefined);
      expect(mockStorage['scoped-externals']).toEqual({});
    });

    it('should reset cache when in config', () => {
      const mockStorage = {
        'scoped-externals': {
          ['team/mfe1']: MOCK_EXTERNALS_SCOPE(),
        },
      };
      const mockStorageEntry = createStorageHandlerMock(mockStorage);
      const mockConfig: StorageConfig = {
        storage: mockStorageEntry,
        clearStorage: true,
      };
      createScopedExternalsRepository(mockConfig);
      expect(mockStorage['scoped-externals']).toEqual({});
    });
  });

  describe('addExternal', () => {
    it('should not add external to scope if no commit', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: {},
      });
      const newVersion = (): ScopedVersion => ({
        tag: '9.9.9',
        file: 'dep-x.js',
      });

      externalsRepo.addExternal('team/mfe1', 'dep-x', newVersion());

      expect(mockStorage['scoped-externals']['team/mfe1']).toEqual({});
    });

    it('should add external to scope after commit', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: {},
      });
      const newVersion = (): ScopedVersion => ({
        tag: '9.9.9',
        file: 'dep-x.js',
      });

      externalsRepo.addExternal('team/mfe1', 'dep-x', newVersion());

      expect(mockStorage['scoped-externals']['team/mfe1']).toEqual({});

      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['team/mfe1']).toEqual({
        'dep-x': newVersion(),
      });
    });

    it('should add external to a new scope', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_EXTERNALS_SCOPE(),
      });
      const newVersion = (): ScopedVersion => ({
        tag: '9.9.9',
        file: 'dep-x.js',
      });

      externalsRepo.addExternal('new-scope', 'dep-x', newVersion());
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['new-scope']).toEqual({
        'dep-x': newVersion(),
      });
    });

    it('should add multiple externals to a new scope', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_EXTERNALS_SCOPE(),
      });
      const newVersionI = (): ScopedVersion => ({
        tag: '8.8.8',
        file: 'dep-a.js',
      });
      const newVersionII = (): ScopedVersion => ({
        tag: '9.9.9',
        file: 'dep-b.js',
      });

      externalsRepo
        .addExternal('new-scope', 'dep-a', newVersionI())
        .addExternal('new-scope', 'dep-b', newVersionII());
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['new-scope']).toEqual({
        'dep-a': newVersionI(),
        'dep-b': newVersionII(),
      });
    });

    it('should overwrite an existing external in a scope', () => {
      const newVersion = (): ScopedVersion => ({
        tag: '8.8.8',
        file: 'new-dep-a.js',
      });

      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_EXTERNALS_SCOPE(),
      });

      externalsRepo.addExternal('team/mfe1', 'dep-a', newVersion());
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['team/mfe1']['dep-a']).toEqual(newVersion());
    });

    it('should return the repository instance for chaining', () => {
      const { externalsRepo } = setupWithCache({});
      const result = externalsRepo.addExternal('scope-a', 'dep-a', MOCK_VERSION_I());
      expect(result).toBe(externalsRepo);
    });
  });
});
