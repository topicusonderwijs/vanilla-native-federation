import type { ForCheckingVersion } from "./for-checking-version.port"
import type { ForProvidingManifest } from "./for-providing-manifest.port"
import type { ForProvidingRemoteEntry } from "./for-providing-remote-entry.port"
import type { ForStoringRemoteInfo } from "./for-storing-remote-info.port"
import type { ForStoringScopedExternals } from "./for-storing-scoped-externals.port"
import type { ForStoringSharedExternals } from "./for-storing-shared-externals.port"

export type DrivingContract = {
    versionCheck: ForCheckingVersion,
    manifestProvider: ForProvidingManifest,
    remoteEntryProvider: ForProvidingRemoteEntry,
    remoteInfoRepo: ForStoringRemoteInfo,
    scopedExternalsRepo: ForStoringScopedExternals,
    sharedExternalsRepo: ForStoringSharedExternals
}