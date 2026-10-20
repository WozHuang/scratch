export type ErrorCode =
  'USAGE' | 'NETWORK' | 'BING' | 'IMAGE' | 'STORAGE' | 'PLATFORM' | 'WALLPAPER' | 'SCHEDULER' | 'BUSY';

export class WallpaperError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'WallpaperError';
  }
}

export const exitCodes: Record<ErrorCode, number> = {
  USAGE: 2,
  NETWORK: 3,
  BING: 3,
  IMAGE: 3,
  STORAGE: 4,
  PLATFORM: 5,
  WALLPAPER: 5,
  SCHEDULER: 6,
  BUSY: 7
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT';
}
