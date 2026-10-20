import { Command, CommanderError, Option } from 'commander';
import { loadConfig, saveConfig, updateConfig } from './config.js';
import { WallpaperError, exitCodes, errorMessage } from './errors.js';
import { appendLog } from './log.js';
import { createClient } from './service.js';
import { createScheduler } from './scheduler.js';
import { withLock } from './storage.js';
import type { WallpaperOptions } from './types.js';

interface IO {
  out(text: string): void;
  error(text: string): void;
}

export async function runCli(
  args: string[],
  client = createClient(),
  scheduler = createScheduler(client.paths),
  io: IO = { out: (s) => process.stdout.write(s), error: (s) => process.stderr.write(s) }
): Promise<number> {
  const program = new Command();
  let executed = false;
  program
    .name('bing-wallpaper')
    .description('获取 Bing 每日图片并设置桌面壁纸')
    .version('0.1.0')
    .option('--market <market>', 'Bing 地区（默认读取配置，初始为 zh-CN）')
    .option('--resolution <resolution>', '优先分辨率（初始为 UHD）')
    .option('--output <directory>', '下载目录（仅本次）')
    .option('--force', '强制重新获取、下载及设置')
    .option('--quiet', '仅输出错误')
    .option('--json', '输出 JSON（优先于 quiet）')
    .addOption(new Option('--scheduled').hideHelp())
    .configureOutput({ writeOut: io.out, writeErr: () => {} })
    .exitOverride();

  const output = (value: unknown, message: string) => {
    executed = true;
    const opts = program.opts();
    if (opts.json) io.out(`${JSON.stringify(value)}\n`);
    else if (!opts.quiet && !opts.scheduled) io.out(`${message}\n`);
  };
  const refresh = async (apply: boolean) => {
    const opts = program.opts();
    const options: WallpaperOptions = {
      market: opts.market,
      resolution: opts.resolution,
      output: opts.output,
      force: opts.force
    };
    const result = await (apply ? client.refreshWallpaper(options) : client.downloadWallpaper(options));
    if (opts.scheduled) await appendLog(client.paths, { ok: true, ...result });
    output(
      result,
      `${apply ? (result.applied ? '已设置壁纸' : '当前已是该壁纸') : '已下载'}：${result.image.path}${result.warnings.length ? `\n${result.warnings.join('\n')}` : ''}`
    );
  };
  program.action(() => refresh(true));
  program
    .command('refresh')
    .description('获取今日图片，下载并设置；已在使用时跳过重复设置')
    .action(() => refresh(true));
  program
    .command('download')
    .description('仅获取和下载，不改变桌面')
    .action(() => refresh(false));
  program
    .command('info')
    .description('读取最后设置/下载的图片元数据和系统壁纸路径，不联网')
    .action(async () => {
      const info = await client.getInfo();
      output(info, JSON.stringify(info, null, 2));
    });
  const config = program.command('config').description('查看及修改用户配置');
  config.command('list').action(async () => {
    const c = await loadConfig(client.paths);
    output(c, JSON.stringify(c, null, 2));
  });
  config
    .command('set <key> <value>')
    .description('支持 market/resolution/downloadDir/autoTime/retentionDays')
    .action(async (key: string, value: string) => {
      const result = await withLock(client.paths, () => updateConfig(client.paths, key, value));
      output(result, `已保存配置：${key}${key === 'autoTime' ? '（执行 auto enable 使任务时间生效）' : ''}`);
    });
  const auto = program.command('auto').description('管理当前用户的原生每日任务');
  auto
    .command('enable')
    .description('创建或更新每日任务，默认 09:00')
    .option('--time <HH:mm>', '本地时间')
    .action(async (opts: { time?: string }) => {
      const result = await withLock(client.paths, async () => {
        const c = await loadConfig(client.paths);
        const time = opts.time ?? c.autoTime;
        const result = await scheduler.enable(time);
        await saveConfig(client.paths, { ...c, autoTime: time });
        return result;
      });
      output(result, `已启用每日任务：${result.name}\n${JSON.stringify(result, null, 2)}`);
    });
  auto
    .command('status')
    .description('查询真实系统任务和运行路径')
    .action(async () => {
      const result = await scheduler.status();
      output(result, JSON.stringify(result, null, 2));
    });
  auto
    .command('disable')
    .description('只删除本工具创建的当前用户任务')
    .action(async () => {
      const result = await withLock(client.paths, () => scheduler.disable());
      output(result, '已禁用并移除本工具的每日任务。');
    });
  try {
    await program.parseAsync(args, { from: 'user' });
    // Parent-only commands such as `auto` should show usage, never silently refresh.
    if (!executed) return 0;
    return 0;
  } catch (error) {
    if (error instanceof CommanderError && error.exitCode === 0) return 0;
    const failure =
      error instanceof WallpaperError
        ? error
        : new WallpaperError(error instanceof CommanderError ? 'USAGE' : 'STORAGE', errorMessage(error), {
            cause: error
          });
    const body = { error: { code: failure.code, message: failure.message } };
    const opts = program.opts();
    // Raw args are used only to honor JSON on parser failures before options are assigned.
    if (opts.json || args.includes('--json')) io.error(`${JSON.stringify(body)}\n`);
    else io.error(`错误 [${failure.code}]：${failure.message}\n`);
    if (opts.scheduled) {
      try {
        await appendLog(client.paths, body);
      } catch (logError) {
        io.error(`日志写入失败：${errorMessage(logError)}\n`);
      }
    }
    return exitCodes[failure.code];
  }
}
