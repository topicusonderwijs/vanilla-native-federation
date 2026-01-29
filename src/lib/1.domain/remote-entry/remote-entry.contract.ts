import type { SharedVersionAction } from '../externals/version.contract';
import type { RemoteEntryUrl } from './manifest.contract';
import type { ExposesInfo } from '@softarc/native-federation/domain';

type SharedInfo = {
  singleton: boolean;
  strictVersion: boolean;
  requiredVersion: string;
  version?: string;
  packageName: string;
  outFileName: string;
  shareScope?: string;
  dev?: {
    entryPoint: string;
  };
};

interface FederationInfo {
  name: string;
  exposes: ExposesInfo[];
  shared: SharedInfo[];
  buildNotificationsEndpoint?: string;
}

type RemoteEntry = FederationInfo & {
  url: RemoteEntryUrl;
  host?: boolean;
  override?: boolean;
};

type SharedInfoActions = Record<string, { action: SharedVersionAction; override?: string }>;

export { RemoteEntry, FederationInfo, ExposesInfo, SharedInfo, SharedInfoActions };
