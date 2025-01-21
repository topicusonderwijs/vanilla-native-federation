import { ImportMap } from "@softarc/native-federation-runtime";
import { appendImportMapToDOM } from "../lib/utils/dom";

const domHandlerMock = (): DomHandler => {
    const appendImportMap = (map: ImportMap): ImportMap => map;
    return {appendImportMap};
}

export {domHandlerMock}