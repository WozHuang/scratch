export interface Config {
  market: string;
  resolution: string;
  downloadDir: string;
  autoTime: string;
  retentionDays: number;
}

export interface WallpaperOptions {
  market?: string;
  resolution?: string;
  output?: string;
  force?: boolean;
}

export interface BingImage {
  date: string;
  title: string;
  copyright: string;
  copyrightLink: string;
  urlbase: string;
  url: string;
  market: string;
}

export interface WallpaperRecord extends BingImage {
  managedBy: 'woz-scratch-bing-wallpaper-v1';
  path: string;
  resolution: string;
  imageUrl: string;
  downloadedAt: string;
  sha256: string;
}

export interface WallpaperResult {
  image: WallpaperRecord;
  cached: boolean;
  applied: boolean;
  warnings: string[];
}

export interface State {
  downloads: WallpaperRecord[];
  current?: WallpaperRecord;
  protectedPaths?: string[];
}

export interface AppPaths {
  config: string;
  data: string;
  cache: string;
  log: string;
}

export interface Desktop {
  get(): Promise<string[]>;
  set(path: string): Promise<void>;
}
