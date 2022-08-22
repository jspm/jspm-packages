type PackageDescriptor = {
  name: string;
  version: string;
  subpath: string;
}

type Maintainer = { name: string; email: string };

type ExportsTarget =
  | string
  | null
  | { [condition: string]: ExportsTarget }
  | ExportsTarget[];

export type { Maintainer, ExportsTarget, PackageDescriptor };
