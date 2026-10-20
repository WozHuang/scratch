import { describe, expect, it, vi, beforeEach } from 'vitest';
import { systemDesktop } from '../src/desktop.js';
const mocks = vi.hoisted(() => ({ getWallpaper: vi.fn(), setWallpaper: vi.fn() }));
vi.mock('wallpaper', () => mocks);
beforeEach(() => {
  vi.resetAllMocks();
});
describe('desktop dependency adapters', () => {
  it('sets Windows paths as library arguments including Unicode and spaces', async () => {
    const desktop = systemDesktop('win32');
    const path = 'C:\\图片 folder\\daily.jpg';
    await desktop.set(path);
    expect(mocks.setWallpaper).toHaveBeenCalledWith(path, { scale: 'fill' });
    mocks.getWallpaper.mockResolvedValue(path);
    expect(await desktop.get()).toEqual([path]);
  });
  it('sets and queries all currently observable macOS screens', async () => {
    const desktop = systemDesktop('darwin');
    await desktop.set('/Users/test/图片 folder/test.jpg');
    expect(mocks.setWallpaper).toHaveBeenCalledWith('/Users/test/图片 folder/test.jpg', {
      screen: 'all',
      scale: 'fill'
    });
    mocks.getWallpaper.mockResolvedValue(['/one.jpg', '/two.jpg']);
    expect(await desktop.get()).toEqual(['/one.jpg', '/two.jpg']);
    expect(mocks.getWallpaper).toHaveBeenCalledWith({ screen: 'all' });
  });
  it('wraps permission errors and rejects Linux', async () => {
    mocks.setWallpaper.mockRejectedValue(new Error('denied'));
    await expect(systemDesktop('darwin').set('/image.jpg')).rejects.toMatchObject({ code: 'WALLPAPER' });
    await expect(systemDesktop('linux').set('/image.jpg')).rejects.toMatchObject({ code: 'PLATFORM' });
    expect(mocks.setWallpaper).toHaveBeenCalledTimes(1);
  });
});
