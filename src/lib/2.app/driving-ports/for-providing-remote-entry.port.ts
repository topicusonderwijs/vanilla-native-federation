import type { FederationInfo } from "@softarc/native-federation-runtime";

export type ForProvidingRemoteEntry = {
    provide: (remoteEntryUrl: string) => Promise<FederationInfo>
}

