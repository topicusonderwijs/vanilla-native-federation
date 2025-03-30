
export type ForLogging = {
    error: (msg: string, details?: string|Error) => void;
    warn: (msg: string, details?: string|Error) => void;
    debug: (msg: string|Error) => void;
}