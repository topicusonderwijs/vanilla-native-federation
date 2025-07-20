import type { ConfigContract, NFOptions } from './2.app/config/config.contract';
import type { InitDriversContract } from './2.app/driver-ports/init/drivers.contract';
import type { DrivingContract } from './2.app/driving-ports/driving.contract';
import { createConfigHandlers } from './5.di/config.factory';
import { createInitDrivers } from './5.di/init-drivers.factory';
import { createDriving } from './5.di/driving.factory';
import { createDynamicInitDrivers } from './5.di/dynamic-init-drivers.factory';
import type { DynamicInitDriversContract } from './2.app/driver-ports/dynamic-init/drivers.contract';

export type NF_APP = {
  init: InitDriversContract;
  dynamicInit: DynamicInitDriversContract;
  adapters: DrivingContract;
  config: ConfigContract;
};

export const CREATE_NF_APP = (options: NFOptions): NF_APP => {
  const config = createConfigHandlers(options);
  const adapters = createDriving(config);
  const init = createInitDrivers(config, adapters);
  const dynamicInit = createDynamicInitDrivers(config, adapters);

  return {
    init,
    adapters,
    config,
    dynamicInit,
  };
};
