import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScheduler, label, launchAgent, windowsScript, type Run } from '../src/scheduler.js';
import { sandbox } from './helpers.js';

describe('native schedulers (no real system operations)', () => {
  let s: Awaited<ReturnType<typeof sandbox>>;
  const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));
  beforeEach(async () => {
    s = await sandbox();
  });
  afterEach(async () => {
    await s.dispose();
  });

  it('builds safe LaunchAgent XML with absolute arguments and local time', () => {
    const text = launchAgent('/node path', '/a<&/中文.js', s.paths, '07:05');
    expect(text).toContain('<integer>7</integer>');
    expect(text).toContain('<integer>5</integer>');
    expect(text).toContain('/a&lt;&amp;/中文.js');
    expect(text).not.toContain('KeepAlive');
    expect(text).not.toContain('RunAtLoad');
    expect(text).toContain('Aqua');
  });
  it('enables, replaces, queries and removes only the owned macOS task', async () => {
    let loaded = false;
    const run = vi.fn<Run>(async (_file, args) => {
      if (args[0] === 'print') {
        if (!loaded) throw Object.assign(new Error('not found'), { code: 113 });
        return 'state = waiting';
      }
      if (args[0] === 'bootstrap') loaded = true;
      if (args[0] === 'bootout') loaded = false;
      return '';
    });
    const scheduler = createScheduler(s.paths, { platform: 'darwin', run, home: s.root, uid: 501, cli });
    expect(await scheduler.status()).toMatchObject({ registered: false, enabled: false });
    expect(await scheduler.enable('09:00')).toMatchObject({ registered: true, enabled: true, runtimeHealthy: true });
    await scheduler.enable('10:15');
    const path = join(s.root, 'Library/LaunchAgents', `${label}.plist`);
    expect(await readFile(path, 'utf8')).toContain('<integer>15</integer>');
    expect(await scheduler.disable()).toMatchObject({ registered: false, enabled: false });
    await scheduler.disable();
    expect(run.mock.calls.every(([file]) => file === '/bin/launchctl')).toBe(true);
    expect(run.mock.calls.find(([, args]) => args[0] === 'bootout')?.[1]).toEqual(['bootout', `gui/501/${label}`]);
  });
  it('refuses foreign plist files and loaded jobs lacking the owned file', async () => {
    const path = join(s.root, 'Library/LaunchAgents', `${label}.plist`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, '<plist>someone else</plist>');
    const run = vi.fn<Run>(async () => 'running');
    const scheduler = createScheduler(s.paths, { platform: 'darwin', run, home: s.root, uid: 501, cli });
    await expect(scheduler.disable()).rejects.toMatchObject({ code: 'SCHEDULER' });
    expect(run).not.toHaveBeenCalled();
    const another = createScheduler(s.paths, { platform: 'darwin', run, home: join(s.root, 'other'), uid: 501, cli });
    await expect(another.enable('09:00')).rejects.toThrow(/缺少/);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('reports permission errors instead of saying the job is absent', async () => {
    const run = vi.fn<Run>(async () => {
      throw Object.assign(new Error('permission'), { code: 1 });
    });
    const scheduler = createScheduler(s.paths, { platform: 'darwin', run, home: s.root, uid: 501, cli });
    await expect(scheduler.status()).rejects.toMatchObject({ code: 'SCHEDULER' });
  });
  it('removes a new plist if bootstrap fails', async () => {
    const run = vi.fn<Run>(async (_file, args) => {
      if (args[0] === 'print') throw Object.assign(new Error('not found'), { code: 113 });
      if (args[0] === 'bootstrap') throw new Error('bootstrap denied');
      return '';
    });
    const scheduler = createScheduler(s.paths, { platform: 'darwin', run, home: s.root, uid: 501, cli });
    await expect(scheduler.enable('09:00')).rejects.toMatchObject({ code: 'SCHEDULER' });
    await expect(readFile(join(s.root, 'Library/LaunchAgents', `${label}.plist`))).rejects.toMatchObject({
      code: 'ENOENT'
    });
  });
  it('encodes Windows paths as JSON data, using InteractiveToken and limited privilege', () => {
    const malicious = 'C:\\x"; Remove-Item *; #中文';
    const script = windowsScript('enable', { cli: malicious });
    expect(script).not.toContain(malicious);
    const encoded = script.match(/FromBase64String\('([^']+)'\)/)![1]!;
    expect(JSON.parse(Buffer.from(encoded, 'base64').toString())).toMatchObject({ cli: malicious });
    expect(script).toContain('$d.Principal.LogonType = 3');
    expect(script).toContain('$d.Principal.RunLevel = 0');
    expect(script).toContain('WozScratch.BingWallpaper.');
    expect(script).toContain('Description -ne $p.marker');
    expect(script).toContain('$d.Settings.StartWhenAvailable = $true');
  });
  it('enables/queries/disables Windows using encoded execFile arguments and actual responses', async () => {
    let exists = false;
    const run = vi.fn<Run>(async (_file, args) => {
      const script = Buffer.from(args.at(-1)!, 'base64').toString('utf16le');
      const data = JSON.parse(Buffer.from(script.match(/FromBase64String\('([^']+)'\)/)![1]!, 'base64').toString());
      if (data.action === 'enable') exists = true;
      if (data.action === 'disable') exists = false;
      return JSON.stringify({
        registered: exists,
        enabled: exists,
        name: 'owned-task',
        node: process.execPath,
        arguments: `"${cli}" refresh --scheduled`,
        lastResult: 0
      });
    });
    const scheduler = createScheduler(s.paths, { platform: 'win32', run, cli });
    expect((await scheduler.enable('09:00')).runtimeHealthy).toBe(true);
    expect((await scheduler.status()).enabled).toBe(true);
    expect((await scheduler.disable()).registered).toBe(false);
    const [file, args] = run.mock.calls[0]!;
    expect(file).toMatch(/powershell\.exe$/);
    expect(args).toContain('-EncodedCommand');
  });
  it('flags missing runtime paths and propagates Windows command failures', async () => {
    const run = vi.fn<Run>(async () =>
      JSON.stringify({
        registered: true,
        enabled: true,
        name: 'owned-task',
        node: '/missing-node',
        arguments: '"/missing-cli" refresh --scheduled'
      })
    );
    const scheduler = createScheduler(s.paths, { platform: 'win32', run, cli });
    expect((await scheduler.status()).runtimeHealthy).toBe(false);
    run.mockRejectedValueOnce(new Error('denied'));
    await expect(scheduler.disable()).rejects.toMatchObject({ code: 'SCHEDULER' });
    await expect(scheduler.enable('99:00')).rejects.toMatchObject({ code: 'USAGE' });
  });
});
