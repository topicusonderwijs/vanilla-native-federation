## 0.12.2 - Docs
- [fix] Exported `Options` and `Config` types.
- [chg] Updated quickstart to support `mfe-manifest` and `mfe-feed` input instead of only `manifest` script tag. 
- [new] Added customizable namespace option for storage, still defaults to `__NATIVE_FEDERATION__`.
- [new] `initFederation` now also exports the config. 

## 0.12.1 - Small optimizations and docs
- [new] Added performance profiles to the configuration.
- [new] Exposed SDK for customization. 
- [new] Exposed Ports (driver and driving) through SDK export.
- [doc] Added documentation to different steps. 
- [fix] Fixed a bug where the package.json pointed to the wrong declaration ts files.
- [fix] Fixed bug where consoleLogger was unable to print the details object. 

## 0.12.0 - COMPLETE REWORK, docs show the new domain model, options and configuration.
- [new] Refactored to hexagonal architecture.
- [fix] Added enhanced documentation.
- [fix] Added strict mode to config which throws errors if something goes wrong during initialization. 
- [fix] Added default shared external resolver that scopes a version if incompatible with the chosen shared version.
- [fix] Added resolver that checks the most optimal version of each singleton external for usage as shared version.
- [fix] When supplied, the externals in the host remoteEntry will be used as shared version to allow locking a certain version by the host. 
- [fix] The storage will now only persist the changes after all changes were succesful to avoid the host getting stuck in an error state because of contaminated storage. 
- [rem] Removed 'plugins' and replaced for 'config' object. bad typescrypt declaration file export

## 0.11.1 - Bugfix: Init failed if one remoteEntry was skipped in step 1 (metadata verification step)
- [fix] Init will now only log an error and a warning if a module could not be initialized instead of throwing an error during init.
- [test] Cleaned the test in externals handler.

## 0.11.0 - Integrated more robust Semver library
- Integraded Semver library for version management.
- Exposed Step interfaces for easy overrides.

## 0.10.0 - Merged step 1 and 2 into 1 single step
- Merged steps to allow for custom micro frontend discovery manifest implementations. 

## 0.9.2 - Fixed import bug
- Changed `-` to `_` in namespaces.
- Fixed bug in which `__NF_HOST__` remote was not being stored in cache leading to an error thrown during ImportMap buildup. 
- The host remoteEntry.json is stored as `__NF_HOST__` entry now. The `name` attribute in the host remoteEntry.json will be changed to `__NF_HOST__` 

## 0.9.1 - Simplified usage for hosts [BROKEN]
- Added option to set host remoteEntry.json as manifest.
- Added shimMode option to useImportMapShim plugin. 
- Added namespaces for reused variables like the 'remoteEntry.json' filename and the '__NATIVE-FEDERATION__' storage entry.

## 0.9.0 - Added support for host remoteEntry.json
- Added config for including a host remoteEntry.json.
- [breaking] Changed `load()` to `loadRemoteModule()` to be consistent with native-federation-runtime.
- moved config object to root lib folder. 

## 0.8.4 - Moved dependencies to devDependencies
- Moved SystemJS and eslint-plugin-prettier to devDependencies.

## 0.8.3 - Support for custom module loaders
- Dependency updates
- Added support for custom module loaders like SystemJS.
- Added explicit fallback if module failed to load or not initialized.
- Added quickstart plugin for testing.

## 0.8.2 - Added remote caching check
- During initialization, if a remote is already initialized or found in storage, it will be skipped. 
- ImportMapShim is now optional.

## 0.8.1 - Shared version compatibility check
- Added version resolving compatibility check (error if strict, warning otherwise).
- If an dependency incompatibility error occurs, the remote module will not be loaded/initialized. . i
## 0.8.0 - Improved dependency (external) sharing
- Support for 'singleton' dependencies.
- 'vite' dependencies are now optional based on `buildType` in the config (prefixed with `/@id/`).
- Dependency sharing based on 'requiredVersion' flag
- [breaking]: changed all storage entries to support dependency version management.
- [breaking]: Reorganized overridable steps into load-manifest, load-remoteEntries, build-importmap and load-remote-module. 
- Moved logging to separate plugin.
- Removed `fesm2022` option from package.json.
- Re-added `fesm` build to plugins. 

## 0.7.0 - Test coverage
- Added tests to handlers.
- Reworked StorageHandler, it now provides more type-safety.
- Added storageType to config object and simplified cache config object.
- Updated dependencies.

## 0.6.0 - Structural upgrade
- Added Jest unit-testing framework
- Moved handler types to different contract interface.
- Introduced 'steps' that can be overridden.
- Removed redundant 'loadRemoteModule', loader will now always be provided by initFederation.
- Added tests to utils folder.
- Exported types of all handlers and steps
- Taking a step back, temporarily removed Discovery support to allow structural refactor for a more extensible shim.
- Fixed SEMVER version comparison.

## 0.5.3 - Fixed FESM export
- Fixed bad FESM dist not exporting functions

## 0.5.1 - Added CDN build
- Added specific 'CDN' folder that contains minified bundles for direct import from a CDN. 

## 0.5.0 - Incorporated official native-federation-runtime
- Uses ts models from native-federation-runtime package
- Updated models to be in line with the official library:
    - RemoteInfo -> Remote
    - RemoteEntry -> FederationInfo
    - cache -> storage (storage contains the cache model now)
    - GlobalCache -> GlobalThisStorage
