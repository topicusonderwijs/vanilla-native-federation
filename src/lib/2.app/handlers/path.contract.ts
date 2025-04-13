export type PathHandler = {
    join: (pathA: string, pathB: string) => string,
    getScope: (path: string) => string
}
