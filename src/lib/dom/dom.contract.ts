import type { ImportMap } from "@softarc/native-federation-runtime"

type DomHandler = {
    appendImportMap: (map: ImportMap) => ImportMap,
}

export { DomHandler }