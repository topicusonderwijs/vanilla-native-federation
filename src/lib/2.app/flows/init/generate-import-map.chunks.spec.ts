import { ForGeneratingImportMap } from '../../driver-ports/init/for-generating-import-map';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createGenerateImportMap } from './generate-import-map';
import { LoggingConfig } from '../../config/log.contract';
import { ModeConfig } from '../../config/mode.contract';
import { Optional } from 'lib/utils/optional';
import { RemoteInfo } from 'lib/1.domain';
import { mockConfig } from 'lib/6.mocks/config.mock';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import {
  mockRemoteInfo_MFE1,
  mockRemoteInfo_MFE2,
} from 'lib/6.mocks/domain/remote-info/remote-info.mock';
import { mockExternal_A, mockExternal_B } from 'lib/6.mocks/domain/externals/external.mock';
import { mockVersion_A, mockVersion_B } from 'lib/6.mocks/domain/externals/version.mock';
import { mockScopeUrl_MFE1 } from 'lib/6.mocks/domain/scope-url.mock';

describe('createGenerateImportMap (chunk-imports)', () => {
  let generateImportMap: ForGeneratingImportMap;
  let adapters: Pick<
    DrivingContract,
    'remoteInfoRepo' | 'scopedExternalsRepo' | 'sharedExternalsRepo' | 'sharedChunksRepo'
  >;
  let config: LoggingConfig & ModeConfig;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    adapters.remoteInfoRepo.getAll = jest.fn(() => ({}));
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({}));
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({}));
    adapters.sharedExternalsRepo.getScopes = jest.fn(() => []);
    adapters.sharedChunksRepo.tryGet = jest.fn(() => Optional.empty());
    adapters.remoteInfoRepo.tryGet = jest.fn(remote => {
      if (remote === 'team/mfe1') return Optional.of(mockRemoteInfo_MFE1({ exposes: [] }));
      if (remote === 'team/mfe2') return Optional.of(mockRemoteInfo_MFE2({ exposes: [] }));
      return Optional.empty<RemoteInfo>();
    });

    generateImportMap = createGenerateImportMap(config, adapters);
  });

  it('should not add chunk imports when no bundles are registered', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [mockVersion_A.v2_1_1({ action: 'share', remotes: ['team/mfe1'] })],
      }),
    }));

    const actual = await generateImportMap();

    expect(adapters.sharedChunksRepo.tryGet).not.toHaveBeenCalled();
    expect(actual.imports['@nf-internal/shared-chunk']).toBeUndefined();
  });

  it('should add chunk imports for shared externals with bundle', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_1({
            action: 'share',
            remotes: { 'team/mfe1': { bundle: 'shared' } },
          }),
        ],
      }),
    }));
    adapters.sharedChunksRepo.tryGet = jest.fn((remote, bundle) => {
      if (remote === 'team/mfe1' && bundle === 'shared') {
        return Optional.of(['shared-chunk.js', 'utils-chunk.js']);
      }
      return Optional.empty();
    });

    const actual = await generateImportMap();

    expect(adapters.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe1', 'shared');
    expect(actual.scopes).toEqual({
      [mockScopeUrl_MFE1()]: {
        '@nf-internal/shared-chunk': mockScopeUrl_MFE1({ file: 'shared-chunk.js' }),
        '@nf-internal/utils-chunk': mockScopeUrl_MFE1({ file: 'utils-chunk.js' }),
      },
    });
  });

  it('should add chunk imports for multiple bundles from same remote', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_1({
            action: 'share',
            remotes: { 'team/mfe1': { bundle: 'shared' } },
          }),
        ],
      }),
      'dep-b': mockExternal_B({
        dirty: false,
        versions: [
          mockVersion_B.v2_1_1({
            action: 'share',
            remotes: { 'team/mfe1': { bundle: 'vendor' } },
          }),
        ],
      }),
    }));
    adapters.sharedChunksRepo.tryGet = jest.fn((remote, bundle) => {
      if (remote === 'team/mfe1' && bundle === 'shared') {
        return Optional.of(['shared-chunk.js']);
      }
      if (remote === 'team/mfe1' && bundle === 'vendor') {
        return Optional.of(['vendor-chunk.js']);
      }
      return Optional.empty();
    });

    const actual = await generateImportMap();

    expect(adapters.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe1', 'shared');
    expect(adapters.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe1', 'vendor');

    expect(actual.scopes).toEqual({
      [mockScopeUrl_MFE1()]: {
        '@nf-internal/shared-chunk': mockScopeUrl_MFE1({ file: 'shared-chunk.js' }),
        '@nf-internal/vendor-chunk': mockScopeUrl_MFE1({ file: 'vendor-chunk.js' }),
      },
    });
  });

  it('should add chunk imports for bundles from multiple remotes', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_2({
            action: 'share',
            remotes: { 'team/mfe1': { bundle: 'shared' } },
          }),
          mockVersion_A.v2_1_1({
            action: 'skip',
            remotes: { 'team/mfe2': { bundle: 'shared' } },
          }),
        ],
      }),
    }));
    adapters.sharedChunksRepo.tryGet = jest.fn((remote, bundle) => {
      if (remote === 'team/mfe1' && bundle === 'shared') {
        return Optional.of(['mfe1-chunk.js']);
      }
      if (remote === 'team/mfe2' && bundle === 'shared') {
        return Optional.of(['mfe2-chunk.js']);
      }
      return Optional.empty();
    });

    const actual = await generateImportMap();

    expect(adapters.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe1', 'shared');
    expect(actual.scopes).toEqual({
      [mockScopeUrl_MFE1()]: {
        '@nf-internal/mfe1-chunk': mockScopeUrl_MFE1({ file: 'mfe1-chunk.js' }),
      },
    });
  });

  it('should handle chunk files with .mjs extension', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_1({
            action: 'share',
            remotes: { 'team/mfe1': { bundle: 'shared' } },
          }),
        ],
      }),
    }));
    adapters.sharedChunksRepo.tryGet = jest.fn(() => Optional.of(['shared-chunk.mjs']));

    const actual = await generateImportMap();

    expect(actual.scopes?.[mockScopeUrl_MFE1()]?.['@nf-internal/shared-chunk']).toBe(
      mockScopeUrl_MFE1({ file: 'shared-chunk.mjs' })
    );
  });

  it('should handle chunk files with .cjs extension', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_1({
            action: 'share',
            remotes: { 'team/mfe1': { bundle: 'shared' } },
          }),
        ],
      }),
    }));
    adapters.sharedChunksRepo.tryGet = jest.fn(() => Optional.of(['shared-chunk.cjs']));

    const actual = await generateImportMap();

    expect(actual.scopes?.[mockScopeUrl_MFE1()]?.['@nf-internal/shared-chunk']).toBe(
      mockScopeUrl_MFE1({ file: 'shared-chunk.cjs' })
    );
  });

  it('should add chunk imports for scoped externals with bundle', async () => {
    adapters.scopedExternalsRepo.getAll = jest.fn(() => ({
      'team/mfe1': {
        'dep-a': { tag: '1.0.0', file: 'dep-a.js', bundle: 'scoped' },
      },
    }));
    adapters.sharedChunksRepo.tryGet = jest.fn((remote, bundle) => {
      if (remote === 'team/mfe1' && bundle === 'scoped') {
        return Optional.of(['scoped-chunk.js']);
      }
      return Optional.empty();
    });

    const actual = await generateImportMap();

    expect(adapters.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe1', 'scoped');
    expect(actual.scopes?.[mockScopeUrl_MFE1()]?.['@nf-internal/scoped-chunk']).toBe(
      mockScopeUrl_MFE1({ file: 'scoped-chunk.js' })
    );
  });

  it('should handle empty chunks array from repository', async () => {
    adapters.sharedExternalsRepo.getFromScope = jest.fn(() => ({
      'dep-a': mockExternal_A({
        dirty: false,
        versions: [
          mockVersion_A.v2_1_1({
            action: 'share',
            remotes: { 'team/mfe1': { bundle: 'shared' } },
          }),
        ],
      }),
    }));
    adapters.sharedChunksRepo.tryGet = jest.fn(() => Optional.of([]));

    const actual = await generateImportMap();

    expect(adapters.sharedChunksRepo.tryGet).toHaveBeenCalledWith('team/mfe1', 'shared');
    // No chunk imports should be added
    expect(Object.keys(actual.imports).filter(k => k.startsWith('@nf-internal/'))).toHaveLength(0);
  });
});
