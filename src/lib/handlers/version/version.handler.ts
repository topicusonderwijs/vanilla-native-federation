import type { VersionHandler } from './version.contract';

const versionHandlerFactory = (): VersionHandler => {
    // ^ = patch AND minor can be higher
    // ~ = only higher minor versions
    // singleton = in imports object
    // strictVersion = fail instead of warning (singleton mismatch)
    // requiredVersion = '>=1.0.0 <3.0.0'
    return {};
}

export { versionHandlerFactory}