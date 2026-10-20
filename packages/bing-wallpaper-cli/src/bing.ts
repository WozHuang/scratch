import { setTimeout as delay } from 'node:timers/promises';
import { imageSize } from 'image-size';
import { WallpaperError, errorMessage } from './errors.js';
import type { BingImage } from './types.js';

export type Fetch = typeof globalThis.fetch;
export class HttpError extends WallpaperError {
  constructor(public status: number) {
    super('NETWORK', `Bing 返回 HTTP ${status}。`);
  }
}

export function bingUrl(value: string): string {
  const url = new URL(value, 'https://www.bing.com');
  if (
    url.protocol !== 'https:' ||
    !['www.bing.com', 'cn.bing.com'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new WallpaperError('BING', 'Bing 接口返回了不可信的图片或来源地址。');
  return url.href;
}

export function parseBing(data: unknown, market: string): BingImage {
  const item = (data as { images?: Record<string, unknown>[] })?.images?.[0];
  if (
    !item ||
    !/^\d{8}$/.test(String(item.startdate)) ||
    typeof item.urlbase !== 'string' ||
    !item.urlbase.startsWith('/th?id=OHR.') ||
    typeof item.url !== 'string'
  )
    throw new WallpaperError('BING', 'Bing 接口格式异常或当天图片不存在。');
  return {
    date: String(item.startdate),
    market,
    title: typeof item.title === 'string' ? item.title : '',
    copyright: typeof item.copyright === 'string' ? item.copyright : '',
    copyrightLink: bingUrl(typeof item.copyrightlink === 'string' ? item.copyrightlink : '/'),
    urlbase: bingUrl(item.urlbase),
    url: bingUrl(item.url)
  };
}

// The timeout includes response body reads; retry only transient transport/HTTP errors.
export async function requestBytes(
  url: string,
  fetcher: Fetch = fetch,
  limit = 40 * 1024 * 1024,
  timeout = 15_000,
  retries = 2
): Promise<Uint8Array> {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(url, {
        signal: controller.signal,
        redirect: 'error',
        headers: { 'User-Agent': 'woz-scratch-bing-wallpaper/0.1' }
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new HttpError(response.status);
      }
      if (!response.body) throw new WallpaperError('IMAGE', 'Bing 返回空内容。');
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > limit) {
            await reader.cancel();
            throw new WallpaperError('IMAGE', '响应内容超过允许大小。');
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      return Buffer.concat(chunks);
    } catch (error) {
      const transient =
        !(error instanceof WallpaperError) ||
        (error instanceof HttpError && (error.status === 429 || error.status >= 500));
      if (!transient || attempt >= retries) {
        if (error instanceof WallpaperError) throw error;
        throw new WallpaperError('NETWORK', `网络请求失败（已设置超时及有限重试）：${errorMessage(error)}`, {
          cause: error
        });
      }
    } finally {
      clearTimeout(timer);
    }
    await delay(250 * 2 ** attempt);
  }
}

export async function fetchToday(market: string, fetcher?: Fetch): Promise<BingImage> {
  const url = new URL('https://www.bing.com/HPImageArchive.aspx');
  url.search = new URLSearchParams({ format: 'js', idx: '0', n: '1', mkt: market }).toString();
  const bytes = await requestBytes(url.href, fetcher, 1024 * 1024);
  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(bytes).toString('utf8'));
  } catch (cause) {
    throw new WallpaperError('BING', 'Bing 返回的内容不是有效 JSON。', { cause });
  }
  return parseBing(data, market);
}

export function imageCandidates(image: BingImage, preferred: string): { resolution: string; url: string }[] {
  const ladder = ['UHD', '3840x2160', '1920x1200', '1920x1080', '1366x768', '1280x720', '1024x768'];
  const start = ladder.indexOf(preferred);
  const sizes = ladder.slice(start < 0 ? 0 : start);
  const candidates = sizes.map((resolution) => {
    const url = new URL(image.urlbase);
    url.searchParams.set('id', `${url.searchParams.get('id')}_${resolution}.jpg`);
    return { resolution, url: url.href };
  });
  if (!candidates.some((c) => c.url === image.url)) candidates.push({ resolution: 'original', url: image.url });
  return candidates;
}

export function validateImage(bytes: Uint8Array): void {
  try {
    const result = imageSize(bytes);
    if (
      result.type !== 'jpg' ||
      !result.width ||
      !result.height ||
      result.width < 100 ||
      result.height < 100 ||
      bytes[0] !== 255 ||
      bytes[1] !== 216 ||
      bytes[bytes.length - 2] !== 255 ||
      bytes[bytes.length - 1] !== 217
    )
      throw new Error('JPEG 格式、尺寸或结束标记不正确');
  } catch (cause) {
    throw new WallpaperError('IMAGE', '下载内容不是完整的 JPEG 图片。', { cause });
  }
}
