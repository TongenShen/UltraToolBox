<p align="center">
  <img src="https://img.icons8.com/fluency/96/wrench.png" alt="UltraToolBox" width="96" />
</p>

<h1 align="center">UltraToolBox 🔧</h1>

<p align="center">
  <strong>クロスプラットフォーム CLI ツールボックス — 開発・運用・Android 用ツールをひとつに</strong>
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

## 📋 はじめに

**UltraToolBox** は [Tauri 2](https://v2.tauri.app/) ベースのクロスプラットフォームデスクトップツールボックスです。よく使う CLI ツールを直感的な GUI でラップし、複雑なコマンド引数を覚えたり複数のターミナルウィンドウを切り替えたりする必要はありません。ADB デバッグ、ネットワークテスト、ファイルダウンロードなどを 1 つのアプリで実行できます。

> ⚡ **すぐに使える** — システムに対応する CLI ツール（adb / iperf3 / aria2c / curl / ping）がインストールされていれば、統合された GUI ですぐに操作できます。

---

## 📁 ディレクトリ構成

このプロジェクトのルートディレクトリ構成：

```
UltraToolBox/
├── UltraToolBox/          # 🎯 メインプロジェクト — Tauri 2 デスクトップアプリ
│   ├── src/               # Vue 3 フロントエンド（コンポーネント/ページ/ルーター/ストア）
│   ├── src-tauri/         # Rust バックエンド（Tauri 設定/プラグイン登録）
│   ├── public/            # 静的アセット
│   └── package.json       # フロントエンド依存関係
├── UltraToolBox规划/       # 📝 プロジェクト計画・設計書（中国語）
│   ├── 规划.md            # 開発計画とフェーズ分割
│   ├── 工具.md            # ツール機能一覧と要件
│   └── 開発AI响应.md       # AI 支援開発の会話ログ
├── LICENSE                # 📄 MIT ライセンス
├── README.md              # 📖 中国語版
├── README.en.md           # 📖 英語版
├── README.ja.md           # 📖 日本語版（このファイル）
└── README.ko.md           # 📖 韓国語版
```

### ディレクトリ説明

| ディレクトリ | 説明 |
|-------------|------|
| **`UltraToolBox/`** | メインプロジェクトディレクトリ。Tauri 2 デスクトップアプリケーションの完全なソースコードを含みます。フロントエンド（Vue 3 + TypeScript）とバックエンド（Rust）のコードはすべてこのディレクトリにあります。`npm run tauri dev` はこのディレクトリで実行します。 |
| **`UltraToolBox规划/`** | プロジェクト計画ドキュメント（中国語）。初期要件分析、機能計画、UI デザインコンセプト、開発フェーズの分割を含みます。プロジェクトの背景や設計思想を理解したい方に適しています。 |

---

## ✨ 機能

### 📱 ADB デバッグブリッジ

5 つのタブを持つ Android デバイスデバッグツール：

| 機能 | 説明 |
|------|------|
| **デバイス一覧** | 接続デバイスのスキャン、Wi-Fi 接続/切断、機種名・Android バージョン・バッテリー残量を表示 |
| **クイック操作** | ワンクリックスクリーンショット、画面録画、再起動（通常 / Bootloader / Recovery） |
| **APK 管理** | APK インストール、アプリのアンインストール、インストール済みアプリ一覧（検索対応） |
| **Logcat** | リアルタイムログビューア、キーワードフィルタリング対応、いつでも開始/停止 |
| **ファイルブラウザ** | デバイスのファイルシステムを参照、ファイル内容を表示 |

### 🌐 ネットワークツール

3 つのネットワーク診断ツールを統合：

| ツール | 機能 |
|--------|------|
| **Ping** | ネットワーク接続テスト、ターゲットアドレスとプローブ回数を設定可能 |
| **iPerf3** | 帯域幅測定、クライアント/サーバーモード、ポート・時間・リバーステストを設定可能 |
| **cURL** | HTTP リクエストビルダー、GET/POST/PUT/DELETE/PATCH 対応、カスタムヘッダーとボディ |

### ⬇️ Aria2 ダウンロードマネージャー

軽量マルチプロトコルダウンロードツール：

| 機能 | 説明 |
|------|------|
| **RPC サーバー** | ワンクリックで Aria2 RPC デーモンを起動/停止、ポート・シークレット・同時実行数を設定可能 |
| **HTTP ダウンロード** | URL ダウンロード、マルチスレッド・レジューム対応 |
| **BT / マグネットリンク** | BitTorrent および Magnet リンクのダウンロードに対応 |

### 💻 ターミナルランチャー

ワンクリックでシステムターミナルを起動、プラットフォーム（macOS / Windows / Linux）を自動検出、iTerm2（macOS）に対応。

### ⚙️ 設定とカスタマイズ

- **テーマ切替** — ダーク/ライトモードの切り替え
- **バイナリ管理** — adb / iperf3 / aria2c / curl / ping の可用性とバージョン情報を確認

---

## 🛠️ 技術スタック

| レイヤー | 技術 | 目的 |
|---------|------|------|
| **デスクトップフレームワーク** | [Tauri 2](https://v2.tauri.app/) | クロスプラットフォームデスクトップアプリ、軽量・高性能 |
| **フロントエンド** | [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) | UI 層の開発 |
| **UI コンポーネント** | [Naive UI](https://www.naiveui.com/) | 高品質な Vue 3 コンポーネント |
| **状態管理** | [Pinia](https://pinia.vuejs.org/) | グローバル状態管理 |
| **ルーター** | [Vue Router](https://router.vuejs.org/) | ページルーティング |
| **ビルドツール** | [Vite](https://vitejs.dev/) | フロントエンドビルド |
| **バックエンド言語** | [Rust](https://www.rust-lang.org/) | システムコール、プラグイン拡張 |
| **Tauri プラグイン** | shell / fs / dialog / process / opener | コマンド実行、ファイル操作、ダイアログ |

---

## 🚀 クイックスタート

### 前提条件

- **Node.js** ≥ 18
- **Rust** (インストール: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **システム依存関係**:
  - **macOS**: Xcode CLI Tools (`xcode-select --install`)
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `libwebkit2gtk-4.1-dev` など（[Tauri 公式ドキュメント](https://v2.tauri.app/start/prerequisites/) を参照）

### インストールと実行

```bash
# リポジトリをクローン
git clone https://github.com/your-username/UltraToolBox.git
cd UltraToolBox/UltraToolBox

# フロントエンド依存関係をインストール
npm install

# 開発モードで実行（ホットリロード）
npm run tauri dev
```

### インストーラーのビルド

```bash
cd UltraToolBox/UltraToolBox
npm run tauri build
```

ビルド成果物は `src-tauri/target/release/bundle/` に出力されます：
- **macOS**: `.dmg` / `.app`
- **Windows**: `.msi` / `.exe`
- **Linux**: `.deb` / `.AppImage`

---

## 📁 メインプロジェクト構成 (`UltraToolBox/UltraToolBox/`)

```
UltraToolBox/
├── index.html                      # エントリー HTML
├── package.json                    # フロントエンド依存関係
├── vite.config.ts                  # Vite 設定（@ パスエイリアス含む）
├── tsconfig.json                   # TypeScript 設定
├── src/
│   ├── main.ts                     # Vue アプリエントリーポイント
│   ├── App.vue                     # メインレイアウト（サイドバー + コンテンツ + ステータスバー）
│   ├── router/index.ts             # ルート設定（7 ページ、遅延ロード）
│   ├── stores/
│   │   ├── app.ts                  # アプリ状態（テーマ/サイドバー）
│   │   ├── tools.ts                # ツールバイナリ設定
│   │   └── process.ts              # プロセス管理（開始/停止/状態/ログ）
│   ├── composables/
│   │   ├── useCommand.ts           # コマンド実行エンジン（execute / spawn）
│   │   └── useBinary.ts            # バイナリ検出（確認/バージョン/状態）
│   ├── types/index.ts              # TypeScript 型定義
│   ├── components/
│   │   ├── layout/AppSidebar.vue   # 折りたたみ可能なサイドバーナビゲーション
│   │   └── common/LogPanel.vue     # 統一ログパネル（ターミナルスタイル）
│   └── views/
│       ├── Home.vue                # 🏠 ダッシュボード
│       ├── AdbView.vue             # 📱 ADB デバッグブリッジ
│       ├── NetworkView.vue         # 🌐 ネットワークツール
│       ├── Aria2View.vue           # ⬇️ Aria2 ダウンローダー
│       ├── TerminalView.vue        # 💻 ターミナルランチャー
│       ├── Settings.vue            # ⚙️ 設定
│       └── About.vue               # ℹ️ 概要
└── src-tauri/
    ├── Cargo.toml                  # Rust 依存関係
    ├── tauri.conf.json             # Tauri ウィンドウ/プラグイン設定
    ├── capabilities/default.json   # 権限設定
    └── src/
        ├── main.rs                 # エントリーポイント
        └── lib.rs                  # プラグイン登録（shell/fs/dialog/process/opener）
```

---

## 🧩 コアアーキテクチャ

### コマンド実行エンジン

すべての CLI ツールの実行は `useCommand` composable で一元管理されます：

```
ユーザー操作 → useCommand → Tauri Shell プラグイン → システム CLI → 出力コールバック → LogPanel 表示
```

- **`executeCommand()`** — コマンドを実行して完了を待機、完全な出力を返す
- **`spawnCommand()`** — ストリーム実行、リアルタイム出力コールバック、終了対応
- プラットフォーム適応：Unix は `sh -c`、Windows は `cmd /c`

### プロセス管理

`useProcessStore` がすべての実行中コマンドプロセスを管理：

- プロセス ID を自動割り当て、状態を追跡（実行中/完了/エラー/強制終了）
- stdout/stderr を記録、最大行数を設定可能
- 統一された終了インターフェースを提供

### ログパネル

`LogPanel` コンポーネントが統一された出力表示を提供：

- ターミナルスタイル UI、状態インジケーター（実行中/完了/エラー/強制終了）
- 自動スクロールと手動スクロールの切り替え
- ワンクリックコピー、出力クリア
- 行番号表示（オプション）

---

## 🤝 コントリビューション

コードの貢献、Issue の報告、提案は大歓迎です！

1. リポジトリを Fork
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を送信

### 開発のヒント

```bash
# フロントエンド開発サーバーのみ起動（Tauri ウィンドウなし）
cd UltraToolBox/UltraToolBox
npm run dev

# フロントエンドをビルドしてプレビュー
npm run build
npm run preview

# Tauri プラグインを追加
npm run tauri add <plugin-name>
```

---

## 📄 ライセンス

このプロジェクトは [MIT License](./LICENSE) の下でオープンソース化されています。

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ShenTongen">ShenTongen</a>
</p>