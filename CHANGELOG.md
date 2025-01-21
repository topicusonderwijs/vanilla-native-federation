## 0.5.4 - Testing
- Added Jest unit-testing framework
- Moved handler types to different contract interface.

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