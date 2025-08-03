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
  buildMockVersion,
  mockExternalA,
  mockExternalB,
} from 'lib/6.mocks/domain/externals/external.mock';
import { Optional } from 'lib/utils/optional';
import { ForSharedExternalsStorage } from 'lib/sdk.index';

describe('createSharedExternalsRepository', () => {
  const setupWithCache = (data: Record<string, Record<string, SharedExternal>> = {}) => {
    const mockStorage = { 'shared-externals': data };
    const mockStorageEntry = createStorageHandlerMock(mockStorage);
    const externalsRepo = createSharedExternalsRepository({
      storage: mockStorageEntry,
      clearStorage: false,
    });
    return { mockStorage, externalsRepo };
  };

  describe('initialization', () => {
    it('should initialize the entry with the first value', () => {
      const mockStorage = { 'shared-externals': undefined };
      const mockStorageEntry = createStorageHandlerMock(mockStorage);

      createSharedExternalsRepository({
        storage: mockStorageEntry,
        clearStorage: false,
      });

      expect(mockStorage['shared-externals']).toEqual({ [GLOBAL_SCOPE]: {} });
    });

    it('should reset cache when in config', () => {
      const mockStorage: { 'shared-externals': SharedExternals } = {
        ['shared-externals']: {
          [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
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
        [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
        ['custom-scope']: { 'dep-b': mockExternalB() },
      });

      const actual: shareScope = externalsRepo.getAll('custom-scope');

      expect(actual).toEqual({ 'dep-b': mockExternalB() });
    });

    it('should return all shared deps of the global scope by default', () => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
        ['custom-scope']: { 'dep-b': mockExternalB() },
      });

      const actual: shareScope = externalsRepo.getAll();

      expect(actual).toEqual({ 'dep-a': mockExternalA() });
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
        [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
        ['custom-scope']: { 'dep-b': mockExternalB() },
      });
      repository = externalsRepo;
    });

    it('should return the versions', () => {
      const actual: Optional<SharedExternal> = repository.tryGet('dep-a');
      const expected: SharedExternal = mockExternalA();

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
      const expected: SharedExternal = mockExternalB();

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

    it('should not add or update storage if no commit', () => {
      repository.addOrUpdate('dep-a', mockExternalA());
      const expected = { 'shared-externals': {} };

      expect(storage).toEqual(expected);
    });

    it('should add a new external to global storage after commit', () => {
      repository.addOrUpdate('dep-a', mockExternalA());
      expect(storage).toEqual({ 'shared-externals': {} });

      repository.commit();

      expect(storage).toEqual({
        'shared-externals': {
          [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
        },
      });
    });

    it('should add a new external to custom shareScope storage after commit', () => {
      repository.addOrUpdate('dep-a', mockExternalA(), 'custom-scope');
      expect(storage).toEqual({ 'shared-externals': {} });

      repository.commit();
      expect(storage).toEqual({
        'shared-externals': {
          'custom-scope': { 'dep-a': mockExternalA() },
        },
      });
    });

    it('should replace versions for an existing external', () => {
      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
      });

      externalsRepo.addOrUpdate('dep-a', {
        dirty: false,
        versions: [buildMockVersion.v2_1_1('dep-a', ['team/mfe1'])],
      });

      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': {
            dirty: false,
            versions: [buildMockVersion.v2_1_1('dep-a', ['team/mfe1'])],
          },
        },
      });
    });

    it('should keep other externals when adding a new one', () => {
      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
      });

      externalsRepo.addOrUpdate('dep-b', mockExternalB());

      externalsRepo.commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-a': mockExternalA(),
          'dep-b': mockExternalB(),
        },
      });
    });

    it('should keep other externals when updating an existing one', () => {
      const versionA = buildMockVersion.v2_1_1('dep-a', ['team/mfe1']);
      const versionB = buildMockVersion.v2_2_1('dep-b', ['team/mfe1']);

      const { mockStorage, externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-a': { dirty: false, versions: [versionA] },
          'dep-b': { dirty: false, versions: [versionB] },
        },
      });

      const newVersionA = buildMockVersion.v2_1_2('dep-a', ['team/mfe1']);

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
      const versionA1 = buildMockVersion.v2_1_1('dep-a', ['team/mfe1']);
      const versionA2 = buildMockVersion.v2_1_2('dep-a', ['team/mfe1']);

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
      const result = repository.addOrUpdate('dep-a', mockExternalA());
      expect(result).toBe(repository);
    });

    // Example showcasing the clean new buildMockVersion syntax
    it('should handle complex scenarios with clean builder syntax', () => {
      const { mockStorage, externalsRepo } = setupWithCache({});

      // Create externals with multiple versions using clean syntax
      externalsRepo
        .addOrUpdate(
          'react',
          buildMockVersion.external([
            buildMockVersion.v2_1_2('react', ['shell', 'dashboard']),
            buildMockVersion.v2_1_1('react', ['legacy-app']),
          ])
        )
        .addOrUpdate(
          'lodash',
          buildMockVersion.external([
            buildMockVersion.versionWithOptions('4.17.21', 'lodash', {
              app1: { cached: true },
              app2: { strictVersion: false },
            }),
          ])
        )
        .commit();

      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          react: buildMockVersion.external([
            buildMockVersion.v2_1_2('react', ['shell', 'dashboard']),
            buildMockVersion.v2_1_1('react', ['legacy-app']),
          ]),
          lodash: buildMockVersion.external([
            buildMockVersion.versionWithOptions('4.17.21', 'lodash', {
              app1: { cached: true },
              app2: { strictVersion: false },
            }),
          ]),
        },
      });
    });
  });

  describe('getScopes', () => {
    let repository: ForSharedExternalsStorage;

    beforeEach(() => {
      const { externalsRepo } = setupWithCache({
        [GLOBAL_SCOPE]: { 'dep-a': mockExternalA() },
        ['custom-scope']: { 'dep-b': mockExternalB() },
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
      const versionA1 = buildMockVersion.v2_1_1('dep-a', ['team/mfe1']);
      const versionA2 = buildMockVersion.v2_1_1('dep-a', ['team/mfe2']);
      const versionD1 = buildMockVersion.v2_1_2('dep-d', ['team/mfe2', 'team/mfe3']);

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
      const versionB1 = buildMockVersion.v2_1_2('dep-b', ['team/mfe1', 'team/mfe2']);
      const versionD1 = buildMockVersion.v2_1_2('dep-d', ['team/mfe2', 'team/mfe3']);

      const { externalsRepo, mockStorage } = setupWithCache({
        [GLOBAL_SCOPE]: {
          'dep-b': { dirty: false, versions: [versionB1] },
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });

      externalsRepo.removeFromAllScopes('team/mfe1');
      externalsRepo.commit();

      const versionB1_withoutTeam1 = buildMockVersion.v2_1_2('dep-b', ['team/mfe2']);
      expect(mockStorage['shared-externals']).toEqual({
        [GLOBAL_SCOPE]: {
          'dep-b': { dirty: false, versions: [versionB1_withoutTeam1] },
          'dep-d': { dirty: false, versions: [versionD1] },
        },
      });
    });

    it('should remove an externals if all versions are gone', () => {
      const versionC1 = buildMockVersion.v2_1_2('dep-c', ['team/mfe1']);
      const versionD1 = buildMockVersion.v2_1_2('dep-d', ['team/mfe2', 'team/mfe3']);

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
