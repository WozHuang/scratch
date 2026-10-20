import { createHash } from 'node:crypto';
import { readFile, rm, lstat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import {
  bingUrl,
  fetchToday,
  HttpError,
  imageCandidates,
  parseBing,
  requestBytes,
  validateImage,
  type Fetch
} from './bing.js';
import { loadConfig, validateConfig } from './config.js';
import { assertPlatform, systemDesktop } from './desktop.js';
import { WallpaperError, errorMessage } from './errors.js';
import { atomicWrite, defaultPaths, readJson, withLock, writeJson } from './storage.js';
import type {
  AppPaths,
  BingImage,
  Config,
  Desktop,
  State,
  WallpaperOptions,
  WallpaperRecord,
  WallpaperResult
} from './types.js';

export const owner = 'woz-scratch-bing-wallpaper-v1' as const;
const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const day = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

function validRecord(record: WallpaperRecord): boolean {
  return (
    !!record &&
    record.managedBy === owner &&
    typeof record.path === 'string' &&
    /^bing-\d{8}-[\w-]+-[a-f\d]{12}-[\w-]+-[a-f\d]{12}\.jpg$/.test(basename(record.path)) &&
    typeof record.sha256 === 'string' &&
    /^[a-f\d]{64}$/.test(record.sha256) &&
    Number.isFinite(Date.parse(record.downloadedAt))
  );
}

export async function loadState(paths: AppPaths): Promise<State> {
  const state = await readJson<State>(join(paths.data, 'state.json'), { downloads: [] });
  if (
    !state ||
    !Array.isArray(state.downloads) ||
    !state.downloads.every(validRecord) ||
    (state.current && !validRecord(state.current)) ||
    (state.protectedPaths &&
      (!Array.isArray(state.protectedPaths) || !state.protectedPaths.every((p) => typeof p === 'string')))
  )
    throw new WallpaperError('STORAGE', 'state.json 内容无效，请备份后修复或移走该文件。');
  return state;
}

async function validCached(record: WallpaperRecord): Promise<boolean> {
  try {
    const info = await lstat(record.path);
    if (!info.isFile() || info.size > 40 * 1024 * 1024) return false;
    const bytes = await readFile(record.path);
    validateImage(bytes);
    return hash(bytes) === record.sha256;
  } catch {
    return false;
  }
}

// Delete only files recorded by this tool, with an intact matching sidecar.
// Unobservable macOS Spaces are protected through the persistent applied-path list.
export async function cleanup(state: State, config: Config, desktop: Desktop, now: Date): Promise<string[]> {
  if (config.retentionDays === 0) return [];
  let current: string[];
  try {
    current = await desktop.get();
  } catch {
    return ['无法读取系统当前壁纸，已安全跳过历史清理。'];
  }
  const normalized = (path: string) => (process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path));
  const protectedPaths = new Set(
    [...current, ...(state.protectedPaths ?? []), ...(state.current ? [state.current.path] : [])].map(normalized)
  );
  const warnings: string[] = [];
  const remaining: WallpaperRecord[] = [];
  for (const record of state.downloads) {
    if (
      protectedPaths.has(normalized(record.path)) ||
      now.getTime() - Date.parse(record.downloadedAt) < config.retentionDays * 86400_000
    ) {
      remaining.push(record);
      continue;
    }
    try {
      const sidecar = `${record.path}.json`;
      const meta = await readJson<WallpaperRecord | null>(sidecar, null);
      if (
        !meta ||
        meta.path !== record.path ||
        meta.sha256 !== record.sha256 ||
        !validRecord(meta) ||
        !(await validCached(record))
      ) {
        remaining.push(record);
        continue;
      }
      await rm(record.path);
      await rm(sidecar, { force: true });
    } catch (error) {
      warnings.push(`历史文件清理失败：${record.path}：${errorMessage(error)}`);
      remaining.push(record);
    }
  }
  state.downloads = remaining;
  return warnings;
}

export interface ClientDependencies {
  paths?: AppPaths;
  fetch?: Fetch;
  desktop?: Desktop;
  platform?: NodeJS.Platform;
  now?: () => Date;
}

