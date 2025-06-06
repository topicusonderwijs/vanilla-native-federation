[< back](./../README.md)

# Version Resolver

The version resolver determines how to handle dependencies when multiple micro frontends need the same externals (dependencies). It decides which dependency versions to share globally, share within specific scopes, or scope to individual remotes (micro frontends).

## Understanding Import Maps

The version resolver creates an import map from the provided remote metadata files (remoteEntry.json). Dependencies (externals) can be shared globally, shared within specific groups (shared scopes), or scoped to individual micro frontends.

### What is an Import Map?

An [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) is a JSON structure that tells the browser where to find JavaScript modules:

```javascript
{
  "imports": {
    "react": "https://cdn.example.com/react@18.2.0.js",
    "lodash": "https://cdn.example.com/lodash@4.17.21.js"
  },
  "scopes": {
    "https://legacy-mfe.example.com/": {
      "react": "https://legacy-mfe.example.com/react@17.0.2.js"
    }
  }
}
```

When your code does `import React from 'react'`, the browser uses this map to fetch the actual file.

### Only one shared version per scope

**Critical constraint**: Import maps can only specify **one version** of each dependency per scope:

```javascript
// ❌ This is NOT possible in import maps
{
  "imports": {
    "react": "https://cdn.example.com/react@18.2.0.js",
    "react": "https://cdn.example.com/react@17.0.2.js"  // Duplicate key!
  }
}
```

This limitation necessitates version resolution. When multiple micro frontends require different versions of the same dependency within a scope, only one can be shared.

### The Solution: Multiple Scope Levels

Import maps provide **scopes** and **shared scopes** as solutions for dependency management:

```javascript
{
  "imports": {
    // Global scope - most micro frontends use this
    "react": "https://cdn.example.com/react@18.2.0.js",
    "ui-library": "https://cdn.example.com/ui-lib@2.1.0.js"
  },
  "scopes": {
    // Individual micro frontend scope
    "https://legacy-mfe.example.com/": {
      "react": "https://legacy-mfe.example.com/react@17.0.2.js"
    },
    // Shared scope for a group of related micro frontends
    "https://design-system-mfe1.example.com/": {
      "ui-library": "https://design-system.example.com/ui-lib@3.0.0.js"
    },
    "https://design-system-mfe2.example.com/": {
      "ui-library": "https://design-system.example.com/ui-lib@3.0.0.js"
    }
  }
}
```

**How it works**:
- **Global sharing**: Most micro frontends use React 18.2.0 and UI Library 2.1.0
- **Individual scoping**: Legacy MFE gets its own React 17.0.2
- **Shared scope grouping**: Design system MFEs share UI Library 3.0.0 among themselves

**The trade-off**: Each additional scope requires separate downloads, but shared scopes allow optimization within groups.

## Shared vs Scoped Dependencies

In the micro-frontend's metadata file (remoteEntry.json), dependencies are marked as "externals". Every external contains configuration that determines how it should be shared.

### Shared externals (singleton: true)
Dependencies marked as `singleton: true` are candidates for sharing:

```javascript
// In remoteEntry.json
{
  "shared": [{
    "packageName": "react",
    "singleton": true,        // ← Marked for sharing
    "sharedScope": "default", // ← Optional: share in specific scope
    "version": "18.2.0",
    "requiredVersion": "^18.0.0"
  }]
}
```

**Result**: Shared within the specified scope (global if no sharedScope specified).

### Scoped externals (singleton: false)
Dependencies with `singleton: false` are always scoped to their individual remote:

```javascript
// In remoteEntry.json  
{
  "shared": [{
    "packageName": "lodash-utils",
    "singleton": false,       // ← Always individually scoped
    "version": "1.0.0"
  }]
}
```

**Result**: Each micro frontend gets its own copy, no sharing occurs.

### Shared Scope Configuration

The `sharedScope` property allows you to create groups of micro frontends that share dependencies among themselves:

