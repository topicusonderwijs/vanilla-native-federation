export type ForResolvingPaths = {
    join: (pathA: string, pathB: string) => string,
    getScope: (path: string) => string
}
