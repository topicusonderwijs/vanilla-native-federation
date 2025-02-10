## 0.8.0 - Improved dependency (external) sharing
- Support for 'singleton' dependencies.
- 'vite' dependencies are now optional based on `buildType` in the config (prefixed with `/@id/`).
- Dependency sharing based on 'requiredVersion' flag
- [breaking]: changed all storage entries to support version management. 

## 0.7.0 - Test coverage
- Added tests to handlers
- Reworked StorageHandler, it now provides more type-safety.
- Added storageType to config object and simplified cache config object.
- Updated dependencies

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