```json
// Team A micro frontends - share UI components v3.x
{
  "shared": [{
    "packageName": "ui-components",
    "singleton": true,
    "sharedScope": "team-a",
    "version": "3.1.0",
    "requiredVersion": "^3.0.0"
  }]
}

// Team B micro frontends - share UI components v2.x  
{
  "shared": [{
    "packageName": "ui-components", 
    "singleton": true,
    "sharedScope": "team-b",
    "version": "2.5.0",
    "requiredVersion": "^2.0.0"
  }]
}

// Global shared dependency
{
  "shared": [{
    "packageName": "react",
    "singleton": true,
    "version": "18.2.0",
    "requiredVersion": "^18.0.0"
  }]
}
```

## Resolution Process

The resolver creates an import map based on the provided metadata (remoteEntry.json) files, processing dependencies at multiple scope levels.

### Step 1: Categorize Dependencies by Scope

```mermaid
flowchart LR
    A[Process remoteEntry.json] --> B{singleton: true?}
    B -->|Yes| C{Has sharedScope?}
    B -->|No| D[Add to individual scoped externals]
    C -->|Yes| E[Add to shared scope externals]
    C -->|No| F[Add to global shared externals]
    E --> G[Needs scope-level resolution]
    F --> H[Needs global resolution]
    D --> I[No resolution needed]
```

### Step 2: Resolve Dependencies by Scope

Dependencies are resolved separately for each scope:

```json
// Input: Multiple scopes with different versions
Global scope:
  react@18.2.0 (requires "^18.0.0", singleton: true)
  react@18.1.0 (requires "^18.0.0", singleton: true)

"team-a" scope:
  ui-lib@3.1.0 (requires "^3.0.0", singleton: true, sharedScope: "team-a")
  ui-lib@3.0.5 (requires "^3.0.0", singleton: true, sharedScope: "team-a")

"team-b" scope:  
  ui-lib@2.5.0 (requires "^2.0.0", singleton: true, sharedScope: "team-b")

Individual scopes:
  lodash@4.17.21 (singleton: false)
```

### Step 3: Resolution Algorithm

For each scope (global, shared scopes, individual), the resolver determines one version to share:

```mermaid
flowchart TD
    A[Dependencies grouped by scope] --> B[For each scope:]
    B --> C[Apply priority rules to choose shared version]
    C --> D[Assign actions to all other versions in scope]
    
    C --> C1{Host version exists in scope?}
    C1 -->|Yes| C2[Choose host version]
    C1 -->|No| C3{latestSharedExternal enabled?}
    C3 -->|Yes| C4[Choose latest version in scope]
    C3 -->|No| C5[Choose version with least incompatibilities in scope]
    
    D --> D1[For each remaining version in scope:]
    D1 --> D2{Compatible with chosen version?}
    D2 -->|Yes| D3[Action: SKIP<br/>Don't download]
    D2 -->|No| D4{strictVersion: true?}
    D4 -->|Yes| D5[Action: SCOPE<br/>Download individually]
    D4 -->|No| D6[Action: SKIP + WARN<br/>Risk compatibility issues]
```

### Step 4: Generate Import Map

The resolver creates different import map sections based on scope and actions:

```mermaid
flowchart LR
    A[Resolution Results] --> B{Scope Type}
    B -->|Global Scope + SHARE| C[Add to *imports* property]
    B -->|Shared Scope + SHARE| D[Add to scope in *scopes* property]
    B -->|SCOPE| E[Add to individual scope in *scopes*]
    B -->|SKIP| F[Omit from map]
    
    C --> G[Available to all micro frontends]
    D --> H[Available to micro frontends in shared scope]
    E --> I[Available only to specific micro frontend]
```

## Complete Example: Multi-Scope Resolution

### Input: Multiple Teams with Shared Scopes

