type Imports = Record<string, string>;

type Scopes = Record<string, Imports>;

type ImportMap = {
  imports: Imports;
  scopes?: Scopes;
};

export { Scopes, Imports, ImportMap };
