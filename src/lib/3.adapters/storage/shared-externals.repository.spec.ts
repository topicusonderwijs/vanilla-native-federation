import { createSharedExternalsRepository } from './shared-externals.repository';
import {
  GLOBAL_SCOPE,
  SharedExternals,
  SharedScope,
} from 'lib/1.domain/externals/external.contract';
import { SharedVersion } from 'lib/1.domain/externals/version.contract';
import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { Optional } from 'lib/utils/optional';
import { MOCK_VERSION_II, MOCK_VERSION_III } from 'lib/6.mocks/domain/externals/version.mock';
import { StorageConfig } from 'lib/2.app';

describe('createSharedExternalsRepository', () => {
  const setupWithCache = (storage: any) => {
    const mockStorage = { 'shared-externals': storage };
    const mockStorageEntry = createStorageHandlerMock(mockStorage);

    const mockConfig: StorageConfig = {
      storage: mockStorageEntry,
      clearStorage: false,
    };
    const externalsRepo = createSharedExternalsRepository(mockConfig);
    return { mockStorage, externalsRepo };
  };

  describe('initialization', () => {
    it('should initialize the entry with the first value', () => {
      const { mockStorage } = setupWithCache(undefined);
      expect(mockStorage['shared-externals']).toEqual({ [GLOBAL_SCOPE]: {} });
    });

    it('should reset cache when in config', () => {
      const mockStorage: { 'shared-externals': SharedExternals } = {
        ['shared-externals']: {
          [GLOBAL_SCOPE]: { 'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] } },
        },
      };
      const mockStorageEntry = createStorageHandlerMock(mockStorage);

      const mockConfig: StorageConfig = {
        storage: mockStorageEntry,
        clearStorage: true,
      };
      createSharedExternalsRepository(mockConfig);
      expect(mockStorage['shared-externals']).toEqual({ [GLOBAL_SCOPE]: {} });
    });
  });

  describe('getAll', () => {
    it('should return empty object if no shared deps', () => {
      const { externalsRepo } = setupWithCache({});

      const actual: SharedScope = externalsRepo.getAll();

      expect(actual).toEqual({});
    });

    it('should return all shared deps of a particular scope', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
        ['custom-scope']: {
          'dep-b': { dirty: false, versions: [MOCK_VERSION_III()] },
        },
      });

      const actual: SharedScope = externalsRepo.getAll('custom-scope');

      expect(actual).toEqual({ 'dep-b': { dirty: false, versions: [MOCK_VERSION_III()] } });
    });

    it('should return all shared deps of the global scope by default', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
        ['custom-scope']: {
          'dep-b': { dirty: false, versions: [MOCK_VERSION_III()] },
        },
      });

      const actual: SharedScope = externalsRepo.getAll();

      expect(actual).toEqual({ 'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] } });
    });
  });

  describe('tryGetVersions', () => {
    it('should return the versions', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
      });

      const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions('dep-a');

      expect(actual.isPresent()).toBe(true);
      expect(actual.get()).toEqual([MOCK_VERSION_II()]);
    });

    it('should return empty optional if version doesnt exist', () => {
      const { externalsRepo } = setupWithCache({});

      const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions('dep-a');

      expect(actual.isPresent()).toBe(false);
      expect(actual.get()).toEqual(undefined);
    });

    it('should return empty optional if only other externals exist', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
      });

      const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions('dep-b');

      expect(actual.isPresent()).toBe(false);
      expect(actual.get()).toEqual(undefined);
    });

    it('should return an external from a custom scope', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
        ['custom-scope']: {
          'dep-b': { dirty: false, versions: [MOCK_VERSION_III()] },
        },
      });
      const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions(
        'dep-b',
        'custom-scope'
      );

      expect(actual.isPresent()).toBe(true);
      expect(actual.get()).toEqual([MOCK_VERSION_III()]);
    });

    it('should not return an external from a different scope', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
        ['custom-scope']: {
          'dep-b': { dirty: false, versions: [MOCK_VERSION_III()] },
        },
      });
      const actual: Optional<SharedVersion[]> = externalsRepo.tryGetVersions(
        'dep-a',
        'custom-scope'
      );

      expect(actual.isPresent()).toBe(false);
      expect(actual.get()).toEqual(undefined);
    });
  });

  describe('addOrUpdate', () => {
    it('should not add or update if no commit', () => {
      const { mockStorage, externalsRepo } = setupWithCache({});

      externalsRepo.addOrUpdate('dep-a', { dirty: false, versions: [MOCK_VERSION_II()] });

      expect(mockStorage['shared-externals']).toEqual({});
    });

    it('should add a new external to empty storage after commit', () => {
      const { mockStorage, externalsRepo } = setupWithCache({});

      externalsRepo.addOrUpdate('dep-a', { dirty: false, versions: [MOCK_VERSION_II()] });
      expect(mockStorage['shared-externals']).toEqual({});

      externalsRepo.commit();
      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
      });
    });

    it('should add a new dirty external to the storage', () => {
      const { mockStorage, externalsRepo } = setupWithCache({});

      externalsRepo.addOrUpdate('dep-a', { dirty: true, versions: [MOCK_VERSION_II()] });
      expect(mockStorage['shared-externals']).toEqual({});

      externalsRepo.commit();
      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: true, versions: [MOCK_VERSION_II()] },
        },
      });
    });

    it('should replace versions for an existing external', () => {
      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
      });

      const newVersion = { ...MOCK_VERSION_II(), version: '2.0.0' };

      externalsRepo.addOrUpdate('dep-a', { dirty: false, versions: [newVersion] });

      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [newVersion] },
        },
      });
    });

    it('should keep other externals when adding a new one', () => {
      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
      });

      const versionB = { ...MOCK_VERSION_II(), version: '4.5.6' };

      externalsRepo.addOrUpdate('dep-b', { dirty: false, versions: [versionB] });

      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
          'dep-b': { dirty: false, versions: [versionB] },
        },
      });
    });

    it('should keep other externals when updating an existing one', () => {
      const versionA = MOCK_VERSION_II();
      const versionB = { ...MOCK_VERSION_II(), version: '4.5.6' };

      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [versionA] },
          'dep-b': { dirty: false, versions: [versionB] },
        },
      });

      const newVersionA = { ...MOCK_VERSION_II(), version: '2.0.0' };

      externalsRepo.addOrUpdate('dep-a', { dirty: false, versions: [newVersionA] });
      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [newVersionA] },
          'dep-b': { dirty: false, versions: [versionB] },
        },
      });
    });

    it('should add multiple versions for the same external', () => {
      const version1 = MOCK_VERSION_II();
      const version2 = { ...MOCK_VERSION_II(), version: '2.0.0' };

      const { mockStorage, externalsRepo } = setupWithCache({});

      externalsRepo.addOrUpdate('dep-a', { dirty: false, versions: [version1, version2] });
      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': {
            dirty: false,
            versions: [version1, version2],
          },
        },
      });
    });

    it('should return the repository instance for chaining', () => {
      const { externalsRepo } = setupWithCache({});
      const result = externalsRepo.addOrUpdate('dep-a', {
        dirty: false,
        versions: [MOCK_VERSION_II()],
      });
      expect(result).toBe(externalsRepo);
    });

    it('should add a new dirty external to a custom scope', () => {
      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
      });

      externalsRepo.addOrUpdate(
        'dep-b',
        { dirty: true, versions: [MOCK_VERSION_III()] },
        'custom-scope'
      );
      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
      });

      externalsRepo.commit();
      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [MOCK_VERSION_II()] },
        },
        'custom-scope': {
          'dep-b': { dirty: true, versions: [MOCK_VERSION_III()] },
        },
      });
    });
  });

  describe('getScopes', () => {
    it('should return only GLOBAL by default', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {},
      });

      const actual = externalsRepo.getScopes();

      expect(actual).toEqual(['__GLOBAL__']);
    });

    it('should return all availble scopes', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {},
        'custom-scope': {},
        'other-custom-scope': {},
      });

      const actual = externalsRepo.getScopes();

      expect(actual).toEqual(['__GLOBAL__', 'custom-scope', 'other-custom-scope']);
    });

    it('should exclude the global scope when in options', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {},
        'custom-scope': {},
        'other-custom-scope': {},
      });

      const actual = externalsRepo.getScopes({ includeGlobal: false });

      expect(actual).toEqual(['custom-scope', 'other-custom-scope']);
    });
  });
});
