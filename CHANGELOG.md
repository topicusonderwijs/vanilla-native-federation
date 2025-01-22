## 0.6.1 - Test coverage
- Added tests to handlers

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