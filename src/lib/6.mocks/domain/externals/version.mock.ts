import { SharedVersion, Version } from "lib/1.domain"
import { MOCK_HOST_REMOTE_ENTRY_SCOPE_URL, MOCK_REMOTE_ENTRY_SCOPE_I_URL, MOCK_REMOTE_ENTRY_SCOPE_II_URL } from "../remote-entry/remote-entry.mock"



/**
 * --------------------------------------
 *  VERSION
 * --------------------------------------
 */
export const MOCK_VERSION_I = ()
    : Version => ({
        version: "1.2.3", 
        file: `dep-a.js`
    })

/**
 * --------------------------------------
 *  SHARED_VERSION
 * --------------------------------------
 */
export const MOCK_VERSION_II = ()
    : SharedVersion => ({
        version: "4.5.6", 
        file: `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}dep-b.js`,
        requiredVersion: "^4.1.1", 
        strictVersion: true,
        host: false,
        cached: true,
        action: "share",
    })

export const MOCK_VERSION_III = ()
    : SharedVersion => ({
        version: "7.8.9", 
        file: `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}dep-c.js`,
        requiredVersion: "~7.0.0", 
        strictVersion: true,
        host: false,
        cached: false,
        action: "skip",
    });

export const MOCK_VERSION_IV = ()
    : SharedVersion => ({
        version: "2.2.2", 
        file: `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}dep-d.js`,
        requiredVersion: "^2.0.0", 
        strictVersion: true,
        host: false,
        cached: true,
        action: "scope",
    })

export const MOCK_VERSION_V = ()
    : SharedVersion => ({
        version: "7.8.8", 
        file: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}dep-c.js`,
        requiredVersion: "~7.0.0", 
        strictVersion: true,
        host: true,
        cached: true,
        action: "share",
    })

export const MOCK_VERSION_VI = ()
    : SharedVersion => ({
        version: "3.0.0", 
        file: `${MOCK_HOST_REMOTE_ENTRY_SCOPE_URL()}dep-d.js`,
        requiredVersion: "~3.0.0", 
        strictVersion: true,
        host: true,
        cached: true,
        action: "share",
    })