import { ExternalsScope, SharedExternal, SharedVersion, shareScope } from 'lib/1.domain';

// Simple, composable mock buildMockVersion using functions
const mockRemote = (
  name: string,
  external: string = 'test-dep',
  options: {
    requiredVersion?: string;
    strictVersion?: boolean;
    cached?: boolean;
    host?: boolean;
  } = {}
) => ({
  file: `${external}.js`,
  name,
  requiredVersion: options.requiredVersion || '~2.1.0',
  strictVersion: options.strictVersion ?? true,
  cached: options.cached ?? false,
});

const mockSharedVersion = (
  tag: string,
  remotes: string[] | Record<string, any>,
  external: string = 'test-dep'
): SharedVersion => {
  const remoteList = Array.isArray(remotes)
    ? remotes.map(name =>
        mockRemote(name, external, { requiredVersion: `~${tag.substring(0, 3)}.0` })
      )
    : Object.entries(remotes).map(([name, opts]) =>
        mockRemote(name, external, {
          requiredVersion: `~${tag.substring(0, 3)}.0`,
          ...opts,
        })
      );

  return {
    tag,
    remotes: remoteList,
    host:
      remoteList.some(r => r.name.includes('host')) ||
      Object.values(remotes).some((opts: any) => opts?.host) ||
      false,
    action: 'skip',
  };
};

const mockScopedVersion = (tag: string, external: string = 'test-dep') => ({
  tag,
  file: `${external}.js`,
});

const mockExternal = (versions: SharedVersion[], dirty = false): SharedExternal => ({
  dirty,
  versions,
});

export const buildMockVersion = {
  version: (tag: string, external: string, ...remotes: string[]) =>
    mockSharedVersion(tag, remotes, external),

  versionWithOptions: (tag: string, external: string, remotes: Record<string, any>) =>
    mockSharedVersion(tag, remotes, external),

  scopedVersion: (tag: string, external: string) => mockScopedVersion(tag, external),

  external: (versions: SharedVersion[], dirty = false) => mockExternal(versions, dirty),

  dirtyExternal: (versions: SharedVersion[]) => mockExternal(versions, true),

  globalScope: (externals: Record<string, SharedExternal>) => ({
    __GLOBAL__: externals,
  }),

  customScope: (scopeName: string, externals: Record<string, SharedExternal>) => ({
    [scopeName]: externals,
  }),

  v2_1_1: (external: string, remotes: string[] | Record<string, any>) =>
    mockSharedVersion('2.1.1', remotes, external),

  v2_1_2: (external: string, remotes: string[] | Record<string, any>) =>
    mockSharedVersion('2.1.2', remotes, external),

  v2_1_3: (external: string, remotes: string[] | Record<string, any>) =>
    mockSharedVersion('2.1.3', remotes, external),

  v2_2_1: (external: string, remotes: string[] | Record<string, any>) =>
    mockSharedVersion('2.2.1', remotes, external),

  v2_2_2: (external: string, remotes: string[] | Record<string, any>) =>
    mockSharedVersion('2.2.2', remotes, external),

  scoped1_2_3: (external: string) => mockScopedVersion('1.2.3', external),
  scoped1_2_4: (external: string) => mockScopedVersion('1.2.4', external),
};

// Pre-built common externals using the new buildMockVersion
export const mockExternalA = (): SharedExternal =>
  buildMockVersion.external([
    buildMockVersion.v2_1_2('dep-a', ['team/mfe1', 'team/mfe2']),
    buildMockVersion.v2_1_1('dep-a', ['team/mfe3']),
  ]);

export const mockExternalB = (): SharedExternal =>
  buildMockVersion.external([
    buildMockVersion.v2_2_2('dep-b', ['team/mfe1']),
    buildMockVersion.v2_1_2('dep-b', ['team/mfe2']),
    buildMockVersion.v2_1_1('dep-b', ['team/mfe3']),
  ]);

export const mockExternalC = (): SharedExternal =>
  buildMockVersion.external([
    buildMockVersion.v2_2_2('dep-c', ['team/mfe1']),
    buildMockVersion.v2_2_1('dep-c', { 'team/mfe2': {}, host: { host: true } }),
  ]);

export const mockExternalD = (): SharedExternal =>
  buildMockVersion.external([buildMockVersion.v2_2_2('dep-d', ['team/mfe1', 'team/mfe2'])]);

export const mockSharedExternals = (): shareScope => ({
  'dep-a': mockExternalA(),
  'dep-b': mockExternalB(),
  'dep-c': mockExternalC(),
});

export const MOCK_SCOPED_EXTERNALS_SCOPE = (): ExternalsScope => ({
  'dep-a': buildMockVersion.scoped1_2_3('dep-a'),
  'dep-b': buildMockVersion.scoped1_2_4('dep-b'),
});
