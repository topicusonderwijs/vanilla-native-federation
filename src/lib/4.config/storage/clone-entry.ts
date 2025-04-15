import type { StorageEntryKey } from "../../2.app/config/storage.contract";
import { NFError } from "../../native-federation.error";

type CloneEntry = <T>(name: StorageEntryKey, raw:T) => T;

const cloneEntry: CloneEntry = <T>(name: StorageEntryKey, raw: T) => {
    try {
        if (typeof globalThis.structuredClone === 'function') {
            return globalThis.structuredClone(raw);
        }
    } catch {/* structured clone is unavailable */}
    try{
        return JSON.parse(JSON.stringify(raw));
    } catch { /* object is not stringifyable */ }
    throw new NFError(`Could not parse storage entry '${String(name)}'`)
}

export {CloneEntry, cloneEntry}