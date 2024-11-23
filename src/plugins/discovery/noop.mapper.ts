import type { DiscoveredRemotes, DiscoveryMapper } from "./discovery.contract";


type NoopMapper = DiscoveryMapper<DiscoveredRemotes, DiscoveredRemotes>;

export const noopMapper: NoopMapper = (remotes) => remotes;