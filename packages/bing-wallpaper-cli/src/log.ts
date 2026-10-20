import { appendFile, mkdir, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { AppPaths } from './types.js';

export async function appendLog(paths: AppPaths, entry: unknown): Promise<void> {
  await mkdir(paths.log, { recursive: true });
  const path = join(paths.log, 'auto.log');
  if ((await stat(path).catch(() => null))?.size! > 1024 * 1024) {
    await rename(path, `${path}.1`);
  }
  await appendFile(path, `${JSON.stringify({ at: new Date().toISOString(), entry })}\n`, { mode: 0o600 });
}
