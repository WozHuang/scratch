# Bing 每日壁纸 CLI

一个执行后退出的 npm CLI：获取 Bing 每日图片、缓存并设置桌面壁纸，也可以显式开启系统每日任务。没有 GUI、托盘、服务或常驻 Node 进程。

包名为 **`@woz-scratch/bing-wallpaper-cli`**，安装后的命令为 **`bing-wallpaper`**。项目尚未执行 npm 发布；以下安装命令适用于发布后，当前可从本地打包安装。

## 支持平台与环境

- Node.js **>=22.12.0**，建议使用 Node 22 或 24 LTS。
- Windows 10/11：当前用户已登录的交互式桌面，系统 PowerShell 和 Task Scheduler 可用。
- macOS：当前用户已登录的图形桌面，使用用户级 LaunchAgent。底层兼容性取决于 Node 和 wallpaper 附带二进制；尚未完成真实 macOS 桌面验收。
- 壁纸由 [wallpaper](https://github.com/sindresorhus/wallpaper) 设置，无需额外安装 Python、ImageMagick 或本地编译工具。Linux 不在桌面和调度支持范围内。

## 安装与快速开始

```bash
npm install -g @woz-scratch/bing-wallpaper-cli
bing-wallpaper
bing-wallpaper download
bing-wallpaper auto enable
bing-wallpaper auto status
```

安装包没有 install/postinstall 系统操作。只有主动运行 `auto enable` 才会创建任务。

从当前仓库构建并安装：

```bash
cd packages/bing-wallpaper-cli
npm install
npm run build
npm test
npm pack
npm install -g ./woz-scratch-bing-wallpaper-cli-0.1.0.tgz
bing-wallpaper --help
```

也可在工作区运行 `pnpm --filter @woz-scratch/bing-wallpaper-cli run build`。本包没有 workspace 运行时依赖，可独立安装开发依赖。

## 命令

```bash
bing-wallpaper                         # 等同 refresh
bing-wallpaper refresh                 # 获取最新图片，下载并设置桌面
bing-wallpaper download                # 仅下载，保持系统桌面不变
bing-wallpaper info                    # 查询本地元数据和系统当前路径，不联网
bing-wallpaper auto enable             # 按配置的时间创建/更新任务，初始为 09:00
bing-wallpaper auto enable --time 08:30 # 每天本地时间 08:30
bing-wallpaper auto status             # 查询实际系统任务、运行路径和状态
bing-wallpaper auto disable            # 删除本工具创建的当前用户任务
bing-wallpaper config set market ja-JP
bing-wallpaper config set resolution 1920x1080
bing-wallpaper config set downloadDir "/absolute/path/图片 folder"
bing-wallpaper config set autoTime 10:00
bing-wallpaper config set retentionDays 0
bing-wallpaper config list
bing-wallpaper --help
```

`refresh` 先完成下载和校验再设置壁纸。如果当前系统路径已是本次图片，跳过重复设置；外部改过桌面时会重新设置。`download` 不设置壁纸，`info` 的 `current` 是本工具最后成功设置的记录，`lastDownload` 是最后下载记录，`systemPaths` 为系统当前可查询的路径，三者可能不同。

| 参数                        | 行为                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--market <market>`         | 本次 refresh/download 的地区，初始 `zh-CN`；接受 `ja-JP`、`en-US` 等语言-国家格式，但不保证 Bing 实际提供该地区图片。 |
| `--resolution <resolution>` | 本次优先分辨率，初始 `UHD`。支持 `UHD`、`3840x2160`、`1920x1200`、`1920x1080`、`1366x768`、`1280x720`、`1024x768`。   |
| `--output <directory>`      | 本次下载目录，支持相对路径、空格和中文；不修改配置。                                                                  |
| `--force`                   | refresh/download 忽略元数据与图片缓存，refresh 也强制重新设置。                                                       |
| `--quiet`                   | 不输出正常结果和提示，错误仍写 stderr。                                                                               |
| `--json`                    | stdout 输出单个 JSON 结果；失败时 stderr 输出 `{ "error": { "code", "message" } }`，优先于 quiet。                    |

获取参数仅用于 refresh/download；持久设置应使用 `config set`。全局参数可放在子命令前后。自动任务每次读取配置，不会继承上一次 refresh 的临时参数。`--help`/`--version` 返回常规文本。

JSON 示例：`bing-wallpaper refresh --json` 返回 `{ image, cached, applied, warnings }`；`applied: false` 可以表示系统已在使用该图片，不能只靠它判断失败，应检查进程退出码。

| 退出码 | 含义                                                    |
| ------ | ------------------------------------------------------- |
| 0      | 成功（包括跳过重复设置、未注册任务的 status/disable）。 |
| 2      | 命令或参数错误。                                        |
| 3      | 网络、Bing 数据或图片错误。                             |
| 4      | 文件、配置或状态损坏/权限错误。                         |
| 5      | 不支持的平台或设置壁纸失败。                            |
| 6      | 系统任务查询/注册/删除失败或任务名称冲突。              |
| 7      | 其他命令持有操作锁。                                    |

## 每日自动更新

Windows 注册名称为 `WozScratch.BingWallpaper.<当前用户 SID>` 的每日任务，使用 InteractiveToken、普通用户权限和忽略重叠实例策略，不保存密码、不要求管理员权限。除每日时间外，还在该用户登录后延迟 30 秒刷新一次，以便关机后再次登录时恢复。允许电池供电时运行，错过时间后由系统尽可能补执行。仅已登录用户桌面可设置；组织策略禁用普通用户任务注册时会返回错误。

macOS 写入 `~/Library/LaunchAgents/com.woz-scratch.bing-wallpaper.plist`，通过 `launchctl bootstrap gui/<uid>` 加载，`StartCalendarInterval` 按本地时间触发。没有 KeepAlive；退出登录时不执行，重新登录后由系统加载。睡眠期间错过的任务依赖 launchd 唤醒后的合并执行机制，关机/注销期间不承诺补跑。

重复 enable 会更新本工具的任务。disable 仅移除本用户、本项目的任务，保留配置、下载和日志。遇到同名但没有本工具所有权标记的任务或 plist 会拒绝覆盖/删除。

任务记录 `realpath(process.execPath)` 和包内 `dist/cli.js` 的绝对路径，不依赖 npm shim、登录 shell 或 PATH。nvm/fnm 切换默认版本不会自动迁移这些路径；删除旧 Node 版本、改变 Homebrew 路径、重新安装全局包到其他位置或移动本地包后，请用新环境执行：

```bash
bing-wallpaper auto enable
bing-wallpaper auto status --json
```

`runtimeHealthy: false` 表示系统任务存在但记录的 Node/CLI 路径失效。该检查验证文件存在，不代表已成功执行或桌面授权完备。Windows 状态还包含 lastResult/lastRun/nextRun；macOS details 包含 launchctl 的实际输出。修改 `autoTime` 后需要再次 enable；地区和分辨率配置会在下次执行自动读取。时间跟随本机时区和系统夏令时规则。

日志为用户日志目录中的 `auto.log`（JSON Lines，约 1 MiB 后轮换，保留一份 `.1`）。macOS 另有 `launchd.stdout.log` / `launchd.stderr.log`，用于 Node 无法启动等问题，这两个系统诊断文件可按需手动清理。Windows Task Scheduler 历史和 lastResult 可辅助定位 Node 入口失效。Windows 调度启动控制台 Node 时可能短暂显示窗口，不提供隐藏后台进程。

卸载前运行 `bing-wallpaper auto disable`，再运行 `npm uninstall -g @woz-scratch/bing-wallpaper-cli`。卸载不会执行脚本自动更改系统任务。

## 配置、缓存与清理

目录由 env-paths 生成，应用名为 `woz-scratch-bing-wallpaper`；`info` 输出当前实际目录。

| 内容           | Windows 默认目录                                          | macOS 默认目录                                                 |
| -------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| 配置           | `%APPDATA%/woz-scratch-bing-wallpaper/Config/config.json` | `~/Library/Preferences/woz-scratch-bing-wallpaper/config.json` |
| 状态、默认图片 | `%LOCALAPPDATA%/woz-scratch-bing-wallpaper/Data/`         | `~/Library/Application Support/woz-scratch-bing-wallpaper/`    |
| 元数据缓存     | `%LOCALAPPDATA%/woz-scratch-bing-wallpaper/Cache/`        | `~/Library/Caches/woz-scratch-bing-wallpaper/`                 |
| 日志           | `%LOCALAPPDATA%/woz-scratch-bing-wallpaper/Log/`          | `~/Library/Logs/woz-scratch-bing-wallpaper/`                   |

默认配置为 `market: zh-CN`、`resolution: UHD`、`downloadDir: <数据目录>/wallpapers`、`autoTime: 09:00`、`retentionDays: 30`。retentionDays 接受 0–36500 整数，0 关闭清理。配置不存在时直接用默认值，无需手写文件。损坏的配置/状态文件会报错且保留原文件，请先备份再修复或移走；可丢弃的损坏元数据缓存会重新获取。

元数据按地区缓存到本地自然日结束；如需获取 Bing 当天后续更换的内容，运行 `refresh --force`。当天图由 Bing 的 idx=0 结果定义，图片标注日期可能因地区/发布时间与本机日期不同，不会伪造日期。分辨率从所选档位向下降级，最后尝试 API 提供的原图地址；不保证每张图片有 UHD。缓存了降级图片后，本日继续复用；需要重新探测 UHD 可加 force。

图片名包含日期、地区、Bing 标识、来源哈希、实际候选档位和内容哈希，每张图片旁保存 `.jpg.json` 元数据（标题、版权、来源、日期、下载时间、SHA-256）。最多接受 40 MiB 图片，检查 JPEG 文件头、尺寸、结束标记和缓存哈希；这不是完整像素解码。请求超时 15 秒，瞬时失败最多重试 2 次，响应体读取也在超时范围内。404 等图片不可用时降级；网络中断不会无限重试。下载失败不改变桌面或删除已有图片。

清理发生在成功 refresh/download 后，以下载时间计算保留天数。只删除状态索引中记录、旁置元数据匹配且内容未改动的过期图片，不扫描删除用户的其他文件。保护本工具最后设置的图片及系统当前可查询路径；系统查询失败则跳过清理。自定义输出目录里的本工具图片也遵守此策略。

macOS 无法查询非活动 Space 的图片，因此所有曾被本工具设置过的 macOS 图片会保守保留；30 天清理主要作用于仅下载且未设置过的图片。确认不再使用后可手动移除旧图，不能承诺同时自动回收所有旧图并保护不可观测的 Space。

## JavaScript API

```ts
import { refreshWallpaper, downloadWallpaper, getWallpaperInfo, WallpaperError } from '@woz-scratch/bing-wallpaper-cli';

try {
  const result = await refreshWallpaper({ market: 'zh-CN', resolution: 'UHD' });
  console.log(result.image.path);
} catch (error) {
  if (error instanceof WallpaperError) console.error(error.code, error.message);
  else throw error;
}

await downloadWallpaper({ output: '/absolute/path/wallpapers' });
console.log(await getWallpaperInfo());
```

ESM API 附带 TypeScript 声明。refresh/download 共享同一逻辑和持久配置，支持 market/resolution/output/force。API 不退出进程，失败抛 WallpaperError。任务管理通过 CLI 提供，不在公共 API 中承诺底层适配器稳定性。

## 常见问题和平台限制

- **多显示器和 Spaces？** macOS 对当前活动 Space 的可用屏幕传入 `screen: all`，不能保证所有 Space。Windows 使用底层库默认桌面设置，不支持逐屏独立控制，也不承诺更新全部屏幕。其他壁纸应用、系统动态桌面、Spotlight 可能覆盖结果。
- **权限失败？** 先在普通用户的图形桌面手动执行 refresh。macOS 若出现系统授权提示应按系统说明授权；没有提示也不代表所有系统版本都已兼容。SSH、系统服务、注销会话、企业策略可能无法操作桌面，不应通过提权解决交互会话问题。
- **配置/下载路径含空格和中文？** 命令行中用引号包裹；内部使用参数数组和编码数据，避免 shell 拼接。
- **自动任务没执行？** 查询 auto status，检查 runtimeHealthy、系统状态和日志；确认已登录、网络可用。切换/删除 Node 或移动包后重新 enable。
- **已有命令正在运行？** 等待其结束。确认进程已退出后，可移走数据目录下 operation.lock；死进程锁超过一分钟后会尝试自动恢复，活进程锁不会被抢占。
- **网络/地区问题？** 检查本机是否可访问 www.bing.com。内置 fetch 使用当前 Node 的网络配置，工具没有独立代理设置。Bing 可能忽略未知地区或变更非公开 API，获取逻辑单独封装以便替换。
- **能离线刷新吗？** 当天元数据和图片仍有效时可用缓存；跨日需要连接 Bing，失败会保留原有壁纸。

## 开发与验证

```bash
npm install
npm run typecheck
npm run build
npm test
npm run format:check
npm pack
```

src/bing.ts 负责网络和图片校验，service.ts 负责缓存/刷新/清理，desktop.ts 复用 wallpaper，scheduler.ts 管理原生任务；CLI 调用同一套核心逻辑。依赖选择见 [DEPENDENCIES.md](./DEPENDENCIES.md)。

测试使用真实 JPEG fixture，Mock 网络、壁纸库及系统命令，测试不会修改运行机器的壁纸或任务。GitHub Actions 配置 Windows/macOS × Node 22/24 的安装、类型检查、构建、测试和 npm pack；Mock 测试不能替代真实桌面手工验收。

## 许可证

代码使用 [MIT](./LICENSE)。Bing 图片版权属于相应权利人，不因本工具 MIT 许可证而获得再分发许可；元数据保留原始版权与来源。本项目不是 Microsoft/Bing 官方产品。
