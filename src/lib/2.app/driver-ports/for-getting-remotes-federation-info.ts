import type { FederationInfo } from "@softarc/native-federation-runtime";
import type { Manifest } from "../../1.domain/manifest.contract";

export type ForGettingRemotesFederationInfo = (remotesOrManifestUrl: string|Manifest) => Promise<FederationInfo[]>
