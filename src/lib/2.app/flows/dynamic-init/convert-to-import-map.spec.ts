import { LoggingConfig } from '../../config/log.contract';
import { ForConvertingToImportMap } from 'lib/2.app/driver-ports/dynamic-init/for-converting-to-import-map';
import { createConvertToImportMap } from './convert-to-import-map';
import { RemoteEntry, SharedInfoActions } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockRemoteEntry_MFE2 } from 'lib/6.mocks/domain/remote-entry/remote-entry.mock';
import { mockScopeUrl_MFE1, mockScopeUrl_MFE2 } from 'lib/6.mocks/domain/scope-url.mock';
import {
  mockSharedInfoA,
  mockSharedInfoB,
  mockSharedInfoC,
  mockSharedInfoE,
  mockSharedInfoF,
} from 'lib/6.mocks/domain/remote-entry/shared-info.mock';
import {
  mockExposedModuleA,
  mockExposedModuleB,
} from 'lib/6.mocks/domain/remote-entry/exposes-info.mock';
import { mockChunkRepository } from 'lib/6.mocks/adapters/chunk.repository.mock';
import { Optional } from 'lib/utils/optional';
import { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';

describe('createConvertToImportMap', () => {
  let convertToImportMap: ForConvertingToImportMap;
  let config: LoggingConfig;
  let ports: Pick<DrivingContract, 'sharedChunksRepo'>;

  beforeEach(() => {
    config = mockConfig();
    ports = {
      sharedChunksRepo: mockChunkRepository(),
    };

    convertToImportMap = createConvertToImportMap(config, ports);
  });

  describe('Remote Entry Exposes', () => {
    it('should add remote entry exposes to importMap', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({ shared: [] });
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'team/mfe2/./wc-comp-b': mockScopeUrl_MFE2({ file: 'component-b.js' }),
          'team/mfe2/./wc-comp-c': mockScopeUrl_MFE2({ file: 'component-c.js' }),
        },
      });
    });

    it('should handle a missing shared property', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({ shared: undefined });
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'team/mfe2/./wc-comp-b': mockScopeUrl_MFE2({ file: 'component-b.js' }),
          'team/mfe2/./wc-comp-c': mockScopeUrl_MFE2({ file: 'component-c.js' }),
        },
      });
    });

    it('should handle empty exposes array', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({ shared: [], exposes: [] });

      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });

    it('should handle missing exposes property', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({ shared: [], exposes: undefined });

      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });
  });

  describe('Shared Externals - singleton: false (Scoped)', () => {
    it('should add non-singleton externals to scoped imports', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoE.v1_2_3(), mockSharedInfoF.v1_2_4()],
      });

      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          'http://my.service/mfe2/': {
            'dep-e': mockScopeUrl_MFE2({ file: 'dep-e.js' }),
            'dep-f': mockScopeUrl_MFE2({ file: 'dep-f.js' }),
          },
        },
      });
    });

    it('should not override for non-singleton externals', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoE.v1_2_3()],
      });
      const actions: SharedInfoActions = {
        'dep-e': { action: 'scope', override: mockScopeUrl_MFE1({ file: 'dep-e.js' }) },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          [mockScopeUrl_MFE2()]: {
            'dep-e': mockScopeUrl_MFE2({ file: 'dep-e.js' }),
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton with "skip" action', () => {
    it('should skip externals with skip action and no shareScope', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2()],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'skip' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });

    it('should handle skip action with override and shareScope', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2({ shareScope: 'custom-scope' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'skip', override: mockScopeUrl_MFE1({ file: 'dep-a.js' }) },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          [mockScopeUrl_MFE2()]: {
            'dep-a': mockScopeUrl_MFE1({ file: 'dep-a.js' }),
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton with "scope" action', () => {
    it('should add scoped externals with scope action', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2({ shareScope: 'custom-scope' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'scope' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          [mockScopeUrl_MFE2()]: {
            'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton shareScope with "share" action', () => {
    it('should add the shared external to the specific scope when shareScope is defined', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2({ shareScope: 'custom-scope' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };
      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
        scopes: {
          [mockScopeUrl_MFE2()]: {
            'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
          },
        },
      });
    });
  });

  describe('Shared Externals - Singleton with "share" action', () => {
    it('should add globally shared externals with no shareScope', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2(), mockSharedInfoB.v2_1_2()],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
        'dep-b': { action: 'share' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
          'dep-b': mockScopeUrl_MFE2({ file: 'dep-b.js' }),
        },
      });
    });

    it('should skip singleton externals without actions defined', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2()],
      });
      const actions: SharedInfoActions = {};

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {},
      });
    });
  });

  describe('Combined Functionality', () => {
    it('should handle remote entry with both exposes and shared externals', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [mockExposedModuleA(), mockExposedModuleB()],
        shared: [mockSharedInfoA.v2_1_2()],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'team/mfe2/./wc-comp-a': mockScopeUrl_MFE2({ file: 'component-a.js' }),
          'team/mfe2/./wc-comp-b': mockScopeUrl_MFE2({ file: 'component-b.js' }),
          'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
        },
      });
    });

    it('should handle mixed singleton and non-singleton externals', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [
          mockSharedInfoA.v2_1_2({ singleton: true }), // Shared
          mockSharedInfoB.v2_1_1({ singleton: false }), // Scoped
          mockSharedInfoC.v2_2_1({ singleton: true }), // Scoped
        ],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
        'dep-c': { action: 'scope' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });
      expect(importMap).toEqual({
        imports: {
          'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
        },
        scopes: {
          [mockScopeUrl_MFE2()]: {
            'dep-b': mockScopeUrl_MFE2({ file: 'dep-b.js' }),
            'dep-c': mockScopeUrl_MFE2({ file: 'dep-c.js' }),
          },
        },
      });
    });
  });

  describe('Chunk Imports', () => {
    it('should not add chunk imports when no bundles are present', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2()],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(ports.sharedChunksRepo.tryGet).not.toHaveBeenCalled();
      expect(importMap.imports['@nf-chunk/shared-chunk']).toBeUndefined();
    });

    it('should add chunk imports for shared externals with bundle', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2({ bundle: 'shared' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };
      ports.sharedChunksRepo.tryGet = jest.fn((remote, bundle) => {
        if (remote === 'team/mfe2' && bundle === 'shared') {
          return Optional.of(['shared-chunk.js', 'utils-chunk.js']);
        }
        return Optional.empty();
      });

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe2', 'shared');
      expect(importMap.imports['@nf-chunk/shared-chunk']).toBe(
        mockScopeUrl_MFE2({ file: 'shared-chunk.js' })
      );
      expect(importMap.imports['@nf-chunk/utils-chunk']).toBe(
        mockScopeUrl_MFE2({ file: 'utils-chunk.js' })
      );
    });

    it('should add chunk imports for multiple bundles from same remote', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [
          mockSharedInfoA.v2_1_2({ bundle: 'shared' }),
          mockSharedInfoB.v2_1_2({ bundle: 'vendor' }),
        ],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
        'dep-b': { action: 'share' },
      };
      ports.sharedChunksRepo.tryGet = jest.fn((remote, bundle) => {
        if (remote === 'team/mfe2' && bundle === 'shared') {
          return Optional.of(['shared-chunk.js']);
        }
        if (remote === 'team/mfe2' && bundle === 'vendor') {
          return Optional.of(['vendor-chunk.js']);
        }
        return Optional.empty();
      });

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe2', 'shared');
      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe2', 'vendor');
      expect(importMap.imports['@nf-chunk/shared-chunk']).toBe(
        mockScopeUrl_MFE2({ file: 'shared-chunk.js' })
      );
      expect(importMap.imports['@nf-chunk/vendor-chunk']).toBe(
        mockScopeUrl_MFE2({ file: 'vendor-chunk.js' })
      );
    });

    it('should deduplicate bundles when same bundle is used by multiple externals', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [
          mockSharedInfoA.v2_1_2({ bundle: 'shared' }),
          mockSharedInfoB.v2_1_2({ bundle: 'shared' }),
        ],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
        'dep-b': { action: 'share' },
      };
      ports.sharedChunksRepo.tryGet = jest.fn(() => Optional.of(['shared-chunk.js']));

      await convertToImportMap({ entry: remoteEntry, actions });

      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledTimes(1);
      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe2', 'shared');
    });

    it('should add chunk imports for non-singleton externals with bundle', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [
          {
            ...mockSharedInfoE.v1_2_3(),
            bundle: 'scoped',
          },
        ],
      });
      const actions: SharedInfoActions = {};
      ports.sharedChunksRepo.tryGet = jest.fn((remote, bundle) => {
        if (remote === 'team/mfe2' && bundle === 'scoped') {
          return Optional.of(['scoped-chunk.js']);
        }
        return Optional.empty();
      });

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe2', 'scoped');
      expect(importMap.imports['@nf-chunk/scoped-chunk']).toBe(
        mockScopeUrl_MFE2({ file: 'scoped-chunk.js' })
      );
    });

    it('should handle chunks with .mjs extension', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2({ bundle: 'shared' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };
      ports.sharedChunksRepo.tryGet = jest.fn(() => Optional.of(['shared-chunk.mjs']));

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(importMap.imports['@nf-chunk/shared-chunk']).toBe(
        mockScopeUrl_MFE2({ file: 'shared-chunk.mjs' })
      );
    });

    it('should handle empty chunk array from repository', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2({ bundle: 'shared' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };
      ports.sharedChunksRepo.tryGet = jest.fn(() => Optional.of([]));

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe2', 'shared');
      expect(Object.keys(importMap.imports).filter(k => k.startsWith('@nf-chunk/'))).toHaveLength(
        0
      );
    });

    it('should handle when repository returns empty Optional', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [],
        shared: [mockSharedInfoA.v2_1_2({ bundle: 'shared' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };
      ports.sharedChunksRepo.tryGet = jest.fn(() => Optional.empty());

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(ports.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe2', 'shared');
      expect(Object.keys(importMap.imports).filter(k => k.startsWith('@nf-chunk/'))).toHaveLength(
        0
      );
    });

    it('should add chunk imports alongside exposes and shared externals', async () => {
      const remoteEntry: RemoteEntry = mockRemoteEntry_MFE2({
        exposes: [mockExposedModuleA()],
        shared: [mockSharedInfoA.v2_1_2({ bundle: 'shared' })],
      });
      const actions: SharedInfoActions = {
        'dep-a': { action: 'share' },
      };
      ports.sharedChunksRepo.tryGet = jest.fn(() => Optional.of(['shared-chunk.js']));

      const importMap = await convertToImportMap({ entry: remoteEntry, actions });

      expect(importMap.imports).toEqual({
        'team/mfe2/./wc-comp-a': mockScopeUrl_MFE2({ file: 'component-a.js' }),
        'dep-a': mockScopeUrl_MFE2({ file: 'dep-a.js' }),
        '@nf-chunk/shared-chunk': mockScopeUrl_MFE2({ file: 'shared-chunk.js' }),
      });
    });
  });
});
