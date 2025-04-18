
# native-federation configuration

The `vanilla-native-federation` library supports a multitude of different configuration settings. This allows for applying custom storage or logging options. 

## Index

1. [Host](#hostConfig)
2. [ImportMap](#importMapConfig)
3. [Logging](#loggingConfig)
4. [Modes](#modeConfig)
5. [Storage](#storageConfig)

## <a id="hostConfig"></a>  1. Host configuration

The `hostRemoteEntry` configuration is meant for adding a host remoteEntry file which receives priority during the determine-shared-versions step. That is, when an external version is defined in the host remoteEntry.json file, it will be guaranteed the shared version. The goal of the cachetag is to avoid caching the remoteEntry.json file.

```
export type HostOptions = {
    hostRemoteEntry?: false|{
        url: string,
        cacheTag?: string
    }
}
```

### Options:

| Option | Default | Description |
| --- | --- | --- |
| hostRemoteEntry | `false` | Allows for the inclusion of a host remoteEntry.json file. |

### Example

```
import { initFederation, config } from 'vanilla-native-federation';

initFederation("http://example.org/manifest.json", {
    hostRemoteEntry: { url: "./remoteEntry.json" }
});

```

##  <a id="importMapConfig"></a> 2. ImportMap configuration

The native-federation library uses importmaps under the hood for module resolving. Since importmaps are a [relatively new feature of browsers](https://caniuse.com/import-maps), it might be a good idea to use a polyfill that is guaranteed to work, also in older browsers. There are 3 options supported: default, [es-module-shims](https://www.npmjs.com/package/es-module-shims/v/1.0.1) and systemJS.

```
export type ImportMapOptions = {
    importMapType?: string,
    loadModuleFn?: (url: string) => unknown
}
```

### Options:

| Option | Default | Description |
| --- | --- | --- |
| importMapType | `"importmap"` | The final type of the importmap script tag.  | 
| loadModuleFn |  `url => import(url)` | This function can mock or alter the 'import' function, necessary for libraries that shim the import function. |



### Example

```
import 'es-module-shims';
import { initFederation, config } from 'vanilla-native-federation';

initFederation("http://example.org/manifest.json", {
    // Option 1: Using es-module-shims
    ...config.useImportMapShim({shimMode: true}),

    // Option 2: Using the default importmap
    ...config.useDefaultImportMap(),

    // Option 3: Using systemJS
    ...config.useSystemJSImportMap()
});
```

## <a id="loggingConfig"></a> 3. Logging configuration

Allows for the configuration and specificity of logging. Additionally, a custom logger can be defined.

```
export type LoggingOptions = {
    logger?: LogHandler,
    logLevel?: "debug"|"warn"|"error",
}
```

### Options:

| Option | Default | Description |
| --- | --- | --- |
| logger | `noopLogger` | The logger is an object that returns a callback per logging type. This way, a custom log implementation can be provided next to the 2 integrated loggers `noopLogger` and `consoleLogger`. |
| logLevel | `"error"` | There are currently three loglevels, every loglevel will allow the logging of the specified level including all levels with a higher priority, e.g. `warn` will allow the logging of `warn` and `error`. 


### Example

```
import { initFederation, config } from 'vanilla-native-federation';

initFederation("http://example.org/manifest.json", {
    logLevel: "debug",

    // Option 1: noopLogger
    logger: config.noopLogger,

    // Option 2: consoleLogger
    logger: config.consoleLogger,
});
```

## <a id="modeConfig"></a>  4. ModeConfig

The mode config focusses on the way the library behaves, especially when resolving shared externals. The options are meant as hyperparameters to tweak the strictness of native-federation. 

```
export type ModeConfig = {
    strict: boolean,
    latestSharedExternal: boolean
}
```

### Options:

| Option | Default | Description |
| --- | --- | --- |
| strict | `false` | When enabled, the init function will throw an error if a remoteEntry could not be fetched or a version incompatibility within a shared external occurs.
| latestSharedExternal | `false` | When enabled, the version resolver will prioritize using the latest version of a shared external over the most optimal version. 

```
import { initFederation, config } from 'vanilla-native-federation';

initFederation("http://example.org/manifest.json", {
    strict: true,
    latestSharedExternal: true
});
```

## <a id="storageConfig"></a>  5. StorageConfig

The library stores the current state by default in the globalThis object, it is possible to provide a custom storage or switch to localStorage or sessionStorage. 

```
type StorageConfig = {
    storage: StorageEntryHandler,
    clearCache: boolean,
}
```

### Options:

| Option | Default | Description |
| --- | --- | --- |
| storage | `globalThisStorageEntry` | Allows the provision of a custom storage implementation. 
| clearCache | `false` | When enabled, the initFederation function will clear the current cache/storage before initializing the remoteEntries. 

```
import { initFederation, config } from 'vanilla-native-federation';

initFederation("http://example.org/manifest.json", {
    clearCache: true,

    // Option 1: globalThis
    logger: config.globalThisStorage,

    // Option 2: localStorage
    logger: config.localStorageEntry,

    // Option 3: sessionStorage
    logger: config.sessionStorageEntry,
});
```
