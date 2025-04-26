import { ImportMap } from "lib/1.domain";
import { MOCK_HOST_REMOTE_ENTRY_SCOPE_URL, MOCK_REMOTE_ENTRY_SCOPE_I_URL, MOCK_REMOTE_ENTRY_SCOPE_II_URL } from "./remote-entry/remote-entry.mock";


/**
 * --------------------------------------
 *  IMPORT_MAP
 * --------------------------------------
 */


export const MOCK_IMPORT_MAP = ()
    : ImportMap => ({
        imports: {
            "dep-b":`${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}dep-b.js`,
            "dep-c": `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}dep-c.js`,
            "dep-d": `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}dep-d.js`
        },
        scopes: {
            [MOCK_REMOTE_ENTRY_SCOPE_I_URL()]: {
                "dep-a": `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}dep-a.js`
            },
            [MOCK_REMOTE_ENTRY_SCOPE_II_URL()]: {
                "dep-d": `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}dep-d.js`
            }
        }
    });