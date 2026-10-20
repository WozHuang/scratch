import { isAbsolute, join, resolve } from 'node:path';
import { WallpaperError } from './errors.js';
import { readJson, writeJson } from './storage.js';
import type { AppPaths, Config } from './types.js';

export const resolutions = ['UHD', '3840x2160', '1920x1200', '1920x1080', '1366x768', '1280x720', '1024x768'] as const;

export function validateConfig(value: unknown): asserts value is Config {
  const c = value as Config;
  if (!c || typeof c !== 'object' || typeof c.market !== 'string' || !/^[a-z]{2,3}-[A-Z]{2}$/.test(c.market))
    throw new WallpaperError('USAGE', 'market 格式应为 zh-CN、ja-JP 或 en-US。');
  if (!resolutions.includes(c.resolution as (typeof resolutions)[number]))
    throw new WallpaperError('USAGE', `resolution 应为 ${resolutions.join(', ')}。`);
  if (typeof c.downloadDir !== 'string' || !isAbsolute(c.downloadDir) || /[\x00-\x1f]/.test(c.downloadDir))
    throw new WallpaperError('USAGE', 'downloadDir 必须是有效的绝对路径。');
  if (typeof c.autoTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(c.autoTime))
    throw new WallpaperError('USAGE', 'autoTime/--time 必须为 24 小时制 HH:mm。');
  if (!Number.isInteger(c.retentionDays) || c.retentionDays < 0 || c.retentionDays > 36500)
    throw new WallpaperError('USAGE', 'retentionDays 必须为 0–36500 的整数（0 表示关闭清理）。');
}

export async function loadConfig(paths: AppPaths): Promise<Config> {
  const defaults: Config = {
    market: 'zh-CN',
    resolution: 'UHD',
    downloadDir: join(paths.data, 'wallpapers'),
    autoTime: '09:00',
    retentionDays: 30
  };
  const config = await readJson<Config>(join(paths.config, 'config.json'), defaults);
  try {
    validateConfig(config);
  } catch (cause) {
    throw new WallpaperError('STORAGE', `配置无效：${join(paths.config, 'config.json')}。请备份后修复或移走该文件。`, {
      cause
    });
  }
  return config;
}

export async function saveConfig(paths: AppPaths, config: Config): Promise<void> {
  validateConfig(config);
  await writeJson(join(paths.config, 'config.json'), config);
}

export async function updateConfig(paths: AppPaths, key: string, value: string): Promise<Config> {
  if (!['market', 'resolution', 'downloadDir', 'autoTime', 'retentionDays'].includes(key))
    throw new WallpaperError('USAGE', `未知配置项：${key}`);
  const config = await loadConfig(paths);
  const next = {
    ...config,
    [key]:
      key === 'retentionDays'
        ? /^\d+$/.test(value)
          ? Number(value)
          : NaN
        : key === 'downloadDir'
          ? resolve(value)
          : value
  };
  await saveConfig(paths, next);
  return next;
}
