import { createScopedExternalsRepository } from './scoped-externals.repository';
import { createStorageHandlerMock } from 'lib/6.mocks/handlers/storage.mock';
import { StorageConfig } from 'lib/2.app/config';
import {
  MOCK_SCOPED_EXTERNALS_SCOPE,
  buildMockVersion,
} from 'lib/6.mocks/domain/externals/external.mock';

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
          ['team/mfe1']: MOCK_SCOPED_EXTERNALS_SCOPE(),
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
      const newVersion = buildMockVersion.scopedVersion('9.9.9', 'dep-x');

      externalsRepo.addExternal('team/mfe1', 'dep-x', newVersion);

      expect(mockStorage['scoped-externals']['team/mfe1']).toEqual({});
    });

    it('should add external to scope after commit', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: {},
      });
      const newVersion = buildMockVersion.scopedVersion('9.9.9', 'dep-x');

      externalsRepo.addExternal('team/mfe1', 'dep-x', newVersion);

      expect(mockStorage['scoped-externals']['team/mfe1']).toEqual({});

      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['team/mfe1']).toEqual({
        'dep-x': newVersion,
      });
    });

    it('should add external to a new scope', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_SCOPED_EXTERNALS_SCOPE(),
      });
      const newVersion = buildMockVersion.scopedVersion('9.9.9', 'dep-x');

      externalsRepo.addExternal('new-scope', 'dep-x', newVersion);
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['new-scope']).toEqual({
        'dep-x': newVersion,
      });
    });

    it('should add multiple externals to a new scope', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_SCOPED_EXTERNALS_SCOPE(),
      });
      const newVersionA = buildMockVersion.scopedVersion('8.8.8', 'dep-a');
      const newVersionB = buildMockVersion.scopedVersion('9.9.9', 'dep-b');

      externalsRepo
        .addExternal('new-scope', 'dep-a', newVersionA)
        .addExternal('new-scope', 'dep-b', newVersionB);
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['new-scope']).toEqual({
        'dep-a': newVersionA,
        'dep-b': newVersionB,
      });
    });

    it('should overwrite an existing external in a scope', () => {
      const newVersion = buildMockVersion.scopedVersion('8.8.8', 'new-dep-a');

      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_SCOPED_EXTERNALS_SCOPE(),
      });

      externalsRepo.addExternal('team/mfe1', 'dep-a', newVersion);
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']['team/mfe1']['dep-a']).toEqual(newVersion);
    });

    it('should return the repository instance for chaining', () => {
      const { externalsRepo } = setupWithCache({});
      const result = externalsRepo.addExternal(
        'scope-a',
        'dep-a',
        buildMockVersion.scoped1_2_3('dep-a')
      );
      expect(result).toBe(externalsRepo);
    });

    // Example showcasing the clean new buildMockVersion syntax
    it('should handle complex scoped externals setup with clean syntax', () => {
      const { externalsRepo, mockStorage } = setupWithCache({});

      // Set up multiple scopes with different externals using clean syntax
      externalsRepo
        .addExternal('shell-app', 'react', buildMockVersion.scopedVersion('18.2.0', 'react'))
        .addExternal('shell-app', 'lodash', buildMockVersion.scopedVersion('4.17.21', 'lodash'))
        .addExternal('feature-team-a', 'vue', buildMockVersion.scopedVersion('3.3.4', 'vue'))
        .addExternal('feature-team-a', 'axios', buildMockVersion.scopedVersion('1.4.0', 'axios'))
        .addExternal('legacy-app', 'jquery', buildMockVersion.scopedVersion('3.6.0', 'jquery'));

      externalsRepo.commit();

      expect(mockStorage['scoped-externals']).toEqual({
        'shell-app': {
          react: buildMockVersion.scopedVersion('18.2.0', 'react'),
          lodash: buildMockVersion.scopedVersion('4.17.21', 'lodash'),
        },
        'feature-team-a': {
          vue: buildMockVersion.scopedVersion('3.3.4', 'vue'),
          axios: buildMockVersion.scopedVersion('1.4.0', 'axios'),
        },
        'legacy-app': {
          jquery: buildMockVersion.scopedVersion('3.6.0', 'jquery'),
        },
      });
    });
  });

  describe('getAll', () => {
    it('should return all externals from the cache', () => {
      const { externalsRepo } = setupWithCache({
        ['team/mfe1']: {
          'dep-a': buildMockVersion.scoped1_2_3('dep-a'),
          'dep-b': buildMockVersion.scoped1_2_3('dep-b'),
        },
        ['team/mfe2']: {
          'dep-x': buildMockVersion.scoped1_2_3('dep-x'),
        },
      });

      const allExternals = externalsRepo.getAll();

      expect(allExternals).toEqual({
        ['team/mfe1']: {
          'dep-a': buildMockVersion.scoped1_2_3('dep-a'),
          'dep-b': buildMockVersion.scoped1_2_3('dep-b'),
        },
        ['team/mfe2']: {
          'dep-x': buildMockVersion.scoped1_2_3('dep-x'),
        },
      });
    });
    it('should return an empty object if no externals are cached', () => {
      const { externalsRepo } = setupWithCache({});
      const allExternals = externalsRepo.getAll();
      expect(allExternals).toEqual({});
    });
  });

  describe('remove', () => {
    it('should remove a remoteEntry scope from the cache', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_SCOPED_EXTERNALS_SCOPE(),
      });

      externalsRepo.remove('team/mfe1');
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']).toEqual({});
    });

    it('should not remove other remoteEntry scope', () => {
      const { externalsRepo, mockStorage } = setupWithCache({
        ['team/mfe1']: MOCK_SCOPED_EXTERNALS_SCOPE(),
        ['team/mfe2']: MOCK_SCOPED_EXTERNALS_SCOPE(),
      });

      externalsRepo.remove('team/mfe1');
      externalsRepo.commit();

      expect(mockStorage['scoped-externals']).toEqual({
        ['team/mfe2']: MOCK_SCOPED_EXTERNALS_SCOPE(),
      });
    });

    it('should return the repository instance for chaining', () => {
      const { externalsRepo } = setupWithCache({});
      const result = externalsRepo.remove('scope-a');
      expect(result).toBe(externalsRepo);
    });
  });
});
