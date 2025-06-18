import { fileURLToPath } from 'url';
import { resolve } from 'path';

export async function delay(wait: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, wait));
}

export function isMainMeta(importMeta: ImportMeta) {
  return fileURLToPath(importMeta.url) === resolve(process.argv[1])
}
