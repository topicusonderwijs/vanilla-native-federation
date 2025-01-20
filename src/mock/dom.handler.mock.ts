import { ImportMap } from "@softarc/native-federation-runtime";
import { DomHandler } from "../lib/dom/dom.contract";

const domHandlerMock = (): DomHandler => {
    const appendImportMap = (map: ImportMap): ImportMap => map;
    return {appendImportMap};
}

export {domHandlerMock}