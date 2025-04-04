import type { FederationInfo } from "../../1.domain/remote-entry.contract";
import type { Manifest } from "../../1.domain/manifest.contract";

export type ForGettingRemotesFederationInfo = (remotesOrManifestUrl: string|Manifest) => Promise<FederationInfo[]>
