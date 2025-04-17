import { RemoteEntry } from "../../../1.domain/remote-entry/remote-entry.contract";
import { MOCK_FEDERATION_INFO_I, MOCK_FEDERATION_INFO_II, MOCK_HOST_FEDERATION_INFO } from "./federation-info.mock";

/**
 * --------------------------------------
 *  REMOTE_ENTRY
 * --------------------------------------
 */
export const MOCK_REMOTE_ENTRY_URL_I = () => "http://my.service/mfe1";
export const MOCK_REMOTE_ENTRY_URL_II = () => "http://my.service/mfe2";
export const MOCK_HOST_REMOTE_ENTRY_URL = () => "http://host.service/";


/**
 * --------------------------------------
 *  REMOTE_ENTRY
 * --------------------------------------
 */

export const MOCK_REMOTE_ENTRY_I = ()
    : RemoteEntry => ({
        ...MOCK_FEDERATION_INFO_I(),
        url: MOCK_REMOTE_ENTRY_URL_I()
    });

export const MOCK_REMOTE_ENTRY_II = ()
    : RemoteEntry => ({
        ...MOCK_FEDERATION_INFO_II(),
        url: MOCK_REMOTE_ENTRY_URL_II()
    });

export const MOCK_HOST_REMOTE_ENTRY = ()
    : RemoteEntry => ({
        ...MOCK_HOST_FEDERATION_INFO(),
        url: MOCK_HOST_REMOTE_ENTRY_URL(),
        host: true
    });