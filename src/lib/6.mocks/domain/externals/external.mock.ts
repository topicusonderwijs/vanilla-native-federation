import { ExternalsScope, SharedExternal, SharedVersion, shareScope } from 'lib/1.domain';

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

export const mockVersion = {
  v: (tag: string, external: string, remotes: string[] | Record<string, any>) =>
    mockSharedVersion(tag, remotes, external),

  scopedV: (tag: string, external: string) => mockScopedVersion(tag, external),

  external: (versions: SharedVersion[], o = { dirty: true }) => mockExternal(versions, o.dirty),

  globalScope: (externals: Record<string, SharedExternal>) => ({
    __GLOBAL__: externals,
  }),

  customScope: (scopeName: string, externals: Record<string, SharedExternal>) => ({
    [scopeName]: externals,
  }),
};

export const mockExternalA = (): SharedExternal =>
  mockVersion.external([
    mockVersion.v('2.1.2', 'dep-a', ['team/mfe1', 'team/mfe2']),
    mockVersion.v('2.1.1', 'dep-a', ['team/mfe3']),
  ]);

export const mockExternalB = (): SharedExternal =>
  mockVersion.external([
    mockVersion.v('2.2.2', 'dep-b', ['team/mfe1']),
    mockVersion.v('2.1.2', 'dep-b', ['team/mfe2']),
    mockVersion.v('2.1.1', 'dep-b', ['team/mfe3']),
  ]);

export const mockExternalC = (): SharedExternal =>
  mockVersion.external([
    mockVersion.v('2.2.2', 'dep-c', ['team/mfe1']),
    mockVersion.v('2.2.1', 'dep-c', { 'team/mfe2': {}, host: { host: true } }),
  ]);

export const mockExternalD = (): SharedExternal =>
  mockVersion.external([mockVersion.v('2.2.2', 'dep-d', ['team/mfe1', 'team/mfe2'])]);

export const mockSharedExternals = (): shareScope => ({
  'dep-a': mockExternalA(),
  'dep-b': mockExternalB(),
  'dep-c': mockExternalC(),
});

export const MOCK_SCOPED_EXTERNALS_SCOPE = (): ExternalsScope => ({
  'dep-a': mockVersion.scopedV('1.2.3', 'dep-a'),
  'dep-b': mockVersion.scopedV('1.2.4', 'dep-b'),
});
