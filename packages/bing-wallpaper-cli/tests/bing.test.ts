import { describe, expect, it, vi } from 'vitest';
import {
  bingUrl,
  fetchToday,
  imageCandidates,
  parseBing,
  requestBytes,
  validateImage,
  type Fetch
} from '../src/bing.js';
import { apiData, jpeg } from './helpers.js';

describe('Bing provider', () => {
  it('parses dates, copyright and trusted URLs', () => {
    const image = parseBing(apiData, 'zh-CN');
    expect(image).toMatchObject({ date: '20261020', title: '每日图片', market: 'zh-CN', copyright: '© Test' });
    expect(image.copyrightLink).toBe('https://www.bing.com/search?q=test');
  });
  it.each([null, {}, { images: [] }, { images: [{}] }])('rejects malformed/empty data %j', (input) => {
    expect(() => parseBing(input, 'en-US')).toThrow(/格式异常/);
  });
  it.each(['http://www.bing.com/th', 'https://evil.test/x', '//evil.test/x', 'https://user@www.bing.com/x'])(
    'rejects unsafe URLs %s',
    (url) => {
      expect(() => bingUrl(url)).toThrow();
    }
  );
  it('chooses UHD and only lower preferences before original', () => {
    const image = parseBing(apiData, 'zh-CN');
    expect(imageCandidates(image, 'UHD')[0]?.url).toContain('_UHD.jpg');
    const candidates = imageCandidates(image, '1920x1080');
    expect(candidates.map((c) => c.resolution)).toEqual(['1920x1080', '1366x768', '1280x720', '1024x768']);
    expect(new Set(candidates.map((c) => c.url)).size).toBe(candidates.length);
  });
  it('sends the requested market and rejects non-JSON', async () => {
    const fetcher = vi.fn<Fetch>(async () => new Response('<html/>'));
    await expect(fetchToday('ja-JP', fetcher)).rejects.toMatchObject({ code: 'BING' });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('mkt=ja-JP');
  });
  it('retries transient failures a finite number of times', async () => {
    const fetcher = vi.fn<Fetch>(async () => {
      throw new Error('offline');
    });
    await expect(requestBytes('https://www.bing.com', fetcher, 100, 100, 1)).rejects.toMatchObject({ code: 'NETWORK' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('does not retry HTTP 404; retries 503 then succeeds', async () => {
    const missing = vi.fn<Fetch>(async () => new Response('', { status: 404 }));
    await expect(requestBytes('https://www.bing.com', missing)).rejects.toMatchObject({ status: 404 });
    expect(missing).toHaveBeenCalledTimes(1);
    const transient = vi
      .fn<Fetch>()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok'));
    expect(Buffer.from(await requestBytes('https://www.bing.com', transient)).toString()).toBe('ok');
    expect(transient).toHaveBeenCalledTimes(2);
  });
  it('aborts stalled response bodies and enforces the byte limit', async () => {
    const stalled: Fetch = async (_url, init) =>
      new Response(
        new ReadableStream({
          start(controller) {
            init?.signal?.addEventListener('abort', () => controller.error(new Error('aborted')));
          }
        })
      );
    await expect(requestBytes('https://www.bing.com', stalled, 10, 10, 0)).rejects.toMatchObject({ code: 'NETWORK' });
    await expect(requestBytes('https://www.bing.com', async () => new Response('too large'), 2)).rejects.toMatchObject({
      code: 'IMAGE'
    });
  });
  it('accepts a real JPEG and rejects HTML/truncated JPEGs', () => {
    expect(() => validateImage(jpeg)).not.toThrow();
    expect(() => validateImage(new TextEncoder().encode('<html>error</html>'))).toThrow();
    expect(() => validateImage(jpeg.slice(0, -2))).toThrow();
  });
});
