import { Remote, SharedInfo } from "../../lib/remote-entry/remote-info.contract";

export const REMOTE_MFE1_MOCK: () => Remote = () => 
    JSON.parse(JSON.stringify({
        name: 'team/mfe1', 
        shared: [] as SharedInfo[], 
        exposes: [{key: './Comp', outFileName: 'main.js'}], 
        baseUrl: 'http://localhost:3001/mfe1'
    }))

export const REMOTE_MFE2_MOCK: () => Remote = () => 
    JSON.parse(JSON.stringify({
        name: 'team/mfe2', 
        shared: [] as SharedInfo[], 
        exposes: [{key: './Comp', outFileName: 'main.js'}], 
        baseUrl: 'http://localhost:3001/mfe2'
    }))

export const REMOTE_MFE3_MOCK: () => Remote = () => 
    JSON.parse(JSON.stringify({
        name: 'team/mfe3', 
        shared: [] as SharedInfo[], 
        exposes: [{key: './Comp', outFileName: 'main.js'}], 
        baseUrl: 'http://localhost:3001/mfe3'
    }))