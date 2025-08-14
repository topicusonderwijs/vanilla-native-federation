[< back](./../README.md)

# native-federation configuration

The `vanilla-native-federation` library supports a multitude of different configuration settings. The configuration objects are intended to provide more fine-grained control over the behavior of the `vanilla-native-federation` library.

The configuration is divided into 5 sections

1. [Host related configuration](#hostConfig)
2. [ImportMap implementations and polyfilling](#importMapConfig)
3. [Logging](#loggingConfig)
4. [Modes (strictness and external resolving settings)](#modeConfig)
5. [Storage](#storageConfig)

## <a id="hostConfig"></a> 1. Host configuration

The `hostRemoteEntry` configuration is meant for adding a host remoteEntry file which receives priority during the determine-shared-versions step. That is, when an external version is defined in the host remoteEntry.json file, it will be guaranteed the shared version. The goal of the cachetag is to avoid caching the remoteEntry.json file.

```javascript
export type HostOptions = {
    hostRemoteEntry?: string | false | {
        name?: string,
        url: string,
        cacheTag?: string
    }
}
```

### Options:

| Option          | Default | Description                                               |
| --------------- | ------- | --------------------------------------------------------- |
| hostRemoteEntry | `false` | Allows for the inclusion of a host remoteEntry.json file. |

### Example

```javascript
import { initFederation } from 'vanilla-native-federation';

initFederation('http://example.org/manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
});
```

## <a id="importMapConfig"></a> 2. ImportMap configuration

The native-federation library uses importmaps under the hood for module resolving. Since importmaps are a [relatively new feature of browsers](https://caniuse.com/import-maps), it might be a good idea to use a polyfill that is guaranteed to work, also in older browsers. There are 2 options supported: default and [es-module-shims](https://www.npmjs.com/package/es-module-shims/v/1.0.1).

```javascript
export type ImportMapOptions = {
    loadModuleFn?: (url: string) => Promise<unknown>
    replaceImportMap?: (importMap: ImportMap, opts?: { override?: boolean }) => Promise<ImportMap>
}
```

### Options:

| Option           | Default                     | Description                                                                                                   |
| ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| replaceImportMap | `replaceInDOM("importmap")` | The function that adds the importmap to the host, by default this is the DOM.                                 |
| loadModuleFn     | `url => import(url)`        | This function can mock or alter the 'import' function, necessary for libraries that shim the import function. |

### Example

```javascript
import 'es-module-shims';
import { initFederation } from 'vanilla-native-federation';
import { useShimImportMap, useDefaultImportMap } from 'vanilla-native-federation/options';

initFederation('http://example.org/manifest.json', {
  // Option 1: Using es-module-shims
  ...useShimImportMap({ shimMode: true }),

  // Option 2: Using the default importmap
  ...useDefaultImportMap(),
});
```

## <a id="loggingConfig"></a> 3. Logging configuration

Allows for the configuration and specificity of logging. Additionally, a custom logger can be defined.

```javascript
export type LoggingOptions = {
    logger?: Logger,
    logLevel?: "debug"|"warn"|"error",
}
```

### Options:

| Option   | Default      | Description                                                                                                                                                                                              |
| -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| logger   | `noopLogger` | The logger is an object that returns a callback per logging type. This way, a custom log implementation can be provided next to the 2 integrated loggers `noopLogger` and `consoleLogger`.               |
| logLevel | `"error"`    | There are currently three loglevels, every loglevel will allow the logging of the specified level including all levels with a higher priority, e.g. `warn` will allow the logging of `warn` and `error`. |

### Example

```javascript
import { initFederation } from 'vanilla-native-federation';
import { noopLogger, consoleLogger } from 'vanilla-native-federation/options';

initFederation('http://example.org/manifest.json', {
  logLevel: 'debug',

  // Option 1: noopLogger
  logger: noopLogger,

  // Option 2: consoleLogger
  logger: consoleLogger,
});
```

## <a id="modeConfig"></a> 4. ModeConfig

The mode config focusses on the way the library behaves, especially when resolving shared externals. The options are meant as hyperparameters to tweak the strictness of native-federation.

```javascript
export type ModeOptions = {
    strict?: boolean,
    profile?: ModeProfileConfig
}
```

### Options:

| Option                                    | Default     | Description                                                                                                                                                                                                                                                                         |
| ----------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| strict                                    | `false`     | When enabled, the init function will throw an error if a remoteEntry could not be fetched or a version incompatibility within a shared external occurs.                                                                                                                             |
| profile.latestSharedExternal              | `false`     | When enabled, the version resolver will prioritize using the latest version of a shared external over the most optimal version.                                                                                                                                                     |
| profile.overrideCachedRemotes             | `init-only` | When enabled, the library will override the cached remotes. The default behavior is to check if the remoteName is in the cache and the remoteEntry url differs from cached remoteEntry url (scopeUrl + "remoteEntry.json) . Available options are `never`, `init-only` and `always` |
| profile.overrideCachedRemotesIfURLMatches | `false`     | When enabled, the library will override the cached remote, even if the remoteName already exists in cache and the remoteEntry.json URL matches the cached remoteEntry.json url.                                                                                                     |

### Example

```javascript
import { initFederation } from 'vanilla-native-federation';
import { defaultProfile, cachingProfile } from 'vanilla-native-federation/options';

initFederation('http://example.org/manifest.json', {
  strict: true,
  profile: cachingProfile, // { latestSharedExternal: false, overrideCachedRemotes: 'never', overrideCachedRemotesIfURLMatches: false }
});
```

## <a id="storageConfig"></a> 5. StorageConfig

The library stores the current state by default in the globalThis object, it is possible to provide a custom storage or switch to localStorage or sessionStorage.

```javascript
type StorageOptions = {
    storage?: StorageEntryCreator,
    clearStorage?: boolean,
    storageNamespace?: string,
}
```

### Options:

| Option           | Default                   | Description                                                                                                                           |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| storage          | `globalThisStorageEntry`  | Allows the provision of a custom storage implementation.                                                                              |
| clearStorage     | `false`                   | When enabled, the initFederation function will clear the current cache/storage before initializing the remoteEntries.                 |
| storageNamespace | `"__NATIVE_FEDERATION__"` | The namespace under which the cache will be stored. e.g. remotes will be stored under `__NATIVE_FEDERATION__.remotes` in localStorage |

### Example

```javascript
import { initFederation } from 'vanilla-native-federation';
import {
  globalThisStorageEntry,
  localStorageEntry,
  sessionStorageEntry,
} from 'vanilla-native-federation/options';

initFederation('http://example.org/manifest.json', {
  clearStorage: true,
  storageNamespace: '__custom_namespace__',

  // Option 1: globalThis
  storage: globalThisStorageEntry,

  // Option 2: localStorage
  storage: localStorageEntry,

  // Option 3: sessionStorage
  storage: sessionStorageEntry,
});
```
