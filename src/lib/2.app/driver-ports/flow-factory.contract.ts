import type { DrivingContract } from '../../2.app/driving-ports/driving.contract';
import type { ConfigContract } from '../../2.app/config/config.contract';

export type FLOW_FACTORY<TDrivers> = {
  flow: TDrivers;
  adapters: DrivingContract;
  config: ConfigContract;
};
