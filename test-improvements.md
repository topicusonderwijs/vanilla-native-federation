# Test Improvements Recommendations

## 1. Simplified Mock Factory (Alternative Approach)

```typescript
// Instead of complex MOCK_FROM_EXTERNAL, use simple builders:
const createSharedVersion = (
  tag: string, 
  remotes: string[], 
  external: string = 'test-dep'
): SharedVersion => ({
  tag,
  remotes: remotes.map(name => ({
    file: `${external}.js`,
    name,
    requiredVersion: `~${tag.substring(0, 3)}.0`,
    strictVersion: true,
    cached: false,
  })),
  host: false,
  action: 'skip',
});

const createSharedExternal = (
  versions: SharedVersion[], 
  dirty = false
): SharedExternal => ({
  dirty,
  versions,
});

// Usage becomes much cleaner:
const version = createSharedVersion('2.1.2', ['team/mfe1', 'team/mfe2']);
const external = createSharedExternal([version]);
```

## 2. Improved Functional Mock Builders

```typescript
// Simple, composable mock builders using functions
const mockRemote = (name: string, options: { 
  requiredVersion?: string; 
  strictVersion?: boolean; 
  cached?: boolean 
} = {}) => ({
  file: `${name.split('/')[1] || name}.js`,
  name,
  requiredVersion: options.requiredVersion || '~2.1.0',
  strictVersion: options.strictVersion ?? true,
  cached: options.cached ?? false,
});

const mockSharedVersion = (tag: string, remotes: string[] | Record<string, any>) => {
  const remoteList = Array.isArray(remotes) 
    ? remotes.map(name => mockRemote(name))
    : Object.entries(remotes).map(([name, opts]) => mockRemote(name, opts));
    
  return {
    tag,
    remotes: remoteList,
    host: remoteList.some(r => r.name.includes('host')) || false,
    action: 'skip' as const,
  };
};

const mockExternal = (versions: SharedVersion[], dirty = false): SharedExternal => ({
  dirty,
  versions,
});

// Convenient builder functions
const builders = {
  version: (tag: string, ...remotes: string[]) => 
    mockSharedVersion(tag, remotes),
    
  versionWithOptions: (tag: string, remotes: Record<string, any>) =>
    mockSharedVersion(tag, remotes),
    
  external: (...versions: SharedVersion[]) => 
    mockExternal(versions),
    
  dirtyExternal: (...versions: SharedVersion[]) => 
    mockExternal(versions, true),
    
  globalScope: (externals: Record<string, SharedExternal>) => ({
    [GLOBAL_SCOPE]: externals,
  }),
  
  customScope: (scopeName: string, externals: Record<string, SharedExternal>) => ({
    [scopeName]: externals,
  }),
};

// Usage becomes very clean and readable:
const storage = builders.globalScope({
  'dep-a': builders.external(
    builders.version('2.1.2', 'team/mfe1', 'team/mfe2'),
    builders.version('2.1.1', 'team/mfe3')
  ),
  'dep-b': builders.external(
    builders.versionWithOptions('2.2.1', {
      'team/mfe1': { cached: true },
      'team/mfe2': { strictVersion: false }
    })
  ),
});

// Or for simple cases:
const simpleStorage = builders.globalScope({
  'react': builders.external(builders.version('18.0.0', 'app1', 'app2')),
  'lodash': builders.dirtyExternal(builders.version('4.17.21', 'app3')),
});
```

## 3. Enhanced Unit Tests with Better Mocks

