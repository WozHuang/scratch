import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { vi } from 'vitest';
import { createClient } from '../src/service.js';
import type { Fetch } from '../src/bing.js';
import type { AppPaths, Desktop } from '../src/types.js';

export const apiData = {
  images: [
    {
      startdate: '20261020',
      title: '每日图片',
      copyright: '© Test',
      copyrightlink: '/search?q=test',
      urlbase: '/th?id=OHR.Test_ZH-CN123',
      url: '/th?id=OHR.Test_ZH-CN123_1920x1080.jpg'
    }
  ]
};
export const jpeg = new Uint8Array(await readFile(new URL('./fixtures/image.jpg', import.meta.url)));

export async function sandbox() {
  const parent = fileURLToPath(new URL('../.test-tmp/', import.meta.url));
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, 'bing-cli-测试 '));
  const paths: AppPaths = {
    config: join(root, 'config'),
    data: join(root, 'data'),
    cache: join(root, 'cache'),
    log: join(root, 'log')
  };
  let active: string[] = [];
  const desktop: Desktop = {
    get: vi.fn(async () => active),
    set: vi.fn(async (path: string) => {
      active = [path];
    })
  };
  const fetcher = vi.fn<Fetch>(async (input) =>
    String(input).includes('HPImageArchive') ? Response.json(apiData) : new Response(jpeg)
  );
  const client = createClient({
    paths,
    desktop,
    fetch: fetcher,
    platform: 'win32',
    now: () => new Date('2026-10-20T09:00:00Z')
  });
  return {
    root,
    paths,
    desktop,
    fetcher,
    client,
    dispose: () => {
      if (!root.startsWith(parent)) throw new Error('Test directory escaped workspace');
      return rm(root, { recursive: true, force: true });
    }
  };
}
