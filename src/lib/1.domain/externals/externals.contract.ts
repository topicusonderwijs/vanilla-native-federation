import type { Version, SharedVersion } from "./version.contract";

export type ExternalName = string;

export type Externals = {
    shared: SharedExternals,
    scoped: Record<string, ExternalsScope>
}

export type SharedExternals = Record<string, SharedVersion[]>

export type ExternalsScope = Record<string, Version>
