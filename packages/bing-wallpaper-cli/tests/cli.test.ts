import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli-program.js';
import { WallpaperError } from '../src/errors.js';
import { sandbox } from './helpers.js';

describe('CLI', () => {
  let s: Awaited<ReturnType<typeof sandbox>>;
  let stdout: string;
  let stderr: string;
  const scheduler = {
    status: vi.fn(async () => ({ registered: true, enabled: true, name: 'mock' })),
    enable: vi.fn(async (_time: string) => ({ registered: true, enabled: true, name: 'mock' })),
    disable: vi.fn(async () => ({ registered: false, enabled: false, name: 'mock' }))
  };
  beforeEach(async () => {
    s = await sandbox();
    stdout = '';
    stderr = '';
    vi.clearAllMocks();
  });
  afterEach(async () => {
    await s.dispose();
  });
  const invoke = (args: string[]) =>
    runCli(args, s.client, scheduler, {
      out: (text) => {
        stdout += text;
      },
      error: (text) => {
        stderr += text;
      }
    });

  it('defaults to refresh, accepts global options after the subcommand, emits JSON', async () => {
    expect(await invoke(['--json'])).toBe(0);
    expect(JSON.parse(stdout).applied).toBe(true);
    stdout = '';
    expect(await invoke(['download', '--market', 'ja-JP', '--resolution', '1920x1080', '--json'])).toBe(0);
    expect(JSON.parse(stdout).image).toMatchObject({ market: 'ja-JP', resolution: '1920x1080' });
    expect(s.desktop.set).toHaveBeenCalledTimes(1);
  });
  it('supports quiet, JSON takes precedence, and info never fetches', async () => {
    expect(await invoke(['download', '--quiet'])).toBe(0);
    expect(stdout).toBe('');
    s.fetcher.mockClear();
    expect(await invoke(['info', '--quiet', '--json'])).toBe(0);
    expect(JSON.parse(stdout).lastDownload).not.toBeNull();
    expect(s.fetcher).not.toHaveBeenCalled();
  });
  it('shows help/version without network or OS operations', async () => {
    expect(await invoke(['--help'])).toBe(0);
    expect(stdout).toContain('download');
    expect(stdout).toContain('auto');
    stdout = '';
    expect(await invoke(['--version'])).toBe(0);
    expect(stdout).toContain('0.1.0');
    expect(s.fetcher).not.toHaveBeenCalled();
    expect(s.desktop.set).not.toHaveBeenCalled();
  });
  it.each([['unknown'], ['download', '--invalid'], ['config', 'set'], ['config', 'set', 'retentionDays', '-1']])(
    'returns usage exit code for %j',
    async (...input) => {
      expect(await invoke(input as string[])).toBe(2);
      expect(stderr).toContain('USAGE');
    }
  );
  it('emits parseable JSON errors and validates config keys', async () => {
    expect(await invoke(['config', 'set', 'market', 'invalid', '--json'])).toBe(2);
    expect(JSON.parse(stderr).error.code).toBe('USAGE');
  });
  it('persists config; enables, queries and removes native tasks', async () => {
    expect(await invoke(['config', 'set', 'market', 'ja-JP'])).toBe(0);
    stdout = '';
    expect(await invoke(['config', 'list', '--json'])).toBe(0);
    expect(JSON.parse(stdout).market).toBe('ja-JP');
    expect(await invoke(['auto', 'enable', '--time', '08:30'])).toBe(0);
    expect(scheduler.enable).toHaveBeenCalledWith('08:30');
    expect(await invoke(['auto', 'status'])).toBe(0);
    expect(scheduler.status).toHaveBeenCalledTimes(1);
    expect(await invoke(['auto', 'disable'])).toBe(0);
    expect(scheduler.disable).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['NETWORK', 3],
    ['STORAGE', 4],
    ['WALLPAPER', 5],
    ['SCHEDULER', 6],
    ['BUSY', 7]
  ] as const)('maps %s to exit code %i', async (code, expected) => {
    vi.spyOn(s.client, 'refreshWallpaper').mockRejectedValueOnce(new WallpaperError(code, 'test failure'));
    expect(await invoke(['refresh', '--json'])).toBe(expected);
    expect(JSON.parse(stderr).error.code).toBe(code);
  });
  it('writes scheduled success and failure logs, without stdout', async () => {
    expect(await invoke(['refresh', '--scheduled'])).toBe(0);
    expect(stdout).toBe('');
    vi.spyOn(s.client, 'refreshWallpaper').mockRejectedValueOnce(new WallpaperError('NETWORK', 'offline'));
    expect(await invoke(['refresh', '--scheduled'])).toBe(3);
    const lines = (await readFile(join(s.paths.log, 'auto.log'), 'utf8'))
      .trim()
      .split('\n')
      .map((s) => JSON.parse(s));
    expect(lines).toHaveLength(2);
    expect(lines[0].entry.ok).toBe(true);
    expect(lines[1].entry.error.code).toBe('NETWORK');
  });
});
