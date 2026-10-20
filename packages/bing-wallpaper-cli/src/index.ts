import { createClient } from './service.js';

export { WallpaperError, exitCodes } from './errors.js';
export type { AppPaths, BingImage, Config, WallpaperOptions, WallpaperRecord, WallpaperResult } from './types.js';

/** Fetch, download and apply today's wallpaper. Uses the current user's persisted configuration. */
export const refreshWallpaper = createClient().refreshWallpaper;
/** Download today's wallpaper without changing the desktop. */
export const downloadWallpaper = createClient().downloadWallpaper;
/** Read local metadata and current OS wallpaper paths; performs no network requests. */
export const getWallpaperInfo = createClient().getInfo;
