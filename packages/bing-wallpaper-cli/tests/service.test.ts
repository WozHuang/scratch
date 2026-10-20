import { readFile, writeFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, createClient, loadState } from '../src/service.js';
import { loadConfig, saveConfig, updateConfig } from '../src/config.js';
import { writeJson, withLock } from '../src/storage.js';
import { WallpaperError } from '../src/errors.js';
import { sandbox, apiData, jpeg } from './helpers.js';

describe('wallpaper operations and storage', () => {
  let s: Awaited<ReturnType<typeof sandbox>>;
  beforeEach(async () => {
    s = await sandbox();
  });
  afterEach(async () => {
    await s.dispose();
  });

  it('downloads without setting, stores sidecar and reuses metadata/file cache', async () => {
    const first = await s.client.downloadWallpaper();
    expect(s.desktop.set).not.toHaveBeenCalled();
    expect(first).toMatchObject({ applied: false, cached: false });
    expect(JSON.parse(await readFile(`${first.image.path}.json`, 'utf8'))).toEqual(first.image);
    expect(first.image.path).toContain('bing-20261020-zh-CN-Test_ZH-CN123');
    const second = await s.client.downloadWallpaper();
    expect(second.cached).toBe(true);
    expect(s.fetcher).toHaveBeenCalledTimes(2);
  });
  it('refreshes once, skips repeated setting, --force re-fetches and re-applies', async () => {
    const a = await s.client.refreshWallpaper();
    const b = await s.client.refreshWallpaper();
    expect(a.applied).toBe(true);
    expect(b).toMatchObject({ applied: false, cached: true });
    expect(s.desktop.set).toHaveBeenCalledTimes(1);
    await s.client.refreshWallpaper({ force: true });
    expect(s.fetcher).toHaveBeenCalledTimes(4);
    expect(s.desktop.set).toHaveBeenCalledTimes(2);
  });
  it('falls back from UHD, and caches a fallback without probing UHD repeatedly', async () => {
    s.fetcher.mockImplementation(async (input) => {
      const url = String(input);
      return url.includes('HPImageArchive')
        ? Response.json(apiData)
        : url.includes('_UHD')
          ? new Response('missing', { status: 404 })
          : new Response(jpeg);
    });
    expect((await s.client.downloadWallpaper()).image.resolution).toBe('3840x2160');
    await s.client.downloadWallpaper();
    expect(s.fetcher).toHaveBeenCalledTimes(3);
  });
  it('never changes or removes the previous wallpaper when every image fails', async () => {
    const previous = await s.client.refreshWallpaper();
    s.fetcher.mockImplementation(async (input) =>
      String(input).includes('HPImageArchive') ? Response.json(apiData) : new Response('not an image')
    );
    await expect(s.client.refreshWallpaper({ force: true })).rejects.toMatchObject({ code: 'IMAGE' });
    expect(await readFile(previous.image.path)).toEqual(Buffer.from(jpeg));
    expect((await loadState(s.paths)).current).toEqual(previous.image);
    expect(s.desktop.set).toHaveBeenCalledTimes(1);
  });
  it('keeps the previous current marker when desktop setting fails', async () => {
    const previous = await s.client.refreshWallpaper();
    vi.mocked(s.desktop.set).mockRejectedValueOnce(new WallpaperError('WALLPAPER', 'denied'));
    await expect(s.client.refreshWallpaper({ market: 'ja-JP' })).rejects.toMatchObject({ code: 'WALLPAPER' });
    expect((await loadState(s.paths)).current).toEqual(previous.image);
  });
  it('redownloads a corrupt cached image', async () => {
    const a = await s.client.downloadWallpaper();
    await writeFile(a.image.path, 'broken');
    expect((await s.client.downloadWallpaper()).cached).toBe(false);
    expect(s.fetcher).toHaveBeenCalledTimes(3);
  });
  it('info is local, describes last download separately from applied image', async () => {
    await s.client.downloadWallpaper();
    s.fetcher.mockClear();
    const info = await s.client.getInfo();
    expect(info.current).toBeNull();
    expect(info.lastDownload?.date).toBe('20261020');
    expect(s.fetcher).not.toHaveBeenCalled();
  });
  it('validates persisted config and CLI overrides', async () => {
    expect((await loadConfig(s.paths)).market).toBe('zh-CN');
    await updateConfig(s.paths, 'market', 'ja-JP');
    await updateConfig(s.paths, 'retentionDays', '0');
    expect(await loadConfig(s.paths)).toMatchObject({ market: 'ja-JP', retentionDays: 0 });
    await expect(updateConfig(s.paths, 'retentionDays', '2x')).rejects.toMatchObject({ code: 'USAGE' });
    await expect(updateConfig(s.paths, '__proto__', '{}')).rejects.toMatchObject({ code: 'USAGE' });
    await expect(s.client.downloadWallpaper({ resolution: '../../bad' })).rejects.toMatchObject({ code: 'USAGE' });
    await writeFile(join(s.paths.config, 'config.json'), '{invalid');
    await expect(s.client.downloadWallpaper()).rejects.toMatchObject({ code: 'STORAGE' });
  });
  it('does not mutate persisted config for one-shot market/output options', async () => {
    const output = join(s.root, '图片 folder');
    const result = await s.client.downloadWallpaper({ market: 'ja-JP', output, resolution: '1920x1080' });
    expect(result.image.path.startsWith(output)).toBe(true);
    expect((await loadConfig(s.paths)).market).toBe('zh-CN');
    expect(result.image.resolution).toBe('1920x1080');
  });
  it('cleans only expired managed downloads, preserving current and unrelated files', async () => {
    const a = await s.client.downloadWallpaper();
    const b = await s.client.refreshWallpaper({ market: 'ja-JP' });
    const state = await loadState(s.paths);
    const unrelated = join(s.root, 'personal.jpg');
    await writeFile(unrelated, jpeg);
    const config = await loadConfig(s.paths);
    expect(await cleanup(state, config, s.desktop, new Date('2026-12-01'))).toEqual([]);
    await expect(lstat(a.image.path)).rejects.toMatchObject({ code: 'ENOENT' });
    expect((await lstat(b.image.path)).isFile()).toBe(true);
    expect((await lstat(unrelated)).isFile()).toBe(true);
    expect(state.downloads.map((r) => r.path)).toEqual([b.image.path]);
  });
  it('skips cleanup on failed OS query, disabled retention, and altered sidecars', async () => {
    const a = await s.client.downloadWallpaper();
    const state = await loadState(s.paths);
    const config = await loadConfig(s.paths);
    vi.mocked(s.desktop.get).mockRejectedValueOnce(new Error('permission'));
    expect(await cleanup(state, config, s.desktop, new Date('2026-12-01'))).toHaveLength(1);
    expect(await cleanup(state, { ...config, retentionDays: 0 }, s.desktop, new Date('2026-12-01'))).toEqual([]);
    await writeJson(`${a.image.path}.json`, { ...a.image, sha256: '0'.repeat(64) });
    await cleanup(state, config, s.desktop, new Date('2026-12-01'));
    expect((await lstat(a.image.path)).isFile()).toBe(true);
  });
  it('preserves applied macOS images for inactive Spaces', async () => {
    const client = createClient({
      paths: s.paths,
      platform: 'darwin',
      desktop: s.desktop,
      fetch: s.fetcher,
      now: () => new Date('2026-10-20')
    });
    const a = await client.refreshWallpaper();
    await client.refreshWallpaper({ market: 'ja-JP' });
    const state = await loadState(s.paths);
    expect(state.protectedPaths).toContain(a.image.path);
    await cleanup(state, await loadConfig(s.paths), s.desktop, new Date('2026-12-01'));
    expect((await lstat(a.image.path)).isFile()).toBe(true);
  });
  it('prevents overlapping operations and releases its lock on failure', async () => {
    await expect(withLock(s.paths, () => s.client.downloadWallpaper())).rejects.toMatchObject({ code: 'BUSY' });
    expect((await s.client.downloadWallpaper()).image).toBeDefined();
  });
  it('rejects unsupported platforms before downloading or setting', async () => {
    const client = createClient({ paths: s.paths, platform: 'linux', desktop: s.desktop, fetch: s.fetcher });
    await expect(client.refreshWallpaper()).rejects.toMatchObject({ code: 'PLATFORM' });
    expect(s.fetcher).not.toHaveBeenCalled();
  });
  it('rejects invalid state rather than deleting arbitrary files', async () => {
    await writeJson(join(s.paths.data, 'state.json'), { downloads: [{ path: join(s.root, 'important.jpg') }] });
    await expect(s.client.downloadWallpaper()).rejects.toMatchObject({ code: 'STORAGE' });
  });
  it('fetches new metadata when the local calendar day changes', async () => {
    await s.client.downloadWallpaper();
    const next = createClient({
      paths: s.paths,
      desktop: s.desktop,
      fetch: s.fetcher,
      now: () => new Date('2026-10-21T09:00:00Z')
    });
    await next.downloadWallpaper();
    expect(s.fetcher).toHaveBeenCalledTimes(3);
  });
  it('validates schedules before saving them', async () => {
    const config = await loadConfig(s.paths);
    await expect(saveConfig(s.paths, { ...config, autoTime: '25:00' })).rejects.toMatchObject({ code: 'USAGE' });
  });
});