export function createClient(deps: ClientDependencies = {}) {
  const paths = deps.paths ?? defaultPaths();
  const platform = deps.platform ?? process.platform;
  const desktop = deps.desktop ?? systemDesktop(platform);
  const now = deps.now ?? (() => new Date());

  async function perform(options: WallpaperOptions, apply: boolean): Promise<WallpaperResult> {
    if (apply) assertPlatform(platform);
    try {
      return await withLock(paths, async () => {
        const config = await loadConfig(paths);
        if (options.market !== undefined) config.market = options.market;
        if (options.resolution !== undefined) config.resolution = options.resolution;
        if (options.output !== undefined) config.downloadDir = resolve(options.output);
        validateConfig(config);
        const state = await loadState(paths);
        const cachePath = join(paths.cache, `${config.market}.json`);
        // Metadata is expendable: corrupt cache is refetched, unlike user configuration.
        let metadata: { fetchedDay: string; image: BingImage } | null = null;
        if (!options.force) {
          try {
            metadata = await readJson<{ fetchedDay: string; image: BingImage } | null>(cachePath, null);
          } catch {
            /* refetch */
          }
        }
        let image: BingImage | undefined;
        if (metadata?.fetchedDay === day(now()) && metadata.image?.market === config.market && metadata.image.urlbase) {
          try {
            const cached = metadata.image;
            const base = new URL(bingUrl(cached.urlbase));
            image = parseBing(
              {
                images: [
                  {
                    startdate: cached.date,
                    title: cached.title,
                    copyright: cached.copyright,
                    copyrightlink: cached.copyrightLink,
                    urlbase: base.pathname + base.search,
                    url: cached.url
                  }
                ]
              },
              config.market
            );
          } catch {
            /* Invalid cached metadata is expendable. */
          }
        }
        if (!image) {
          image = await fetchToday(config.market, deps.fetch);
          await writeJson(cachePath, { fetchedDay: day(now()), image });
        }
        let record: WallpaperRecord | undefined;
        let cached = false;
        const candidates = imageCandidates(image, config.resolution);
        // Match the whole fallback chain, so unavailable UHD isn't retried every run.
        if (!options.force) {
          for (const candidate of candidates) {
            const found = state.downloads.find(
              (r) =>
                r.market === image!.market &&
                r.date === image!.date &&
                r.imageUrl === candidate.url &&
                dirname(r.path) === config.downloadDir
            );
            if (found && (await validCached(found))) {
              record = found;
              cached = true;
              break;
            }
          }
        }
        if (!record) {
          for (const candidate of candidates) {
            let bytes: Uint8Array;
            try {
              bytes = await requestBytes(candidate.url, deps.fetch);
              validateImage(bytes);
            } catch (error) {
              if (
                (error instanceof HttpError && [400, 404, 410].includes(error.status)) ||
                (error instanceof WallpaperError && error.code === 'IMAGE')
              )
                continue;
              throw error;
            }
            const sha256 = hash(bytes);
            const slug = new URL(image.urlbase).searchParams
              .get('id')!
              .replace(/^OHR\./, '')
              .replace(/[^\w-]/g, '-')
              .slice(0, 64);
            const name = `bing-${image.date}-${image.market}-${slug}-${hash(image.urlbase).slice(0, 12)}-${candidate.resolution}-${sha256.slice(0, 12)}.jpg`;
            const path = join(config.downloadDir, name);
            record = {
              ...image,
              managedBy: owner,
              path,
              resolution: candidate.resolution,
              imageUrl: candidate.url,
              downloadedAt: now().toISOString(),
              sha256
            };
            // Content-addressed filenames keep an existing wallpaper intact on failure.
            await atomicWrite(path, bytes);
            await writeJson(`${path}.json`, record);
            state.downloads = state.downloads.filter((r) => r.path !== path);
            state.downloads.push(record);
            await writeJson(join(paths.data, 'state.json'), state);
            break;
          }
        }
        if (!record) throw new WallpaperError('IMAGE', '所有候选分辨率均不可用，保留现有壁纸。');
        let applied = false;
        if (apply) {
          let active: string[] = [];
          try {
            active = await desktop.get();
          } catch {
            /* set may still succeed */
          }
          if (options.force || active.length === 0 || !active.every((p) => resolve(p) === resolve(record!.path))) {
            await desktop.set(record.path);
            applied = true;
          }
          state.current = record;
          if (platform === 'darwin')
            state.protectedPaths = [...new Set([...(state.protectedPaths ?? []), record.path])];
          await writeJson(join(paths.data, 'state.json'), state);
        }
        const warnings = await cleanup(state, config, desktop, now());
        await writeJson(join(paths.data, 'state.json'), state);
        return { image: record, cached, applied, warnings };
      });
    } catch (error) {
      if (error instanceof WallpaperError) throw error;
      throw new WallpaperError('STORAGE', `本地文件操作失败：${errorMessage(error)}`, { cause: error });
    }
  }

  return {
    paths,
    refreshWallpaper: (options: WallpaperOptions = {}) => perform(options, true),
    downloadWallpaper: (options: WallpaperOptions = {}) => perform(options, false),
    async getInfo() {
      const state = await loadState(paths);
      let systemPaths: string[] = [];
      let warning: string | undefined;
      try {
        systemPaths = await desktop.get();
      } catch (error) {
        warning = errorMessage(error);
      }
      return {
        current: state.current ?? null,
        lastDownload: state.downloads.at(-1) ?? null,
        systemPaths,
        warning,
        paths
      };
    }
  };
}
