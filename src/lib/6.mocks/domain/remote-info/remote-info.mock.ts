import { RemoteInfo } from "lib/1.domain";
import { MOCK_REMOTE_ENTRY_SCOPE_I } from "../remote-entry/remote-entry.mock";

export const MOCK_REMOTE_INFO_I = ()
    : RemoteInfo => ({
        scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I(),
        exposes: [{ moduleName: "./wc-comp-a", url: "http://localhost:3001/component-b.js" }]
    });

export const MOCK_REMOTE_INFO_II = ()
    : RemoteInfo => ({
        scopeUrl: MOCK_REMOTE_ENTRY_SCOPE_I(),
        exposes: [{ moduleName: "./wc-comp-b", url: "http://localhost:3002/component-b.js" }]
    });