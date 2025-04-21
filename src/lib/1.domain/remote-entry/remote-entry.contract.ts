import type { FederationInfo } from "@softarc/native-federation-runtime";
import type { RemoteEntryUrl } from "./manifest.contract";

type RemoteEntry = FederationInfo & {
    url: RemoteEntryUrl,
    host?: boolean,
}

export { RemoteEntry, FederationInfo }

export { ExposesInfo, SharedInfo } from "@softarc/native-federation-runtime";