```json
// Global MFE - React for everyone
{
  "shared": [{
    "packageName": "react",
    "version": "18.2.0",
    "requiredVersion": "^18.0.0",
    "singleton": true
  }]
}

// Team A MFE 1 - Design system v3
{
  "shared": [{
    "packageName": "design-system",
    "version": "3.1.0",
    "requiredVersion": "^3.0.0",
    "singleton": true,
    "sharedScope": "team-a"
  }]
}

// Team A MFE 2 - Design system v3
{
  "shared": [{
    "packageName": "design-system", 
    "version": "3.0.5",
    "requiredVersion": "^3.0.0",
    "singleton": true,
    "sharedScope": "team-a"
  }]
}

// Team B MFE - Design system v2 (legacy)
{
  "shared": [{
    "packageName": "design-system",
    "version": "2.8.0",
    "requiredVersion": "^2.0.0", 
    "singleton": true,
    "sharedScope": "team-b",
    "strictVersion": true
  }]
}

// Legacy MFE - Old React
{
  "shared": [{
    "packageName": "react",
    "version": "17.0.2",
    "requiredVersion": "^17.0.0",
    "singleton": true,
    "strictVersion": true
  }]
}
```

### Resolution Process

```mermaid
flowchart TD
    A[Group by scope] --> B[Global: react versions]
    A --> C[team-a: design-system versions]  
    A --> D[team-b: design-system versions]
    
    B --> E[Choose React<br/>18.2.0 → shared globally<br/>17.0.2 → individual scope]
    C --> F[Choose design-system<br/>3.1.0 → shared in team-a<br/>3.0.5 → overridden]
    D --> G[Choose design-system<br/>2.8.0 → shared in team-b]
```

### Output Import Map

```javascript
{
  "imports": {
    // Global shared - used by most micro frontends
    "react": "https://mfe1.example.com/react@18.2.0.js"
  },
  "scopes": {
    // Team A shared scope - design-system 3.x
    "https://team-a-mfe1.example.com/": {
      "design-system": "https://team-a-mfe1.example.com/design-system@3.1.0.js"
    },
    "https://team-a-mfe2.example.com/": {
      "design-system": "https://team-a-mfe1.example.com/design-system@3.1.0.js"
    },
    
    // Team B shared scope - design-system 2.x
    "https://team-b-mfe.example.com/": {
      "design-system": "https://team-b-mfe.example.com/design-system@2.8.0.js"
    },
    
    // Individual scope - incompatible React version
    "https://legacy-mfe.example.com/": {
      "react": "https://legacy-mfe.example.com/react@17.0.2.js"
    }
  }
}
```

### What Actually Downloads

- **react@18.2.0**: Downloaded once, used by all compatible micro frontends
- **react@17.0.2**: Downloaded separately for legacy MFE (incompatible, strict)
- **design-system@3.1.0**: Downloaded once, shared between Team A MFEs
- **design-system@3.0.5**: Not downloaded (skipped, compatible with 3.1.0)
- **design-system@2.8.0**: Downloaded separately for Team B (different shared scope)

## Understanding Scope Levels

### Global Scope (`__GLOBAL__`)
- **Purpose**: Dependencies shared across all micro frontends
- **Use case**: Core libraries like React, common utilities
- **Configuration**: `singleton: true` without `sharedScope`

### Shared Scopes (custom names)
- **Purpose**: Dependencies shared within a specific group of micro frontends
- **Use case**: Team-specific libraries, design systems, domain-specific tools
- **Configuration**: `singleton: true` with `sharedScope: "scope-name"`

### Individual Scopes (per micro frontend)
- **Purpose**: Dependencies used only by one micro frontend
- **Use case**: Incompatible versions, micro frontend-specific libraries
- **Configuration**: `singleton: false` or incompatible shared dependencies

## Understanding "dirty" Flag

When processing remoteEntry.json files, shared dependencies are marked as "dirty" when new versions are added or their version list changes. This signals that the dependency needs resolution within its scope.

