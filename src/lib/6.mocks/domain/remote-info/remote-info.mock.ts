import { RemoteInfo } from "lib/1.domain";
import { MOCK_REMOTE_ENTRY_SCOPE_I_URL } from "../remote-entry/remote-entry.mock";

export const MOCK_REMOTE_INFO_I = ()
    : RemoteInfo => ({
        scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(),
        exposes: [{ moduleName: "./wc-comp-a", file: "component-a.js" }]
    });

export const MOCK_REMOTE_INFO_II = ()
    : RemoteInfo => ({
        scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I_URL(),
        exposes: [{ moduleName: "./wc-comp-b", file: "component-b.js" }]
    });