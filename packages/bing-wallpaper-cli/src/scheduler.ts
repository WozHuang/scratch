import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPlatform } from './desktop.js';
import { WallpaperError, errorMessage, isMissing } from './errors.js';
import { atomicWrite } from './storage.js';
import type { AppPaths } from './types.js';

const exec = promisify(execFile);
export type Run = (file: string, args: string[]) => Promise<string>;
export const runCommand: Run = async (file, args) => {
  const { stdout } = await exec(file, args, {
    timeout: 30_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
    encoding: 'utf8',
    shell: false
  });
  return stdout;
};

export const label = 'com.woz-scratch.bing-wallpaper';
const marker = 'Managed by @woz-scratch/bing-wallpaper-cli v1';
const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const unxml = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

export function launchAgent(node: string, cli: string, paths: AppPaths, time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>Comment</key><string>${marker}</string>
<key>ProgramArguments</key><array><string>${xml(node)}</string><string>${xml(cli)}</string><string>refresh</string><string>--scheduled</string></array>
<key>StartCalendarInterval</key><dict><key>Hour</key><integer>${hour}</integer><key>Minute</key><integer>${minute}</integer></dict>
<key>LimitLoadToSessionType</key><string>Aqua</string>
<key>ProcessType</key><string>Background</string>
<key>StandardOutPath</key><string>${xml(join(paths.log, 'launchd.stdout.log'))}</string>
<key>StandardErrorPath</key><string>${xml(join(paths.log, 'launchd.stderr.log'))}</string>
</dict></plist>\n`;
}

// Only Base64-encoded JSON is interpolated. Paths never become PowerShell code.
// COM provides locale-independent HRESULTs and real registered task properties.
export function windowsScript(action: string, payload: Record<string, string> = {}): string {
  const data = Buffer.from(JSON.stringify({ ...payload, action, marker }), 'utf8').toString('base64');
  return `$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$p = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${data}')) | ConvertFrom-Json
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$name = 'WozScratch.BingWallpaper.' + $sid
$service = New-Object -ComObject 'Schedule.Service'
$service.Connect()
$folder = $service.GetFolder('\\')
$task = $null
try { $task = $folder.GetTask($name) } catch {
  $e = $_.Exception
  while ($e.InnerException) { $e = $e.InnerException }
  if ($e.HResult -ne -2147024894) { throw }
}
if ($task -and $task.Definition.RegistrationInfo.Description -ne $p.marker) {
  throw '同名任务不属于本工具，拒绝修改。'
}
if ($p.action -eq 'enable') {
  $d = $service.NewTask(0)
  $d.RegistrationInfo.Description = $p.marker
  $d.RegistrationInfo.Author = $sid
  $d.Principal.UserId = $sid
  $d.Principal.LogonType = 3
  $d.Principal.RunLevel = 0
  $d.Settings.Enabled = $true
  $d.Settings.StartWhenAvailable = $true
  $d.Settings.DisallowStartIfOnBatteries = $false
  $d.Settings.StopIfGoingOnBatteries = $false
  $d.Settings.MultipleInstances = 2
  $d.Settings.ExecutionTimeLimit = 'PT10M'
  $t = $d.Triggers.Create(2)
  $t.StartBoundary = [DateTime]::Today.ToString('yyyy-MM-dd') + 'T' + $p.time + ':00'
  $t.DaysInterval = 1
  $t.Enabled = $true
  $login = $d.Triggers.Create(9)
  $login.UserId = $sid
  $login.Enabled = $true
  $login.Delay = 'PT30S'
  $a = $d.Actions.Create(0)
  $a.Path = $p.node
  $a.Arguments = '"' + $p.cli + '" refresh --scheduled'
  $a.WorkingDirectory = $p.cwd
  $task = $folder.RegisterTaskDefinition($name, $d, 6, $sid, $null, 3, $null)
} elseif ($p.action -eq 'disable') {
  if ($task) { $folder.DeleteTask($name, 0) }
  $task = $null
}
if ($task) {
  @{ registered = $true; enabled = [bool]$task.Enabled; name = $name; state = [int]$task.State;
    lastResult = [int]$task.LastTaskResult; lastRun = $task.LastRunTime.ToString('o');
    nextRun = $task.NextRunTime.ToString('o'); node = $task.Definition.Actions.Item(1).Path;
    arguments = $task.Definition.Actions.Item(1).Arguments;
    time = $task.Definition.Triggers.Item(1).StartBoundary } | ConvertTo-Json -Compress
} else { @{ registered = $false; enabled = $false; name = $name } | ConvertTo-Json -Compress }
`;
}

export interface ScheduleStatus {
  registered: boolean;
  enabled: boolean;
  name: string;
  node?: string;
  cli?: string;
  time?: string;
  runtimeHealthy?: boolean;
  details?: string;
  arguments?: string;
  lastResult?: number;
  lastRun?: string;
  nextRun?: string;
}

interface SchedulerOptions {
  platform?: NodeJS.Platform;
  run?: Run;
  home?: string;
  uid?: number;
  node?: string;
  cli?: string;
}

export function createScheduler(paths: AppPaths, options: SchedulerOptions = {}) {
  const platform = options.platform ?? process.platform;
  const run = options.run ?? runCommand;
  const home = options.home ?? homedir();
  const uid = options.uid ?? process.getuid?.();
  const nodePath = options.node ?? process.execPath;
  const cliPath = options.cli ?? fileURLToPath(new URL('./cli.js', import.meta.url));
  const plistPath = join(home, 'Library', 'LaunchAgents', `${label}.plist`);
  const target = `gui/${uid}/${label}`;

  async function command(file: string, args: string[]) {
    try {
      return await run(file, args);
    } catch (cause) {
      throw new WallpaperError('SCHEDULER', `系统任务操作失败：${errorMessage(cause)}`, { cause });
    }
  }
  async function windows(action: string, time?: string): Promise<ScheduleStatus> {
    const script = windowsScript(
      action,
      action === 'enable'
        ? { time: time!, node: await realpath(nodePath), cli: await realpath(cliPath), cwd: dirname(cliPath) }
        : {}
    );
    const powershell = join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      'WindowsPowerShell',
      'v1.0',
      'powershell.exe'
    );
    const output = await command(powershell, [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-EncodedCommand',
      Buffer.from(script, 'utf16le').toString('base64')
    ]);
    try {
      return JSON.parse(output.replace(/^\uFEFF/, '').trim()) as ScheduleStatus;
    } catch (cause) {
      throw new WallpaperError('SCHEDULER', '无法解析 Windows 任务调度器返回的数据。', { cause });
    }
  }
  async function macFile(): Promise<string | null> {
    try {
      const content = await readFile(plistPath, 'utf8');
      if (
        !content.includes(`<key>Comment</key><string>${marker}</string>`) ||
        !content.includes(`<key>Label</key><string>${label}</string>`)
      )
        throw new WallpaperError('SCHEDULER', '同名 LaunchAgent 不属于本工具，拒绝修改。');
      return content;
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }
  async function macLoaded(): Promise<string | null> {
    if (uid === undefined) throw new WallpaperError('SCHEDULER', '无法确定当前用户 UID。');
    try {
      return await run('/bin/launchctl', ['print', target]);
    } catch (error) {
      // Do not mistake permission/launchctl failures for a disabled task.
      if ((error as { code?: number }).code === 113) return null;
      throw new WallpaperError('SCHEDULER', `无法查询 LaunchAgent：${errorMessage(error)}`, { cause: error });
    }
  }
  async function macStatus(): Promise<ScheduleStatus> {
    const content = await macFile();
    const details = await macLoaded();
    if (details !== null && !content)
      throw new WallpaperError('SCHEDULER', '发现同名已加载任务，但缺少本工具的 LaunchAgent 文件；拒绝修改。');
    const array = content?.match(/<key>ProgramArguments<\/key>\s*<array>(.*?)<\/array>/s)?.[1];
    const args = [...(array?.matchAll(/<string>(.*?)<\/string>/gs) ?? [])].map((m) => unxml(m[1]!));
    return {
      registered: !!content,
      enabled: details !== null,
      name: label,
      node: args[0],
      cli: args[1],
      details: details ?? undefined
    };
  }
  async function status(): Promise<ScheduleStatus> {
    assertPlatform(platform);
    const result = platform === 'win32' ? await windows('status') : await macStatus();
    if (platform === 'win32' && result.arguments)
      result.cli = result.arguments.match(/^"([^"]+)" refresh --scheduled$/)?.[1];
    if (result.registered) {
      result.runtimeHealthy = !!result.node && !!result.cli;
      if (result.runtimeHealthy) {
        try {
          await access(result.node!);
          await access(result.cli!);
        } catch {
          result.runtimeHealthy = false;
        }
      }
    }
    return result;
  }
  return {
    status,
    async enable(time: string): Promise<ScheduleStatus> {
      assertPlatform(platform);
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new WallpaperError('USAGE', '--time 必须为 HH:mm。');
      await mkdir(paths.log, { recursive: true });
      if (platform === 'win32') await windows('enable', time);
      else {
        const before = await macStatus();
        const previous = await macFile();
        const content = launchAgent(await realpath(nodePath), await realpath(cliPath), paths, time);
        if (before.enabled) await command('/bin/launchctl', ['bootout', target]);
        await atomicWrite(plistPath, content);
        try {
          await command('/bin/launchctl', ['enable', target]);
          await command('/bin/launchctl', ['bootstrap', `gui/${uid}`, plistPath]);
        } catch (error) {
          if (previous) {
            await atomicWrite(plistPath, previous);
            if (before.enabled) await command('/bin/launchctl', ['bootstrap', `gui/${uid}`, plistPath]);
          } else await rm(plistPath, { force: true });
          throw error;
        }
      }
      return status();
    },
    async disable(): Promise<ScheduleStatus> {
      assertPlatform(platform);
      if (platform === 'win32') await windows('disable');
      else {
        const before = await macStatus();
        if (before.enabled) await command('/bin/launchctl', ['bootout', target]);
        if (before.registered) await rm(plistPath);
      }
      return status();
    }
  };
}