```mermaid
sequenceDiagram
    participant Step2 as Step 2: Process RemoteEntries
    participant Storage as Storage
    participant Step3 as Step 3: Determine Versions
    
    Step2->>Storage: Add react@18.2.0 to global scope
    Storage->>Storage: Mark global react as dirty: true
    Step2->>Storage: Add ui-lib@3.1.0 to team-a scope  
    Storage->>Storage: Mark team-a ui-lib as dirty: true
    Step3->>Storage: Find all dirty dependencies in all scopes
    Storage-->>Step3: global react: dirty=true, team-a ui-lib: dirty=true
    Step3->>Step3: Resolve each scope separately
    Step3->>Storage: Mark all resolved dependencies as dirty: false
```

**Why this matters**: The dirty flag prevents unnecessary re-resolution of dependencies that haven't changed within their scope, improving performance when the same micro frontends are loaded repeatedly.

## Understanding "strictVersion"

The `strictVersion` flag applies to shared dependencies (`singleton: true`) and determines how incompatible versions are handled within each scope:

### strictVersion: false (default)

The user will be notified about the incompatible version, but the resolver will skip this version since another version was already shared in the scope.

```json
// MFE needs ui-lib ~4.16.0, but team-a scope shares 4.17.0
{
  "packageName": "ui-lib",
  "version": "4.16.5", 
  "requiredVersion": "~4.16.0",
  "singleton": true,
  "sharedScope": "team-a",
  "strictVersion": false
}

// Result: SKIP + WARNING  
// The MFE will use the shared 4.17.0 version from team-a scope
// May cause runtime compatibility issues
```

### strictVersion: true

```json
// MFE needs ui-lib ~4.16.0, but team-a scope shares 4.17.0
{
  "packageName": "ui-lib",
  "version": "4.16.5",
  "requiredVersion": "~4.16.0",
  "singleton": true,
  "sharedScope": "team-a", 
  "strictVersion": true
}

// Result: SCOPE (individual)
// The MFE gets its own ui-lib@4.16.5 download  
// Guaranteed compatibility, but extra download
```

**Note**: `strictVersion` is ignored for scoped dependencies (`singleton: false`) since they always get their own copy.

## Priority Rules Explained

### 1. Host Version Override

Host remoteEntry.json has the highest precedence within each scope. When an external version exists in the host remoteEntry.json for a specific scope, it is guaranteed chosen as the shared version for that scope.

```javascript
await initFederation(manifest, {
  hostRemoteEntry: { url: "./host-remoteEntry.json" }
});

// If host specifies react@18.0.5 globally, it wins over:
// - MFE1's react@18.2.0 (global)
// - MFE2's react@18.1.0 (global)

// If host specifies ui-lib@3.0.0 for team-a scope, it wins over:
// - Team A MFE1's ui-lib@3.1.0 (team-a scope)
// - Team A MFE2's ui-lib@3.0.5 (team-a scope)
```

### 2. Latest Version Strategy

Can be activated with the `profile.latestSharedExternal` hyperparameter. This changes the strategy within each scope from "most optimal" to "latest available" version.

```javascript
await initFederation(manifest, {
  profile: { latestSharedExternal: true }
});

// Available versions in global scope: [18.1.0, 18.2.0, 18.0.5]
// Chosen: 18.2.0 (latest in global scope)

// Available versions in team-a scope: [3.0.5, 3.1.0, 3.0.8]
// Chosen: 3.1.0 (latest in team-a scope)
```

### 3. Optimal Version Strategy (default)

**Why this is default**: Minimizes bundle size and download time by choosing the version that requires the fewest additional scoped downloads within each scope.

