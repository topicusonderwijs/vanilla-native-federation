import { LogHandler } from "./log.contract";
import { logHandlerFactory} from "./log.handler";
import { noopLogger } from "./noop.logger";

describe('importMapHandler', () => {
    let logHandler: LogHandler;

    beforeEach(() => {
        noopLogger.debug = jest.fn();
        noopLogger.warn = jest.fn();
        noopLogger.error = jest.fn();
    });

    describe('ERROR level', () => {
        beforeEach(() => {
            logHandler = logHandlerFactory("error", noopLogger);
        });

        it("should correctly call ERROR messages", () => {
            logHandler.error("Error message")
            expect(noopLogger.error).toHaveBeenCalledTimes(1);
        });

        it("should not call WARN messages", () => {
            logHandler.warn("Warn message")
            expect(noopLogger.warn).not.toHaveBeenCalled();
        });

        it("should not call DEBUG messages", () => {
            logHandler.debug("Debug message")
            expect(noopLogger.debug).not.toHaveBeenCalled();
        });
    });

    describe('WARN level', () => {
        beforeEach(() => {
            logHandler = logHandlerFactory("warn", noopLogger);
        });

        it("should correctly call ERROR messages", () => {
            logHandler.error("Error message")
            expect(noopLogger.error).toHaveBeenCalledTimes(1);
        });

        it("should correctly call WARN messages", () => {
            logHandler.warn("Warn message")
            expect(noopLogger.warn).toHaveBeenCalledTimes(1);
        });

        it("should not call DEBUG messages", () => {
            logHandler.debug("Debug message")
            expect(noopLogger.debug).not.toHaveBeenCalled();
        });
    });

    describe('DEBUG level', () => {
        beforeEach(() => {
            logHandler = logHandlerFactory("debug", noopLogger);
        });

        it("should correctly call ERROR messages", () => {
            logHandler.error("Error message")
            expect(noopLogger.error).toHaveBeenCalledTimes(1);
        });

        it("should correctly call WARN messages", () => {
            logHandler.warn("Warn message")
            expect(noopLogger.warn).toHaveBeenCalledTimes(1);
        });

        it("should correctly call DEBUG messages", () => {
            logHandler.debug("Debug message")
            expect(noopLogger.debug).toHaveBeenCalledTimes(1);
        });
    });
});