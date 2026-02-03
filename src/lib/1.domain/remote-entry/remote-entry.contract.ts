import type { SharedVersionAction } from '../externals/version.contract';
import type { RemoteEntryUrl } from './manifest.contract';
import type { ExposesInfo, FederationInfo, SharedInfo } from '@softarc/native-federation/domain';

type RemoteEntry = FederationInfo & {
  url: RemoteEntryUrl;
  host?: boolean;
  override?: boolean;
};

type SharedInfoActions = Record<string, { action: SharedVersionAction; override?: string }>;

export { RemoteEntry, FederationInfo, ExposesInfo, SharedInfo, SharedInfoActions };
