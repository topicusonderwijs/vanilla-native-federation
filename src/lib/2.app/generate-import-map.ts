import type { ForGeneratingImportMap } from "./driver-ports/for-generating-import-map";

const createGenerateImportMap = (

): ForGeneratingImportMap => { 
    

    return () => {
        return Promise.resolve({imports: {}, scopes: {}});
    };
}

export { createGenerateImportMap };