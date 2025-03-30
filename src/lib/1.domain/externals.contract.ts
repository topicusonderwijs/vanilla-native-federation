import type { Version, SharedVersion, VersionName } from "./version.contract";

export type ExternalName = string;

export type Externals = {
    shared: Record<VersionName, SharedVersion>,
    scoped: Record<VersionName, Version>,
}