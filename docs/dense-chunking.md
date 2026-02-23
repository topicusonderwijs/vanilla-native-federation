[< back](./../README.md)

# Dense Chunking

Dense chunking is an optional optimization feature that reduces the size of `remoteEntry.json` metadata files by representing internal chunks more efficiently.

> **Availability**: This feature requires `@softarc/native-federation` v4 or later.

## Background: Bundles in Native Federation

When native-federation builds shared externals, it groups them into **bundles**. There are three bundle types:

| Bundle Type      | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `browser-shared` | All browser-platform externals with default build settings |
| `node-shared`    | All node-platform externals with default build settings    |
| `<package>`      | Separate bundle for a specific package or entrypoint       |

Each shared external has a `bundle` property that links it to the bundle it belongs to. When esbuild compiles these bundles, it may produce additional **chunks** (code-split files) that need to be loaded alongside the main entry point.

## The Problem

Traditionally, these chunks are stored in the `shared` array with placeholder metadata that isn't actually used for version resolution:

```json
{
  "shared": [
    {
      "packageName": "@angular/core",
      "bundle": "browser-shared",
      "outFileName": "_angular_core.aKpa5DEeTZ.js",
      "requiredVersion": "^21.0.6",
      "singleton": true,
      "strictVersion": true,
      "version": "21.1.2"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-EQQVH5C2",
      "outFileName": "chunk-EQQVH5C2.js"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-HVMJPCNQ",
      "outFileName": "chunk-HVMJPCNQ.js"
    }
  ]
}
```

Each chunk entry adds ~150-200 bytes of redundant information. For micro frontends with many chunks, this overhead becomes significant and adds unnecessary network payload.

## The Solution

Dense chunking moves internal chunks into a dedicated `chunks` property, storing only the essential information - the file names. The chunks are grouped by **bundle name**, allowing the orchestrator to load all necessary chunks when an external from that bundle is used:

```json
{
  "shared": [
    {
      "packageName": "@angular/core",
      "bundle": "browser-shared",
      "outFileName": "_angular_core.aKpa5DEeTZ.js",
      "requiredVersion": "^21.0.6",
      "singleton": true,
      "strictVersion": true,
      "version": "21.1.2"
    }
  ],
  "chunks": {
    "browser-shared": ["chunk-EQQVH5C2.js", "chunk-HVMJPCNQ.js", "chunk-LB7AFJXW.js"]
  }
}
```

The `bundle` property in `SharedInfo` links the external to its bundle, and the `chunks` property maps each bundle name to its associated chunk files.

## Comparison

### Before (Standard Format)

```json
{
  "name": "mfe1",
  "shared": [
    {
      "packageName": "@angular/core",
      "bundle": "browser-shared",
      "outFileName": "_angular_core.aKpa5DEeTZ.js",
      "requiredVersion": "^21.0.6",
      "singleton": true,
      "strictVersion": true,
      "version": "21.1.2"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-EQQVH5C2",
      "outFileName": "chunk-EQQVH5C2.js"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-HVMJPCNQ",
      "outFileName": "chunk-HVMJPCNQ.js"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-LB7AFJXW",
      "outFileName": "chunk-LB7AFJXW.js"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-4S4UYKYK",
      "outFileName": "chunk-4S4UYKYK.js"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-R6YY52B7",
      "outFileName": "chunk-R6YY52B7.js"
    },
    {
      "singleton": false,
      "strictVersion": false,
      "version": "0.0.0",
      "requiredVersion": "0.0.0",
      "packageName": "@nf-internal/chunk-2VMXMS7J",
      "outFileName": "chunk-2VMXMS7J.js"
    }
  ],
  "exposes": [
    {
      "key": "./Component",
      "outFileName": "Component-BCWQYIKG.js"
    }
  ]
}
```

### After (Dense Chunking)

```json
{
  "name": "mfe1",
  "shared": [
    {
      "packageName": "@angular/core",
      "bundle": "browser-shared",
      "outFileName": "_angular_core.aKpa5DEeTZ.js",
      "requiredVersion": "^21.0.6",
      "singleton": true,
      "strictVersion": true,
      "version": "21.1.2"
    }
  ],
  "chunks": {
    "browser-shared": [
      "chunk-EQQVH5C2.js",
      "chunk-HVMJPCNQ.js",
      "chunk-LB7AFJXW.js",
      "chunk-4S4UYKYK.js",
      "chunk-R6YY52B7.js",
      "chunk-2VMXMS7J.js"
    ]
  },
  "exposes": [
    {
      "key": "./Component",
      "outFileName": "Component-BCWQYIKG.js"
    }
  ]
}
```

In this example, the metadata size is reduced by approximately **70%** for the chunk-related data.

## RemoteEntry Schema

When using dense chunking, the `remoteEntry.json` includes an additional `chunks` property:

```typescript
interface FederationInfo {
  name: string;
  exposes: ExposesInfo[];
  shared: SharedInfo[];
  chunks?: Record<string, string[]>; // Optional - for dense chunking
}
```

### Chunks Property

| Property | Type                       | Description                                                                             |
| -------- | -------------------------- | --------------------------------------------------------------------------------------- |
| chunks   | `Record<string, string[]>` | Maps bundle names (e.g., `browser-shared`, `node-shared`) to arrays of chunk filenames. |

The `SharedInfo.bundle` property links each external to its bundle, allowing the orchestrator to look up the associated chunks.

## Compatibility

Dense chunking is fully **optional** and **backwards compatible**:

- **No changes required**: Existing `remoteEntry.json` files without the `chunks` property continue to work normally.
- **Mixed environments**: Remote entries with and without dense chunking can be used together in the same host application.
- **Transparent to the orchestrator**: The orchestrator automatically detects and handles both formats.

## Enabling Dense Chunking

Dense chunking is a build-time optimization introduced in **native-federation v4**. Enable it in your native-federation build configuration.

> **Note**: Consult your native-federation builder documentation for the specific configuration option to enable dense chunking during builds.