```typescript
// Test helper for setting up repository with clean syntax
const setupRepo = (initialData: Record<string, Record<string, SharedExternal>> = {}) => {
  const mockStorage = { 'shared-externals': initialData };
  const mockStorageEntry = createStorageHandlerMock(mockStorage);
  const repo = createSharedExternalsRepository({
    storage: mockStorageEntry,
    clearStorage: false,
  });
  return { repo, storage: mockStorage };
};

describe('removeFromAllScopes', () => {
  it('should remove remote and mark dirty when other remotes remain', () => {
    const { repo, storage } = setupRepo(
      builders.globalScope({
        'react': builders.external(
          builders.version('18.0.0', 'team/mfe1', 'team/mfe2')
        ),
        'lodash': builders.external(
          builders.version('4.17.21', 'team/mfe3')
        ),
      })
    );

    repo.removeFromAllScopes('team/mfe1');
    repo.commit();

    expect(storage['shared-externals']).toEqual(
      builders.globalScope({
        'react': builders.dirtyExternal(
          builders.version('18.0.0', 'team/mfe2')
        ),
        'lodash': builders.external(
          builders.version('4.17.21', 'team/mfe3')
        ),
      })
    );
  });

  it('should remove external when no remotes remain', () => {
    const { repo, storage } = setupRepo(
      builders.globalScope({
        'react': builders.external(
          builders.version('18.0.0', 'team/mfe1')
        ),
        'lodash': builders.external(
          builders.version('4.17.21', 'team/mfe2')
        ),
      })
    );

    repo.removeFromAllScopes('team/mfe1');
    repo.commit();

    expect(storage['shared-externals']).toEqual(
      builders.globalScope({
        'lodash': builders.external(
          builders.version('4.17.21', 'team/mfe2')
        ),
      })
    );
  });

  it('should handle multiple scopes', () => {
    const { repo, storage } = setupRepo({
      ...builders.globalScope({
        'react': builders.external(builders.version('18.0.0', 'team/mfe1'))
      }),
      ...builders.customScope('custom', {
        'vue': builders.external(builders.version('3.0.0', 'team/mfe1', 'team/mfe2'))
      })
    });

    repo.removeFromAllScopes('team/mfe1');
    repo.commit();

    expect(storage['shared-externals']).toEqual({
      'custom': {
        'vue': builders.dirtyExternal(builders.version('3.0.0', 'team/mfe2'))
      }
    });
  });
});
```

## 4. Real-World Test Examples

```typescript
describe('SharedExternalsRepository - Improved Tests', () => {
  describe('addOrUpdate', () => {
    it('should handle complex scenarios with clean syntax', () => {
      const { repo, storage } = setupRepo();

      // Add multiple externals with different configurations
      repo
        .addOrUpdate('react', builders.external(
          builders.version('18.0.0', 'app1', 'app2'),
          builders.version('17.0.0', 'legacy-app')
        ))
        .addOrUpdate('lodash', builders.external(
          builders.versionWithOptions('4.17.21', {
            'app1': { cached: true },
            'app3': { strictVersion: false }
          })
        ))
        .commit();

      expect(storage['shared-externals']).toMatchSnapshot();
    });
  });

  describe('integration scenarios', () => {
    it('should handle realistic micro-frontend setup', () => {
      const initialState = {
        ...builders.globalScope({
          'react': builders.external(
            builders.version('18.0.0', 'shell', 'dashboard'),
            builders.version('17.0.0', 'legacy-reports')
          ),
          '@company/shared-ui': builders.external(
            builders.version('2.1.0', 'shell', 'dashboard', 'reports')
          ),
        }),
        ...builders.customScope('feature-team-a', {
          'feature-specific-lib': builders.external(
            builders.version('1.0.0', 'feature-a-mfe1', 'feature-a-mfe2')
          )
        })
      };

      const { repo, storage } = setupRepo(initialState);

      // Simulate removing a micro-frontend
      repo.removeFromAllScopes('dashboard');
      repo.commit();

      // Verify the state is correctly updated
      const expected = {
        [GLOBAL_SCOPE]: {
          'react': builders.dirtyExternal(
            builders.version('18.0.0', 'shell'),
            builders.version('17.0.0', 'legacy-reports')
          ),
          '@company/shared-ui': builders.dirtyExternal(
            builders.version('2.1.0', 'shell', 'reports')
          ),
        },
        'feature-team-a': {
          'feature-specific-lib': builders.external(
            builders.version('1.0.0', 'feature-a-mfe1', 'feature-a-mfe2')
          )
        }
      };

      expect(storage['shared-externals']).toEqual(expected);
    });
  });
});
```

## 5. Benefits of This Approach

- **Composable**: Functions can be combined in different ways
- **Readable**: Test setup clearly shows the intent
- **Maintainable**: Changes to mock structure only require updating builder functions
- **Type-safe**: TypeScript can infer types and catch errors
- **Flexible**: Can easily add new builder functions for edge cases
- **No classes**: Pure functional approach as requested
- **Consistent**: Same pattern throughout all tests
