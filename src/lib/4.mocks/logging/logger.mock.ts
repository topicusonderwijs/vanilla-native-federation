import { ForLogging } from "../../2.app/driving-ports/for-logging.port";

export const MockLogger = ()
    : jest.Mocked<ForLogging> => ({
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
