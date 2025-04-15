import type { Version, SharedVersion } from "./version.contract";

export type ExternalName = string;

export type ScopedExternals = Record<string, ExternalsScope>

export type SharedExternal = {
    dirty: boolean,
    versions: SharedVersion[]
}

export type SharedExternals = Record<string, SharedExternal>

export type ExternalsScope = Record<string, Version>
