import type { Version, SharedVersion, VersionName } from "./version.contract";

export type ExternalName = string;

export type Externals = Record<VersionName, Version|SharedVersion>