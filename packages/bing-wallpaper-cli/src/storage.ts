import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import envPaths from 'env-paths';
import { WallpaperError, isMissing } from './errors.js';
import type { AppPaths } from './types.js';

export function defaultPaths(): AppPaths {
  return envPaths('woz-scratch-bing-wallpaper', { suffix: '' });
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch (error) {
    if (isMissing(error)) return fallback;
    throw new WallpaperError('STORAGE', `无法读取 ${path}；请备份后修复或移走损坏的 JSON 文件。`, { cause: error });
  }
}

export async function atomicWrite(path: string, content: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: 'wx', mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`);
}

// A kernel-released lock is not available in Node. Keep a short-lived PID lock;
// never reclaim a live process's lock, including long-running downloads.
export async function withLock<T>(paths: AppPaths, action: () => Promise<T>): Promise<T> {
  await mkdir(paths.data, { recursive: true });
  const path = join(paths.data, 'operation.lock');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await writeFile(path, String(process.pid), { flag: 'wx', mode: 0o600 });
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const pid = Number(await readFile(path, 'utf8').catch(() => ''));
      let alive = true;
      if (Number.isInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
        } catch (e) {
          alive = (e as NodeJS.ErrnoException).code !== 'ESRCH';
        }
      }
      const age = Date.now() - (await stat(path)).mtimeMs;
      if (attempt === 0 && !alive && age > 60_000) {
        await rm(path);
        continue;
      }
      throw new WallpaperError(
        'BUSY',
        '另一个命令正在运行，或上次命令异常退出。请稍后重试；确认没有进程后可移除 operation.lock。'
      );
    }
  }
  try {
    return await action();
  } finally {
    await rm(path, { force: true });
  }
}
