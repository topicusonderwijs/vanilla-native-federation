import { ExternalsScope, SharedExternal, SharedVersion, shareScope } from 'lib/1.domain';

// Simple, composable mock builders using functions
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
    ? remotes.map(name => mockRemote(name, external, { requiredVersion: `~${tag.substring(0, 3)}.0` }))
    : Object.entries(remotes).map(([name, opts]) => 
        mockRemote(name, external, { 
          requiredVersion: `~${tag.substring(0, 3)}.0`, 
          ...opts 
        })
      );
    
  return {
    tag,
    remotes: remoteList,
    host: remoteList.some(r => r.name.includes('host')) || 
          Object.values(remotes).some((opts: any) => opts?.host) || false,
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

// Convenient builder functions
export const builders = {
  // Basic version builders
  version: (tag: string, external: string, ...remotes: string[]) => 
    mockSharedVersion(tag, remotes, external),
    
  versionWithOptions: (tag: string, external: string, remotes: Record<string, any>) =>
    mockSharedVersion(tag, remotes, external),

  scopedVersion: (tag: string, external: string) =>
    mockScopedVersion(tag, external),
    
  // External builders  
  external: (versions: SharedVersion[], dirty = false) => 
    mockExternal(versions, dirty),
    
  dirtyExternal: (versions: SharedVersion[]) => 
    mockExternal(versions, true),
    
  // Scope builders
  globalScope: (externals: Record<string, SharedExternal>) => ({
    '__GLOBAL__': externals,
  }),
  
  customScope: (scopeName: string, externals: Record<string, SharedExternal>) => ({
    [scopeName]: externals,
  }),

  // Convenience methods for common versions
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

  // Scoped versions for backward compatibility
  scoped1_2_3: (external: string) => mockScopedVersion('1.2.3', external),
  scoped1_2_4: (external: string) => mockScopedVersion('1.2.4', external),
};

// Legacy compatibility - keep MOCK_FROM_EXTERNAL for backward compatibility during transition
export const MOCK_FROM_EXTERNAL = (external: string) => ({
  SCOPED_VERSION_1_2_3: () => builders.scoped1_2_3(external),
  SCOPED_VERSION_1_2_4: () => builders.scoped1_2_4(external),
  SHARED_VERSION_2_1_1: (remotes: Record<string, any>) => builders.v2_1_1(external, remotes),
  SHARED_VERSION_2_1_2: (remotes: Record<string, any>) => builders.v2_1_2(external, remotes),
  SHARED_VERSION_2_1_3: (remotes: Record<string, any>) => builders.v2_1_3(external, remotes),
  SHARED_VERSION_2_2_1: (remotes: Record<string, any>) => builders.v2_2_1(external, remotes),
  SHARED_VERSION_2_2_2: (remotes: Record<string, any>) => builders.v2_2_2(external, remotes),
});

// Pre-built common externals using the new builders
export const MOCK_DEP_A = (): SharedExternal => 
  builders.external([
    builders.v2_1_2('dep-a', ['team/mfe1', 'team/mfe2']),
    builders.v2_1_1('dep-a', ['team/mfe3']),
  ]);

export const MOCK_DEP_B = (): SharedExternal => 
  builders.external([
    builders.v2_2_2('dep-b', ['team/mfe1']),
    builders.v2_1_2('dep-b', ['team/mfe2']),
    builders.v2_1_1('dep-b', ['team/mfe3']),
  ]);

export const MOCK_DEP_C = (): SharedExternal => 
  builders.external([
    builders.v2_2_2('dep-c', ['team/mfe1']),
    builders.v2_2_1('dep-c', { 'team/mfe2': {}, 'host': { host: true } }),
  ]);

export const MOCK_DEP_D = (): SharedExternal => 
  builders.external([
    builders.v2_2_2('dep-d', ['team/mfe1', 'team/mfe2'])
  ]);

export const MOCK_SHARED_EXTERNALS_SHARESCOPE = (): shareScope => ({
  'dep-a': MOCK_DEP_A(),
  'dep-b': MOCK_DEP_B(),
  'dep-c': MOCK_DEP_C(),
});

export const MOCK_SCOPED_EXTERNALS_SCOPE = (): ExternalsScope => ({
  'dep-a': builders.scoped1_2_3('dep-a'),
  'dep-b': builders.scoped1_2_4('dep-b'),
});
