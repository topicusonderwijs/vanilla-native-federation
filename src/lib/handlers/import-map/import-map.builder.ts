import type { ImportMap, Imports } from "@softarc/native-federation-runtime";

interface ImportMapBuilder {
    get(): ImportMap;
    updateGlobalImport(updateFn: (imports: Imports) => Imports): ImportMapBuilder;
    updateScopedImport(scope: string, updateFn: (imports: Imports) => Imports): ImportMapBuilder;
}

function importMapBuilder(baseImportMap?: ImportMap): ImportMapBuilder {
    const importMap: ImportMap = {
        imports: {...(baseImportMap?.imports) ?? {}},
        scopes: {...(baseImportMap?.scopes) ?? {}},
    }

    function updateGlobalImport(updateFn: (imports: Imports) => Imports): ImportMapBuilder {
        importMap.imports = updateFn({...importMap.imports});
        return builder; 
    }

    function updateScopedImport(scope: string, updateFn: (imports: Imports) => Imports): ImportMapBuilder {
        importMap.scopes[scope] = updateFn({...importMap.scopes[scope]});
        return builder; 
    }

    function get(): ImportMap {
        return importMap!;
    }

    const builder = {
        get,
        updateGlobalImport,
        updateScopedImport
    };

    return builder;
}

export {importMapBuilder, ImportMapBuilder};