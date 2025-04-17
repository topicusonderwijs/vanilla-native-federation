import { ExposesInfo, FederationInfo, SharedInfo } from "../../../1.domain/remote-entry/remote-entry.contract";

/**
 * --------------------------------------
 *  SHARED_INFO
 * --------------------------------------
 */
export const MOCK_SHARED_INFO_I = ()
    : SharedInfo => ({
        version: "1.2.3", 
        requiredVersion: "~1.2.1", 
        strictVersion: false,
        singleton: true,
        packageName: "dep-a",
        outFileName: "dep-a.js"
    });

export const MOCK_SHARED_INFO_II = ()
    : SharedInfo => ({
        version: "4.5.6", 
        requiredVersion: "^4.1.1", 
        strictVersion: true,
        singleton: false,
        packageName: "dep-b",
        outFileName: "dep-b.js"
    });

export const MOCK_SHARED_INFO_III = ()
    : SharedInfo => ({
        version: "7.8.9", 
        requiredVersion: "~7.0.0", 
        strictVersion: true,
        singleton: true,
        packageName: "dep-c",
        outFileName: "dep-c.js"
    });

export const MOCK_SHARED_INFO_IV = ()
    : SharedInfo => ({
        version: "2.2.2", 
        requiredVersion: "^2.0.0", 
        strictVersion: true,
        singleton: true,
        packageName: "dep-d",
        outFileName: "dep-d.js"
    });

export const MOCK_SHARED_INFO_V = ()
    : SharedInfo => ({
        version: "7.8.8", 
        requiredVersion: "~7.0.0", 
        strictVersion: true,
        singleton: true,
        packageName: "dep-c",
        outFileName: "dep-c.js"
    });

export const MOCK_SHARED_INFO_VI = ()
    : SharedInfo => ({
        version: "3.0.0", 
        requiredVersion: "~3.0.0", 
        strictVersion: true,
        singleton: true,
        packageName: "dep-d",
        outFileName: "dep-d.js"
    });


/**
 * --------------------------------------
 *  EXPOSES_INFO
 * --------------------------------------
 */

export const MOCK_EXPOSES_INFO_I = ()
    : ExposesInfo => ({ 
        key: './wc-comp-a', 
        outFileName: './component-b.js' 
    });

export const MOCK_EXPOSES_INFO_II = ()
    : ExposesInfo => ({ 
        key: './wc-comp-b', 
        outFileName: './component-b.js' 
    });

export const MOCK_EXPOSES_INFO_III = ()
    : ExposesInfo => ({ 
        key: './wc-comp-c', 
        outFileName: './component-c.js' 
    });

/**
 * --------------------------------------
 *  FEDERATION_INFO
 * --------------------------------------
 */

export const MOCK_FEDERATION_INFO_I = ()
    : FederationInfo => ({
        name: 'team/mfe1',
        exposes: [
            MOCK_EXPOSES_INFO_I()
        ],
        shared: [
            MOCK_SHARED_INFO_I(),
            MOCK_SHARED_INFO_II(),
        ]
    });

export const MOCK_FEDERATION_INFO_II = ()
    : FederationInfo => ({
        name: 'team/mfe2',
        exposes: [
            MOCK_EXPOSES_INFO_II(),
            MOCK_EXPOSES_INFO_III()
            
        ],
        shared: [
            MOCK_SHARED_INFO_III(),
            MOCK_SHARED_INFO_IV(),
        ]
    });

export const MOCK_HOST_FEDERATION_INFO = ()
    : FederationInfo => ({
        name: 'host',
        exposes: [],
        shared: [
            MOCK_SHARED_INFO_V(),
            MOCK_SHARED_INFO_VI(),
        ]
    });