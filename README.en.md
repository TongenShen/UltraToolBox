<p align="center">
  <img src="https://img.icons8.com/fluency/96/wrench.png" alt="UltraToolBox" width="96" />
</p>

<h1 align="center">UltraToolBox 🔧</h1>

<p align="center">
  <strong>Cross-platform CLI Toolbox — One-stop collection of dev/ops/Android tools</strong>
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

## 📋 Introduction

**UltraToolBox** is a cross-platform desktop toolbox built with [Tauri 2](https://v2.tauri.app/), wrapping commonly used CLI tools into an intuitive GUI. No need to memorize complex command-line arguments or switch between multiple terminal windows — one app for ADB debugging, network testing, file downloading, and more.

> ⚡ **Ready to use** — Just install the corresponding CLI tools (adb / iperf3 / aria2c / curl / ping) on your system, and operate them through a unified graphical interface.

---

## 📁 Directory Structure

The root directory of this project contains:

```
UltraToolBox/
├── UltraToolBox/          # 🎯 Main project — Tauri 2 desktop application source code
│   ├── src/               # Vue 3 frontend source (components/pages/router/stores)
│   ├── src-tauri/         # Rust backend source (Tauri config/plugin registration)
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── UltraToolBox规划/       # 📝 Project planning & design docs (Chinese)
│   ├── 规划.md            # Development plan & phase breakdown
│   ├── 工具.md            # Tool feature list & requirements
│   └── 开发AI响应.md       # AI-assisted development conversation log
├── LICENSE                # 📄 MIT License
├── README.md              # 📖 Chinese version
├── README.en.md           # 📖 English version (this file)
├── README.ja.md           # 📖 Japanese version
└── README.ko.md           # 📖 Korean version
```

### Directory Descriptions

| Directory | Description |
|-----------|-------------|
| **`UltraToolBox/`** | Main project directory containing the complete Tauri 2 desktop application source code. Both frontend (Vue 3 + TypeScript) and backend (Rust) code are located here. Run `npm run tauri dev` in this directory. |
| **`UltraToolBox规划/`** | Project planning documents in Chinese, including initial requirements analysis, feature planning, UI design concepts, and development phase breakdown. Suitable for contributors who want to understand the project background and design approach. |

---

## ✨ Features

### 📱 ADB Debug Bridge

Comprehensive Android device debugging tool with five tabs:

| Feature | Description |
|---------|-------------|
| **Device List** | Scan connected devices, supports Wi-Fi connection/disconnection, shows model, Android version, battery level |
| **Quick Actions** | One-click screenshot, screen recording, reboot (normal / bootloader / recovery) |
| **APK Manager** | Install APK, uninstall apps, browse installed apps (with search) |
| **Logcat** | Real-time device log viewer with keyword filtering, start/stop anytime |
| **File Browser** | Browse device file system, view file contents |

### 🌐 Network Tools

Three integrated network diagnostic tools:

| Tool | Function |
|------|----------|
| **Ping** | Network connectivity test, configurable target address and probe count |
| **iPerf3** | Bandwidth measurement, client/server mode, configurable port, duration, reverse test |
| **cURL** | HTTP request builder, supports GET/POST/PUT/DELETE/PATCH, custom headers and body |

### ⬇️ Aria2 Download Manager

Lightweight multi-protocol download tool:

| Feature | Description |
|---------|-------------|
| **RPC Server** | One-click start/stop Aria2 RPC daemon, configurable port, secret, concurrency |
| **HTTP Download** | URL download with multi-threaded resume support |
| **BT / Magnet Links** | BitTorrent and Magnet link download support |

### 💻 Terminal Launcher

One-click system terminal launcher, auto-detects current platform (macOS / Windows / Linux), supports iTerm2 (macOS).

### ⚙️ Settings & Personalization

- **Theme Switch** — Toggle between dark/light mode
- **Binary Manager** — Check availability and version info of adb / iperf3 / aria2c / curl / ping

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Desktop Framework** | [Tauri 2](https://v2.tauri.app/) | Cross-platform desktop app container, small footprint, high performance |
| **Frontend Framework** | [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) | UI layer development |
| **UI Component Library** | [Naive UI](https://www.naiveui.com/) | High-quality Vue 3 components |
| **State Management** | [Pinia](https://pinia.vuejs.org/) | Global state management |
| **Router** | [Vue Router](https://router.vuejs.org/) | Page routing |
| **Build Tool** | [Vite](https://vitejs.dev/) | Frontend build tooling |
| **Backend Language** | [Rust](https://www.rust-lang.org/) | System calls, plugin extensions |
| **Tauri Plugins** | shell / fs / dialog / process / opener | Command execution, file operations, dialogs |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Rust** (install: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **System Dependencies**:
  - **macOS**: Xcode CLI Tools (`xcode-select --install`)
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `libwebkit2gtk-4.1-dev` etc. (see [Tauri docs](https://v2.tauri.app/start/prerequisites/))

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/your-username/UltraToolBox.git
cd UltraToolBox/UltraToolBox

# Install frontend dependencies
npm install

# Run in development mode (hot-reload)
npm run tauri dev
```

### Build Installer

```bash
cd UltraToolBox/UltraToolBox
npm run tauri build
```

Build artifacts are located in `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` / `.app`
- **Windows**: `.msi` / `.exe`
- **Linux**: `.deb` / `.AppImage`

---

## 📁 Main Project Structure (`UltraToolBox/UltraToolBox/`)

```
UltraToolBox/
├── index.html                      # Entry HTML
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite config (with @ path alias)
├── tsconfig.json                   # TypeScript config
├── src/
│   ├── main.ts                     # Vue app entry point
│   ├── App.vue                     # Main layout (sidebar + content + status bar)
│   ├── router/index.ts             # Route config (7 pages, lazy-loaded)
│   ├── stores/
│   │   ├── app.ts                  # App state (theme/sidebar)
│   │   ├── tools.ts                # Tool binary config
│   │   └── process.ts              # Process manager (start/kill/status/log)
│   ├── composables/
│   │   ├── useCommand.ts           # Command execution engine (execute/spawn)
│   │   └── useBinary.ts            # Binary detection (check/version/status)
│   ├── types/index.ts              # TypeScript type definitions
│   ├── components/
│   │   ├── layout/AppSidebar.vue   # Collapsible sidebar navigation
│   │   └── common/LogPanel.vue     # Unified log panel (terminal style)
│   └── views/
│       ├── Home.vue                # 🏠 Dashboard
│       ├── AdbView.vue             # 📱 ADB Debug Bridge
│       ├── NetworkView.vue         # 🌐 Network Tools
│       ├── Aria2View.vue           # ⬇️ Aria2 Downloader
│       ├── TerminalView.vue        # 💻 Terminal Launcher
│       ├── Settings.vue            # ⚙️ Settings
│       └── About.vue               # ℹ️ About
└── src-tauri/
    ├── Cargo.toml                  # Rust dependencies
    ├── tauri.conf.json             # Tauri window/plugin config
    ├── capabilities/default.json   # Permission config
    └── src/
        ├── main.rs                 # Entry point
        └── lib.rs                  # Plugin registration (shell/fs/dialog/process/opener)
```

---

## 🧩 Core Architecture

### Command Execution Engine

All CLI tool execution is managed through the `useCommand` composable:

```
User Action → useCommand → Tauri Shell Plugin → System CLI → Output Callback → LogPanel Display
```

- **`executeCommand()`** — Execute command and wait for completion, returns full output
- **`spawnCommand()`** — Stream execution, real-time output callbacks, supports termination
- Platform adaptive: `sh -c` on Unix, `cmd /c` on Windows

### Process Management

`useProcessStore` manages all running command processes:

- Auto-assigns process IDs, tracks status (running/completed/error/killed)
- Records stdout/stderr with configurable max line limit
- Provides unified termination interface

### Log Panel

The `LogPanel` component provides a unified output display experience:

- Terminal-style UI with status indicator (running/completed/error/killed)
- Auto-scroll and manual scroll toggle
- One-click copy, clear output
- Optional line numbers

---

## 🤝 Contributing

Contributions, issues, and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Dev Tips

```bash
# Start only the frontend dev server (without Tauri window)
cd UltraToolBox/UltraToolBox
npm run dev

# Build frontend and preview
npm run build
npm run preview

# Add a Tauri plugin
npm run tauri add <plugin-name>
```

---

## 📄 License

This project is open-sourced under the [MIT License](./LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ShenTongen">ShenTongen</a>
</p>