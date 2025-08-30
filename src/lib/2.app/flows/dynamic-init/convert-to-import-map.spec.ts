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

describe('createConvertToImportMap', () => {
  let convertToImportMap: ForConvertingToImportMap;
  let config: LoggingConfig;

  beforeEach(() => {
    config = mockConfig();

    convertToImportMap = createConvertToImportMap(config);
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
});
