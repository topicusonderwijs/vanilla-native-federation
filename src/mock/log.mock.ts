import { LogHandler } from "../lib/handlers/logging";

const logHandlerMock: LogHandler = {
    debug: () => {},
    warn: () => {},
    error: () => {}
}

export {logHandlerMock}