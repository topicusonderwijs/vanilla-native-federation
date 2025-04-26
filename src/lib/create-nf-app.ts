import type { Config, Options } from "./2.app/config/config.contract";
import type { DriversContract } from "./2.app/driver-ports/drivers.contract";
import type { DrivingContract } from "./2.app/driving-ports/driving.contract";
import { createConfigHandlers } from "./5.di/config.factory";
import { createDrivers } from "./5.di/drivers.factory";
import { createDriving } from "./5.di/driving.factory";

export type NF_APP = {
    app: DriversContract,
    adapters: DrivingContract,
    config: Config
}

export const CREATE_NF_APP = (options: Options): NF_APP => {
    const config = createConfigHandlers(options);
    const adapters = createDriving(config);
    const app = createDrivers(config, adapters);

    return {
        app,
        adapters,
        config
    }
}