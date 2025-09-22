import type { DrivingContract } from 'lib/sdk.index';
import type { ConfigContract } from 'lib/options.index';

export type FLOW_FACTORY<TDrivers> = {
  flow: TDrivers;
  adapters: DrivingContract;
  config: ConfigContract;
};
