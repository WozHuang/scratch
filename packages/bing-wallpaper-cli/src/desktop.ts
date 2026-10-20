import { WallpaperError, errorMessage } from './errors.js';
import type { Desktop } from './types.js';

export function assertPlatform(platform = process.platform): void {
  if (platform !== 'win32' && platform !== 'darwin')
    throw new WallpaperError('PLATFORM', '设置壁纸和自动更新仅支持 Windows 10/11 与 macOS。');
}

export function systemDesktop(platform = process.platform): Desktop {
  return {
    async get() {
      assertPlatform(platform);
      const { getWallpaper } = await import('wallpaper');
      const result = platform === 'darwin' ? await getWallpaper({ screen: 'all' }) : await getWallpaper();
      return Array.isArray(result) ? result : [result];
    },
    async set(path) {
      assertPlatform(platform);
      try {
        const { setWallpaper } = await import('wallpaper');
        await setWallpaper(path, platform === 'darwin' ? { screen: 'all', scale: 'fill' } : { scale: 'fill' });
      } catch (cause) {
        throw new WallpaperError('WALLPAPER', `设置壁纸失败，请在当前用户桌面会话中检查权限：${errorMessage(cause)}`, {
          cause
        });
      }
    }
  };
}