```json
// The resolver calculates which version minimizes extra downloads per scope:

// Global scope - if 18.2.0 is chosen:
// - 18.1.0: compatible (SKIP) → 0 extra downloads
// - 17.0.2: incompatible + strict (SCOPE) → 1 extra download
// Total cost: 1 extra download

// Team-a scope - if 3.1.0 is chosen:
// - 3.0.5: compatible (SKIP) → 0 extra downloads
// Total cost: 0 extra downloads

// Result: Choose 18.2.0 globally, 3.1.0 for team-a scope
```

### 4. Caching Strategy

The resolver optimizes for applications with page reloads. When storage like sessionStorage is chosen, shared dependencies are cached across page loads within their respective scopes:

```mermaid
sequenceDiagram
    participant Page1 as Page Load 1
    participant Resolver as Version Resolver
    participant Storage as Storage
    participant Page2 as Page Load 2
    
    Page1->>Resolver: Process dependencies by scope
    Resolver->>Storage: Mark versions as cached per scope
    Note over Storage: Global: react@18.2.0: cached=true<br/>team-a: ui-lib@3.1.0: cached=true
    
    Page2->>Resolver: Process dependencies  
    Resolver->>Storage: Check cached versions by scope
    Storage-->>Resolver: Cached versions found per scope
    Resolver->>Page2: Prioritize cached versions within scopes
```

## Configuration

### Host Remote Entry

Specify a host `remoteEntry.json` to control critical dependencies across all scopes:

```javascript
await initFederation(manifest, {
  hostRemoteEntry: {
    url: "./host-remoteEntry.json"
  }
});
```

Host dependencies can specify `sharedScope` to control specific shared scopes, or omit it to control global sharing.

### Resolution Strategy

Hyperparameters to tweak the behavior of the version resolver across all scopes:

```javascript
await initFederation(manifest, {
  // Use latest available versions in each scope
  profile: { 
    latestSharedExternal: true 
  },
  
  // Skip cached remotes for performance
  profile: { 
    skipCachedRemotes: true 
  },
  
  // Fail on version conflicts in any scope
  strict: true
});
```

### Storage Options

Choosing different storage allows the library to reuse cached externals across page loads, maintaining scope-specific optimizations:

```javascript
// In-memory only (default) - fastest, lost on page reload
storage: config.globalThisStorageEntry,

// Single session only - survives page reloads, cleared when browser closes  
storage: config.sessionStorageEntry,

// Persist across browser sessions - survives browser restarts
storage: config.localStorageEntry
```

**When to use each**:
- **globalThis**: Development or single-page visits where speed matters most
- **sessionStorage**: Multi-page applications where users navigate between pages
- **localStorage**: Frequently visited applications where long-term caching provides value

## Troubleshooting

### Version Conflicts

```json
// Error in strict mode for global scope
NFError: [dep-a] Shared version 2.0.0 is not compatible with range '^1.0.0'

// Error in strict mode for shared scope
NFError: ShareScope external team-a.dep-a has multiple shared versions.

// Solutions:
// 1. Loosen the version constraints in the remoteEntry.json
// 2. Use host override for the dependency in the specific scope
// 3. Disable strict mode
// 4. Move conflicting dependencies to different shared scopes
```

### Shared Scope Issues

```json
// Warning for shared scope with no shared versions
Warning: ShareScope external team-a.dep-a has no shared versions.

// All versions in the shared scope will be individually scoped
// Consider reviewing version compatibility or shared scope assignments
```

## Semver Compatibility

The resolver uses [standard semantic versioning rules](https://www.npmjs.com/package/semver) within each scope:

| Range | Matches | Examples |
|-------|---------|----------|
| `^1.2.3` | Compatible changes | `1.2.4`, `1.3.0`, `1.9.9` |
| `~1.2.3` | Patch-level changes | `1.2.4`, `1.2.9` |
| `>=1.2.3` | Greater than or equal | `1.2.3`, `2.0.0` |
| `1.2.3` | Exact version | `1.2.3` only |

Pre-release versions are only compatible with the same pre-release range within the same scope.