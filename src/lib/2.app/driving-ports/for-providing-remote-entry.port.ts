import type { FederationInfo } from "../../1.domain/remote-entry.contract";

export type ForProvidingRemoteEntry = {
    provide: (remoteEntryUrl: string) => Promise<FederationInfo>
}

