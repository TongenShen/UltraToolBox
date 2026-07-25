<p align="center">
  <img src="https://img.icons8.com/fluency/96/wrench.png" alt="UltraToolBox" width="96" />
</p>

<h1 align="center">UltraToolBox 🔧</h1>

<p align="center">
  <strong>跨平台命令行工具箱 — 一站式收纳开发/运维/搞机常用工具</strong>
</p>

<p align="center">
  <a href="https://v2.tauri.app"><img src="https://img.shields.io/badge/Tauri-2.x-FFC131?style=flat-square&logo=tauri" alt="Tauri"></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js" alt="Vue"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://www.rust-lang.org"><img src="https://img.shields.io/badge/Rust-2021-000000?style=flat-square&logo=rust" alt="Rust"></a>
  <br>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/status-alpha-orange?style=flat-square" alt="Status">
  <br>
  <a href="./README.md">🇨🇳 中文</a> ·
  <a href="./README.en.md">🇬🇧 English</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.ko.md">🇰🇷 한국어</a>
</p>

---

## 📋 简介

**UltraToolBox** 是一个基于 [Tauri 2](https://v2.tauri.app/) 的跨平台桌面工具箱，将常用的命令行工具封装成直观的 GUI 界面。无需记忆复杂的命令参数，无需在多个终端窗口中切换，一个应用搞定 ADB 调试、网络测速、文件下载等日常开发运维任务。

> ⚡ **开箱即用** — 只需系统已安装对应的 CLI 工具（adb / iperf3 / aria2c / curl / ping），即可在统一的图形界面中操作它们。

---

## 📁 目录结构

本项目根目录包含以下内容：

```
UltraToolBox/
├── UltraToolBox/          # 🎯 主项目目录 — Tauri 2 桌面应用源码
│   ├── src/               # Vue 3 前端源码（组件/页面/路由/状态）
│   ├── src-tauri/         # Rust 后端源码（Tauri 配置/插件注册）
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖配置
├── UltraToolBox规划/       # 📝 项目规划与设计文档（中文）
│   ├── 规划.md            # 整体开发计划与阶段划分
│   ├── 工具.md            # 工具功能清单与需求
│   └── 开发AI响应.md       # AI 辅助开发对话记录
├── LICENSE                # 📄 MIT 开源许可证
├── README.md              # 📖 本文件（中文）
├── README.en.md           # 📖 English version
├── README.ja.md           # 📖 日本語版
└── README.ko.md           # 📖 한국어 버전
```

### 各目录说明

| 目录 | 说明 |
|------|------|
| **`UltraToolBox/`** | 主项目目录，包含完整的 Tauri 2 桌面应用源码。前端 (Vue 3 + TypeScript) 和后端 (Rust) 代码均在此目录中。运行 `npm run tauri dev` 在此目录执行。 |
| **`UltraToolBox规划/`** | 项目规划文档目录，包含初期需求分析、功能规划、UI 设计概念和开发阶段划分。适合想要了解项目背景和设计思路的贡献者阅读。 |

---

## ✨ 功能特性

### 📱 ADB 调试桥

全方位 Android 设备调试工具，五个功能标签页：

| 功能 | 说明 |
|------|------|
| **设备列表** | 扫描已连接设备，支持 Wi-Fi 无线连接/断开，显示设备型号、Android 版本、电量 |
| **快捷操作** | 一键截图、录屏、重启（正常/ Bootloader / Recovery） |
| **APK 管理** | 安装 APK、卸载应用、浏览已安装应用列表（支持搜索） |
| **Logcat** | 实时查看设备日志，支持过滤关键字，可随时启停 |
| **文件浏览器** | 浏览设备文件系统，查看文件内容 |

### 🌐 网络工具

三大网络诊断工具集成：

| 工具 | 功能 |
|------|------|
| **Ping** | 网络连通性测试，可配置目标地址和探测次数 |
| **iPerf3** | 带宽测速，支持客户端/服务端模式，可配置端口、时长、反向测试 |
| **cURL** | HTTP 请求构建器，支持 GET/POST/PUT/DELETE/PATCH，自定义请求头和请求体 |

### ⬇️ Aria2 下载管理器

轻量级多协议下载工具：

| 功能 | 说明 |
|------|------|
| **RPC 服务器** | 一键启动/停止 Aria2 RPC 守护进程，可配置端口、密钥、并发数 |
| **HTTP 下载** | 支持 URL 下载，多线程断点续传 |
| **BT / 磁力链接** | 支持 BitTorrent 和 Magnet 链接下载 |

### 💻 终端快捷入口

一键打开系统终端，自动识别当前平台（macOS / Windows / Linux），支持 iTerm2（macOS）。

### ⚙️ 设置与个性化

- **主题切换** — 深色/浅色模式一键切换
- **二进制管理** — 检测 adb / iperf3 / aria2c / curl / ping 是否可用及版本信息

---

## 🛠️ 技术栈

| 层 | 技术 | 用途 |
|------|------|------|
| **桌面框架** | [Tauri 2](https://v2.tauri.app/) | 跨平台桌面应用容器，体积小、性能高 |
| **前端框架** | [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) | UI 层开发 |
| **UI 组件库** | [Naive UI](https://www.naiveui.com/) | 高质量 Vue 3 组件 |
| **状态管理** | [Pinia](https://pinia.vuejs.org/) | 全局状态管理 |
| **路由管理** | [Vue Router](https://router.vuejs.org/) | 页面路由 |
| **构建工具** | [Vite](https://vitejs.dev/) | 前端构建 |
| **后端语言** | [Rust](https://www.rust-lang.org/) | 系统调用、插件扩展 |
| **Tauri 插件** | shell / fs / dialog / process / opener | 命令行执行、文件操作、对话框 |

---

## 🚀 快速开始

### 前置条件

- **Node.js** ≥ 18
- **Rust** (安装: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **系统依赖**:
  - **macOS**: Xcode CLI Tools (`xcode-select --install`)
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `libwebkit2gtk-4.1-dev` 等 (详见 [Tauri 官方文档](https://v2.tauri.app/start/prerequisites/))

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-username/UltraToolBox.git
cd UltraToolBox/UltraToolBox

# 安装前端依赖
npm install

# 开发模式运行（热更新）
npm run tauri dev
```

### 构建安装包

```bash
cd UltraToolBox/UltraToolBox
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`，包含：
- **macOS**: `.dmg` / `.app`
- **Windows**: `.msi` / `.exe`
- **Linux**: `.deb` / `.AppImage`

---

## 📁 主项目结构 (`UltraToolBox/UltraToolBox/`)

```
UltraToolBox/
├── index.html                      # 入口 HTML
├── package.json                    # 前端依赖
├── vite.config.ts                  # Vite 配置（含 @ 路径别名）
├── tsconfig.json                   # TypeScript 配置
├── src/
│   ├── main.ts                     # Vue 应用入口
│   ├── App.vue                     # 主布局（侧边栏 + 内容区 + 状态栏）
│   ├── router/index.ts             # 路由配置（7 个页面，懒加载）
│   ├── stores/
│   │   ├── app.ts                  # 应用状态（主题/侧边栏）
│   │   ├── tools.ts                # 工具二进制配置
│   │   └── process.ts              # 进程管理（启动/终止/状态/日志）
│   ├── composables/
│   │   ├── useCommand.ts           # 命令执行引擎（execute / spawn）
│   │   └── useBinary.ts            # 二进制检测（检查/版本/状态）
│   ├── types/index.ts              # TypeScript 类型定义
│   ├── components/
│   │   ├── layout/AppSidebar.vue   # 可折叠侧边栏导航
│   │   └── common/LogPanel.vue     # 统一日志面板（终端风格）
│   └── views/
│       ├── Home.vue                # 🏠 首页仪表盘
│       ├── AdbView.vue             # 📱 ADB 调试桥
│       ├── NetworkView.vue         # 🌐 网络工具
│       ├── Aria2View.vue           # ⬇️ Aria2 下载器
│       ├── TerminalView.vue        # 💻 终端快捷入口
│       ├── Settings.vue            # ⚙️ 设置
│       └── About.vue               # ℹ️ 关于
└── src-tauri/
    ├── Cargo.toml                  # Rust 依赖
    ├── tauri.conf.json             # Tauri 窗口/插件配置
    ├── capabilities/default.json   # 权限配置
    └── src/
        ├── main.rs                 # 入口
        └── lib.rs                  # 插件注册（shell/fs/dialog/process/opener）
```

---

## 🧩 核心架构

### 命令执行引擎

所有 CLI 工具的执行都通过 `useCommand` composable 统一管理：

```
用户操作 → useCommand → Tauri Shell 插件 → 系统命令行 → 输出回调 → LogPanel 展示
```

- **`executeCommand()`** — 执行命令并等待完成，返回完整输出
- **`spawnCommand()`** — 流式执行，实时回调输出行，支持终止
- 平台自适应：Unix 使用 `sh -c`，Windows 使用 `cmd /c`

### 进程管理

`useProcessStore` 管理所有运行中的命令进程：

- 自动分配进程 ID，跟踪状态（运行中/已完成/错误/已终止）
- 记录 stdout/stderr，支持最大行数限制
- 提供统一的终止接口

### 日志面板

`LogPanel` 组件提供统一的输出展示体验：

- 终端风格 UI，支持状态指示灯（运行/完成/错误/终止）
- 自动滚动与手动滚动切换
- 一键复制、清空输出
- 行号显示（可选）

---

## 🤝 贡献指南

欢迎贡献代码、提交 Issue 或建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

### 开发提示

```bash
# 仅启动前端开发服务器（不启动 Tauri 窗口）
cd UltraToolBox/UltraToolBox
npm run dev

# 构建前端并预览
npm run build
npm run preview

# 添加 Tauri 插件
npm run tauri add <plugin-name>
```

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ShenTongen">ShenTongen</a>
</p>
