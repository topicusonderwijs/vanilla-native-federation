import { createSharedExternalsRepository } from './shared-externals.repository';
import {
  GLOBAL_SCOPE,
  SharedExternal,
  SharedExternals,
  shareScope,
  STRICT_SCOPE,
} from 'lib/1.domain/externals/external.contract';
import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { StorageConfig } from 'lib/2.app/config';
import {
  MOCK_DEP_A,
  MOCK_DEP_B,
  MOCK_FROM_EXTERNAL,
  builders,
} from 'lib/6.mocks/domain/externals/external.mock';
import { Optional } from 'lib/utils/optional';
import { ForSharedExternalsStorage } from 'lib/sdk.index';

describe('createSharedExternalsRepository', () => {
  const setupWithCache = (storage: any) => {
    const mockStorage = { 'shared-externals': storage };
    const mockStorageEntry = createStorageHandlerMock(mockStorage);

    const externalsRepo = createSharedExternalsRepository({
      storage: mockStorageEntry,
      clearStorage: false,
    });
    return { mockStorage, externalsRepo };
  };

  // Helper function to show new builder usage
  const setupWithBuilders = (data: Record<string, Record<string, SharedExternal>> = {}) => {
    const mockStorage = { 'shared-externals': data };
    const mockStorageEntry = createStorageHandlerMock(mockStorage);
    const repo = createSharedExternalsRepository({
      storage: mockStorageEntry,
      clearStorage: false,
    });
    return { repo, storage: mockStorage };
  };

  describe('initialization', () => {
    it('should initialize the entry with the first value', () => {
      const { mockStorage } = setupWithCache(undefined);
      expect(mockStorage['shared-externals']).toEqual({ [GLOBAL_SCOPE]: {} });
    });

    it('should reset cache when in config', () => {
      const mockStorage: { 'shared-externals': SharedExternals } = {
        ['shared-externals']: {
          [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
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

      const actual: shareScope = externalsRepo.getAll();

      expect(actual).toEqual({});
    });

    it('should return all shared deps of a particular scope', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
        ['custom-scope']: { 'dep-b': MOCK_DEP_B() },
      });

      const actual: shareScope = externalsRepo.getAll('custom-scope');

      expect(actual).toEqual({ 'dep-b': MOCK_DEP_B() });
    });

    it('should return all shared deps of the global scope by default', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
        ['custom-scope']: { 'dep-b': MOCK_DEP_B() },
      });

      const actual: shareScope = externalsRepo.getAll();

      expect(actual).toEqual({ 'dep-a': MOCK_DEP_A() });
    });
  });

  describe('scopeType', () => {
    it('should return "global" for global scope', () => {
      const { externalsRepo } = setupWithCache({});

      expect(externalsRepo.scopeType(GLOBAL_SCOPE)).toBe('global');
    });

    it('should return "global" for undefined scope', () => {
      const { externalsRepo } = setupWithCache({});

      expect(externalsRepo.scopeType(undefined)).toBe('global');
    });

    it('should return "strict" for strict scope', () => {
      const { externalsRepo } = setupWithCache({});

      expect(externalsRepo.scopeType(STRICT_SCOPE)).toBe('strict');
    });

    it('should return false for custom scopes', () => {
      const { externalsRepo } = setupWithCache({});

      expect(externalsRepo.scopeType('custom-scope')).toBe('shareScope');
    });
  });

  describe('tryGet', () => {
    let repository: ForSharedExternalsStorage;

    beforeEach(() => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
        ['custom-scope']: { 'dep-b': MOCK_DEP_B() },
      });
      repository = externalsRepo;
    });

    it('should return the versions', () => {
      const actual: Optional<SharedExternal> = repository.tryGet('dep-a');
      const expected: SharedExternal = MOCK_DEP_A();

      expect(actual.isPresent()).toBe(true);
      expect(actual.get()).toEqual(expected);
    });

    it('should return empty optional if version doesnt exist', () => {
      const { externalsRepo } = setupWithCache({});

      const actual: Optional<SharedExternal> = externalsRepo.tryGet('dep-a');

      expect(actual.isPresent()).toBe(false);
      expect(actual.get()).toEqual(undefined);
    });

    it('should return an external from a custom scope', () => {
      const actual: Optional<SharedExternal> = repository.tryGet('dep-b', 'custom-scope');
      const expected: SharedExternal = MOCK_DEP_B();

      expect(actual.isPresent()).toBe(true);
      expect(actual.get()).toEqual(expected);
    });

    it('should return empty optional if only other externals exist', () => {
      const actual: Optional<SharedExternal> = repository.tryGet('dep-b'); // from global scope
      const expected = undefined;

      expect(actual.isPresent()).toBe(false);
      expect(actual.get()).toEqual(expected);
    });

    it('should not return an external from a different scope', () => {
      const actual: Optional<SharedExternal> = repository.tryGet('dep-a', 'custom-scope');
      const expected = undefined;

      expect(actual.isPresent()).toBe(false);
      expect(actual.get()).toEqual(expected);
    });
  });

  describe('addOrUpdate', () => {
    let repository: ForSharedExternalsStorage;
    let storage: any;

    beforeEach(() => {
      const { externalsRepo, mockStorage } = setupWithCache({});
      repository = externalsRepo;
      storage = mockStorage;
    });

    it('should not add or update if no commit', () => {
      repository.addOrUpdate('dep-a', MOCK_DEP_A());
      const expected = { 'shared-externals': {} };

      expect(storage).toEqual(expected);
    });

    it('should add a new external to global storage after commit', () => {
      repository.addOrUpdate('dep-a', MOCK_DEP_A());
      expect(storage).toEqual({ 'shared-externals': {} });

      repository.commit();

      expect(storage).toEqual({
        'shared-externals': {
          [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
        },
      });
    });

    it('should add a new external to custom shareScope storage after commit', () => {
      repository.addOrUpdate('dep-a', MOCK_DEP_A(), 'custom-scope');
      expect(storage).toEqual({ 'shared-externals': {} });

      repository.commit();
      expect(storage).toEqual({
        'shared-externals': {
          'custom-scope': { 'dep-a': MOCK_DEP_A() },
        },
      });
    });

    it('should replace versions for an existing external', () => {
      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
      });

      externalsRepo.addOrUpdate('dep-a', {
        dirty: false,
        versions: [MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_1({ 'team/mfe1': {} })],
      });

      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': {
            dirty: false,
            versions: [MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_1({ 'team/mfe1': {} })],
          },
        },
      });
    });

    it('should keep other externals when adding a new one', () => {
      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
      });

      externalsRepo.addOrUpdate('dep-b', MOCK_DEP_B());

      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': MOCK_DEP_A(),
          'dep-b': MOCK_DEP_B(),
        },
      });
    });

    it('should keep other externals when updating an existing one', () => {
      const versionA = MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_1({ 'team/mfe1': {} });
      const versionB = MOCK_FROM_EXTERNAL('dep-b').SHARED_VERSION_2_2_1({ 'team/mfe1': {} });

      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [versionA] },
          'dep-b': { dirty: false, versions: [versionB] },
        },
      });

      const newVersionA = MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_2({ 'team/mfe1': {} });

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
      const versionA1 = MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_1({ 'team/mfe1': {} });
      const versionA2 = MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_2({ 'team/mfe1': {} });

      const { mockStorage, externalsRepo } = setupWithCache({});

      externalsRepo.addOrUpdate('dep-a', { dirty: false, versions: [versionA1, versionA2] });
      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': {
            dirty: false,
            versions: [versionA1, versionA2],
          },
        },
      });
    });

    it('should return the repository instance for chaining', () => {
      const result = repository.addOrUpdate('dep-a', MOCK_DEP_A());
      expect(result).toBe(repository);
    });
  });

  describe('getScopes', () => {
    let repository: ForSharedExternalsStorage;

    beforeEach(() => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': MOCK_DEP_A() },
        ['custom-scope']: { 'dep-b': MOCK_DEP_B() },
      });
      repository = externalsRepo;
    });

    it('should return all scopes by default', () => {
      const actual = repository.getScopes();
      expect(actual).toEqual(['__GLOBAL__', 'custom-scope']);
    });

    it('should exclude the global scope when in options', () => {
      const actual = repository.getScopes({ includeGlobal: false });
      expect(actual).toEqual(['custom-scope']);
    });
  });

  describe('removeFromAllScopes', () => {
    it('should remove all external versions from the global scope', () => {
      const versionA1 = MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_1({ 'team/mfe1': {} });
      const versionA2 = MOCK_FROM_EXTERNAL('dep-a').SHARED_VERSION_2_1_1({ 'team/mfe2': {} });
      const versionD1 = MOCK_FROM_EXTERNAL('dep-d').SHARED_VERSION_2_1_2({
        'team/mfe2': {},
        'team/mfe3': {},
      });
      const { externalsRepo, mockStorage } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [versionA1, versionA2] },
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });

      externalsRepo.removeFromAllScopes('team/mfe1');
      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: true, versions: [versionA2] },
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });
    });

    it('should remove a duplicate version without setting the external dirty flag', () => {
      const versionB1 = MOCK_FROM_EXTERNAL('dep-b').SHARED_VERSION_2_1_2({
        'team/mfe1': {},
        'team/mfe2': {},
      });
      const versionD1 = MOCK_FROM_EXTERNAL('dep-d').SHARED_VERSION_2_1_2({
        'team/mfe2': {},
        'team/mfe3': {},
      });
      const { externalsRepo, mockStorage } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-b': { dirty: false, versions: [versionB1] },
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });

      externalsRepo.removeFromAllScopes('team/mfe1');
      externalsRepo.commit();

      const versionB1_withoutTeam1 = MOCK_FROM_EXTERNAL('dep-b').SHARED_VERSION_2_1_2({
        'team/mfe2': {},
      });
      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-b': { dirty: false, versions: [versionB1_withoutTeam1] },
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });
    });

    it('should remove an externals if all versions are gone', () => {
      const versionC1 = MOCK_FROM_EXTERNAL('dep-c').SHARED_VERSION_2_1_2({
        'team/mfe1': {},
      });
      const versionD1 = MOCK_FROM_EXTERNAL('dep-c').SHARED_VERSION_2_1_2({
        'team/mfe2': {},
        'team/mfe3': {},
      });
      const { externalsRepo, mockStorage } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-c': { dirty: false, versions: [versionC1] },
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });

      externalsRepo.removeFromAllScopes('team/mfe1');
      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });
    });
  });
});
