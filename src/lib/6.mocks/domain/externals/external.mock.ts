import { ExternalsScope, SharedExternal, SharedExternals } from "lib/1.domain";
import { MOCK_VERSION_I, MOCK_VERSION_II, MOCK_VERSION_III, MOCK_VERSION_IV, MOCK_VERSION_V, MOCK_VERSION_VI } from "./version.mock";

/**
 * --------------------------------------
 *  SCOPED_EXTERNAL
 * --------------------------------------
 */
export const MOCK_EXTERNALS_SCOPE = ()
    : ExternalsScope => ({
        "dep-a": MOCK_VERSION_I()
    });

/**
 * --------------------------------------
 *  SHARED_EXTERNALS
 * --------------------------------------
 */
export const MOCK_SHARED_EXTERNAL_I = ()
    : SharedExternal => ({
        dirty: false,
        versions: [MOCK_VERSION_II()]
    });

export const MOCK_SHARED_EXTERNAL_II = ()
    : SharedExternal => ({
        dirty: false,
        versions: [MOCK_VERSION_III(), MOCK_VERSION_V()]
    });

export const MOCK_SHARED_EXTERNAL_III = ()
    : SharedExternal => ({
        dirty: false,
        versions: [MOCK_VERSION_IV(), MOCK_VERSION_VI()]
    });

export const MOCK_SHARED_EXTERNALS = ()
    : SharedExternals => ({
        "dep-b": MOCK_SHARED_EXTERNAL_I(),
        "dep-c": MOCK_SHARED_EXTERNAL_II(),
        "dep-d": MOCK_SHARED_EXTERNAL_III()
    })