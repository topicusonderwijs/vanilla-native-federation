
declare function importShim<T>(url: string): T;

function usesImportMapShim() {
    return typeof importShim !== 'undefined'
}

export {usesImportMapShim}