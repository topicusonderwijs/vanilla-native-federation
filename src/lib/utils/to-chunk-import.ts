export const CHUNK_PREFIX = '@nf-internal';

export function toChunkImport(fileName: string): string {
  if (fileName.startsWith('./')) {
    fileName = fileName.slice(2);
  }

  const packageName = fileName.replace(/.(m|c)?js$/, '');
  return CHUNK_PREFIX + '/' + packageName;
}
