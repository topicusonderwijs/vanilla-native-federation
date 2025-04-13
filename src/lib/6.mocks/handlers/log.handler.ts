import type { LogHandler } from "lib/2.app/handlers/log.contract";

export const createMockLogHandler = ()
    : jest.Mocked<LogHandler> => ({
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    })
