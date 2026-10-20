# TP-Link IPC 局域网 API：资料、能力与实现决策

> 状态：决策前资料整理。本文不把任何社区命令视为全型号、稳定或官方承诺的接口。
>
> 目标设备：支持手机 App「局域网控制」的中国大陆 TP-Link IPC。本文不涵盖 Tapo 国际版云端协议。

## 1. 结论

当前资料足以把本项目发展为一个实用的 Node.js SDK，但不足以承诺「所有 TP-Link 摄像头的完整 API」。合理的产品定位应为：

> 对支持该私有 Web 协议的中国大陆 TP-Link IPC，提供经过型号实测的局域网控制 SDK，并公开每个命令的证据等级与兼容性。

现有项目已经完成了最难且最可复用的基础：新版登录认证、`stok` 会话、通用 `/ds` 请求、镜头遮蔽和时间同步。同时，它已经提供了一个安全边界较清晰的 Home Assistant HTTP 桥接服务。

## 2. 资料来源与可信度

| 来源 | 能证明什么 | 局限 |
| --- | --- | --- |
| [TP-Link VMS API V2.0.19](https://open.tp-link.com.cn/private/V2.0.19/1) | 官方 VMS 有「设备消息透传」及图像、音频、移动侦测、OSD、区域告警等设备配置能力。 | VMS API 不是单台 IPC 的公开 LAN API；字段需逐台验证后才可写入 SDK。 |
| [xiaodong-lx/tplink-ipc-control](https://github.com/xiaodong-lx/tplink-ipc-control) | 大量实际 `/ds` JSON：预置点、遮蔽、报警、LED、追踪、移动侦测、录像计划、重启、语音，以及多项查询。 | 社区反向工程；不同型号、固件与功能授权会有差异。 |
| [bingooo/hass-tplink-ipc](https://github.com/bingooo/hass-tplink-ipc) | 新式认证与「镜头遮蔽」的实际集成方向；其 README 明确定位为支持手机 App 局域网控制的大陆机型。 | 功能面较窄；不等同于完整协议说明。 |
| 当前仓库 `packages/tplink-ipc-sdk` | 已实际实现、单元测试覆盖的代码边界。 | 真实摄像头集成测试依赖本地 `.env`；目前没有保存的型号兼容性结果。 |
| [likaci：MIPC251C-4 ONVIF 与 PTZ 逆向](https://blog.xiazhiri.com/Mercury-MIPC251C-4-Reverse) / [mercury-ipc-control](https://github.com/likaci/mercury-ipc-control) | 原对话中被称为「Hassbian 第一篇」的 MIPC251C-4 资料来源链路；文章记录 ONVIF/RTSP、RSA + `nonce` + `stok` 登录流程，并链接到控制脚本仓库。 | 针对水星 MIPC251C-4；不能据此承诺 TP-Link 全型号兼容。 |
| [Hassbian：TP-Link 局域网对讲 / MULTITRANS](https://bbs.hassbian.com/thread-31976-1-1.html) | 原对话中被称为 MULTITRANS 的资料来源；记录握手、Digest/无认证差异、半/全双工、PCMA 8 kHz 与 RTP-over-TCP。 | 社区帖子，且明确指出固件差异。 |
| [go2rtc MULTITRANS 文档](https://go2rtc.org/internal/multitrans/) | 公开可复现实现的配置入口：`multitrans://user:password@host:554`；说明其面向中国大陆 TP-Link 摄像头的双向音频。 | 音频转发能力不等于本 SDK 已支持或已在本设备验证。 |

### 证据标签

后续 API 文档应为每个端点标记下列标签，而不是只写「支持」。

| 标签 | 含义 |
| --- | --- |
| `implemented` | 当前 SDK 中有实现。 |
| `unit-tested` | 不需要设备的测试覆盖。 |
| `device-tested` | 至少有指定型号/固件的真实设备测试记录。 |
| `community-verified` | 社区实现或抓包给出过命令。 |
| `official-vms` | TP-Link VMS 文档出现过相近设备配置。 |
| `candidate` | 有价值但尚未对本协议/本设备验证。 |

## 3. 协议分层：不要混为一个 API

| 层 | 用途 | SDK 建议 |
| --- | --- | --- |
| RTSP | 实时视频流。 | 不重复实现；只提供 URI 配置/互操作说明即可。 |
| ONVIF | 标准化发现、媒体、事件与部分 PTZ。 | 可作为可选适配层，独立于 TP-Link 私有 API。 |
| TP-Link 私有 Web API | App/网页使用的局域网设备控制，核心为 `stok` 与 `/ds`。 | 本 SDK 的核心。 |
| MULTITRANS | 社区逆向、Hassbian 与 go2rtc 均有资料的双向音频传输方向。 | 高风险 V2 研究项；不能与普通 REST 调用混在一起。 |
| VMS API | 面向 TP-Link VMS 平台的服务端 API。 | 作为字段/能力参考，不能直接当作 IPC LAN 端点。 |

## 4. 已实现能力（当前仓库事实）

### 4.1 认证与传输

实现位置：`src/auth.js`、`src/api.js`。

1. 请求 `GET /pc/Content.htm`，读取 `nonce`、RSA 公钥 `key` 与 `encrypt_type`。
2. `POST /`，发送 `method: "do"` 的 `login` 请求，成功后取得 `stok`。
3. 对 `POST /stok=<stok>/ds` 提供通用 `request(payload)`。
4. 遇到 `error_code: -40401` 时清除会话并自动重新登录一次。
5. 已实现 `encrypt_type: 2`（RSA PKCS#1 v1.5）与 `encrypt_type: 3`（MD5）登录分支；type 2 优先于服务端返回数组中的其他类型。
6. 对设备锁定 `-40404`、网络故障和非零 API 错误生成 `TPIPCApiError`。

这层可支撑任何已知 `/ds` payload 的实验，但目前只有遮蔽和时间同步被包装成正式方法。

### 4.2 已包装的摄像头 API

| SDK 方法 | `/ds` 命令 | 状态 |
| --- | --- | --- |
| `getLensMaskStatus()` | `get lens_mask.lens_mask_info` | `implemented`、`unit-tested`；真实设备测试可选，取决于 `.env`。 |
| `setLensMaskOn()` | `set lens_mask.lens_mask_info.enabled = on` | `implemented`、`community-verified`。 |
| `setLensMaskOff()` | `set lens_mask.lens_mask_info.enabled = off` | `implemented`、`community-verified`。 |
| `syncTime()` | `do system.boot_set_date.seconds_from_1970` | `implemented`；应补真实设备兼容性记录。 |

`lens_mask` 是主动隐私遮蔽，不是 `tamper_detection`（检测镜头被人遮挡后触发报警）。两者不得在文档或 SDK 命名中混用。

### 4.3 现成的 Home Assistant 桥接服务

实现位置：`src/server/*`，为多台摄像头持有可复用客户端。

| HTTP 接口 | 行为 | 状态 |
| --- | --- | --- |
| `GET /healthz` | 服务/摄像头数量健康信息，不访问摄像头。 | 已实现。 |
| `GET /api/cameras/:id/lens-mask` | 读取隐私遮蔽状态。 | 已实现，Bearer Token 保护。 |
| `POST /api/cameras/:id/lens-mask` | `{"enabled": true|false}` 设置后再读回确认。 | 已实现，Bearer Token 保护。 |

服务已包含配置校验、请求体大小限制、恒定时间令牌比较、摄像头错误到 HTTP 状态的映射，以及避免把密码回显到 HTTP 响应或日志的测试。这一服务应继续只暴露高层、白名单化的操作；不应向 Home Assistant 暴露任意 `/ds` JSON 注入接口。

## 5. 已知但尚未包装的 `/ds` 能力

下表的 payload 来源主要是 `tplink-ipc-control`，应先经真实设备的「读 → 写 → 再读」测试，才进入稳定 API。

| 模块 | 社区已知操作 | 推荐 SDK 外观 | 风险/备注 |
| --- | --- | --- | --- |
| `preset` | `set_preset`、`goto_preset` | `camera.presets.create(name)`、`goto(id)` | 适合优先实现；仅适用于 PTZ 机型。 |
| `motor` | 移动、步进、停止、校准（原对话资料）。 | `camera.ptz.move()`、`step()`、`stop()`、`calibrate()` | 需定义速度、方向及停止保障。 |
| `motion_detection` | 开关、`digital_sensitivity`。 | `camera.motion.get()`、`setEnabled()`、`setSensitivity()` | 高价值、低破坏性；官方 VMS 亦有相近模块。 |
| `led` | `led.config.enabled` 开/关。 | `camera.led.setEnabled()` | 机型差异低，适合作为 V1 候选。 |
| `target_track` | 智能追踪开/关。 | `camera.tracking.setEnabled()` | 仅云台/支持 AI 的机型。 |
| `msg_alarm` | 手动报警 start/stop；声/光报警配置。 | `camera.alarm.startManual()`、`stopManual()`、`configure()` | 可能惊扰现场；不应默认触发。 |
| `record_plan` | 开关与按周录像计划。 | `camera.recording.getPlan()`、`setPlan()` | 计划字符串目前是 URL 编码格式，需先建强类型模型。 |
| `system` / `timing_reboot` | 立即重启、定时重启。 | `camera.system.reboot()`、`setRebootSchedule()` | 破坏性；必须显式命名与确认。 |
| `greeter` | 语音开关、音量、播放测试、进出提示音。 | `camera.greeter.*` | 很可能仅商用机型支持。 |
| `video` | 查询 `main`、`minor`。 | `camera.video.getStreams()` | 先定义返回类型，勿承诺媒体播放能力。 |
| `network` / `protocol` | 查询 WAN 状态、WAN/静态/DHCP 配置。 | `camera.network.getStatus()` | 查询可做；修改网络配置风险极高，应单独审批。 |
| `device_info` | 查询 `basic_info`、`info`。 | `camera.device.getInfo()` | 最适合最先加入，可用作型号/固件兼容性记录。 |
| `system` | 查询时钟及系统信息。 | `camera.system.getInfo()` | 与 `syncTime()` 同属系统模块。 |
| `cloud_config` | 查询升级、绑定信息。 | `camera.cloud.getStatus()` | 只读候选；隐私敏感字段需清洗。 |
| `harddisk_manage` | 查询硬盘、视频、图片、磁盘表。 | `camera.storage.getInfo()` | 仅 NVR/带存储设备。 |

## 6. 官方 VMS 文档带来的候选能力

VMS 的「设备消息透传」章节表明下列功能有正式 TP-Link 配置模型，但**并不证明**当前摄像头可以用同名 `/ds` 请求直接访问：

- 图像：翻转、曝光/图像参数等。
- 音频：音量与音频参数。
- OSD：名称、时间等叠加显示。
- 检测与告警：移动侦测、区域覆盖、区域入侵、镜头遮挡检测、声光告警。
- 录像、FTP 抓图、人数统计和行业 AI 功能。

这些是 V2 功能字典的最佳来源。实现前需要保存 VMS 中的请求/响应 schema，并用实际 IPC 验证模块名、字段名、枚举和值编码。

## 7. 不建议当前直接实施的方向

| 项目 | 原因 |
| --- | --- |
| 网络 IP/DHCP/静态地址写入 | 配错会使摄像头脱网；应仅提供只读查询，或另做受保护的管理工具。 |
| 固件升级、云绑定、恢复出厂 | 高影响、难以回滚，且资料不足。 |
| 任意 `request()` 的 HTTP 透传 | 会让 HA/容器接口成为修改网络和重启设备的远程入口。SDK 内部可保留低层请求，服务端不应公开。 |
| MULTITRANS 双向语音 | 需要 RTSP/RTP、认证、音频编解码和长连接生命周期；应作为单独子项目。 |
| 把 VMS API 直接实现为 LAN API | 两者认证、路由和对象模型不同。 |

## 8. 推荐的实现路线（由你决策）

### 方案 A：隐私控制产品（最小、稳定）

保持当前认证与镜头遮蔽，补全型号/固件兼容性表、日志与发布品质。Home Assistant HTTP 服务只保留 `lens-mask`。

- 优点：最符合现有实际用途；风险与维护面最小。
- 缺点：不能称为完整摄像头 SDK。

### 方案 B：安全的局域网控制 SDK（推荐）

在现有核心上新增只读设备信息、系统信息、移动侦测、LED、PTZ/预置点；保留原始 `request()` 作为高级 API。对网络、存储、重启、报警等高影响模块延后。

- 优点：能覆盖大多数家庭自动化场景，且模块边界清楚。
- 缺点：需要至少一台真实设备建立兼容性记录，并处理不支持功能的错误语义。

### 方案 C：完整协议研究项目

除方案 B 外，建立抓包/回归夹具、型号能力探测、VMS 字段映射、ONVIF/RTSP 适配和 MULTITRANS 音频。

- 优点：最接近「完整 API 文档」。
- 缺点：不是一次迭代能完成；需要多型号设备、长期维护和严格的协议证据档案。

## 9. 无论选哪种路线都应先补齐的文档结构

```text
packages/tplink-ipc-sdk/
├─ docs/
│  ├─ capability-assessment.md     # 本文：决策与证据边界
│  ├─ protocol/
│  │  ├─ authentication.md         # 登录、stok、失效与错误码
│  │  ├─ transport.md              # /ds 消息约定
│  │  └─ compatibility.md          # 型号 × 固件 × 模块
│  └─ api/
│     ├─ privacy.md
│     ├─ device.md
│     ├─ motion.md
│     └─ ptz.md
└─ tests/fixtures/                 # 脱敏的真实请求/响应样本
```

每个 API 页面至少应写明：端点、请求、响应、枚举、错误、影响级别、来源、已测试型号/固件，以及 SDK 映射。若设备不支持功能，应返回可机器识别的 `UNSUPPORTED_FEATURE`，而不是把所有错误都泛化为网络失败。

## 10. 决策清单

在开始下一轮开发前，需要确定：

1. 选择方案 A、B 还是 C；我建议从 B 开始。
2. 可用于回归测试的摄像头型号与当前固件版本。
3. V1 是否包含 PTZ/预置点；它们会让 SDK 从固定机型控制器变为通用摄像头控制器。
4. 是否将 Home Assistant HTTP 服务持续作为本包的一部分，还是拆分为独立 `tplink-ipc-ha-bridge` 包。
5. 是否允许 V1 实现任何高影响写操作：重启、报警、录像计划或网络配置。建议默认不允许。
