<p align="center">
  <img src="https://img.icons8.com/fluency/96/wrench.png" alt="UltraToolBox" width="96" />
</p>

<h1 align="center">UltraToolBox 🔧</h1>

<p align="center">
  <strong>크로스 플랫폼 CLI 도구상자 — 개발/운영/Android 도구를 한 곳에</strong>
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

## 📋 소개

**UltraToolBox**는 [Tauri 2](https://v2.tauri.app/) 기반의 크로스 플랫폼 데스크톱 도구상자입니다. 자주 사용하는 CLI 도구를 직관적인 GUI로 감싸서, 복잡한 명령어 인수를 외우거나 여러 터미널 창을 전환할 필요 없이 ADB 디버깅, 네트워크 테스트, 파일 다운로드 등을 하나의 앱에서 수행할 수 있습니다.

> ⚡ **바로 사용 가능** — 시스템에 해당 CLI 도구(adb / iperf3 / aria2c / curl / ping)만 설치되어 있으면 통합된 GUI에서 바로 사용할 수 있습니다.

---

## 📁 디렉토리 구조

이 프로젝트의 루트 디렉토리 구성:

```
UltraToolBox/
├── UltraToolBox/          # 🎯 메인 프로젝트 — Tauri 2 데스크톱 앱 소스 코드
│   ├── src/               # Vue 3 프론트엔드 (컴포넌트/페이지/라우터/스토어)
│   ├── src-tauri/         # Rust 백엔드 (Tauri 설정/플러그인 등록)
│   ├── public/            # 정적 리소스
│   └── package.json       # 프론트엔드 의존성
├── UltraToolBox规划/       # 📝 프로젝트 기획 및 설계 문서 (중국어)
│   ├── 规划.md            # 개발 계획 및 단계 구분
│   ├── 工具.md            # 도구 기능 목록 및 요구사항
│   └── 开发AI响应.md       # AI 지원 개발 대화 기록
├── LICENSE                # 📄 MIT 라이선스
├── README.md              # 📖 중국어 버전
├── README.en.md           # 📖 영어 버전
├── README.ja.md           # 📖 일본어 버전
└── README.ko.md           # 📖 한국어 버전 (이 파일)
```

### 디렉토리 설명

| 디렉토리 | 설명 |
|---------|------|
| **`UltraToolBox/`** | 메인 프로젝트 디렉토리. Tauri 2 데스크톱 애플리케이션의 전체 소스 코드를 포함합니다. 프론트엔드(Vue 3 + TypeScript)와 백엔드(Rust) 코드가 모두 이 디렉토리에 있습니다. `npm run tauri dev` 명령은 이 디렉토리에서 실행합니다. |
| **`UltraToolBox规划/`** | 프로젝트 기획 문서(중국어). 초기 요구사항 분석, 기능 계획, UI 디자인 개념, 개발 단계 구분을 포함합니다. 프로젝트 배경과 설계 방향을 이해하려는 기여자에게 적합합니다. |

---

## ✨ 기능

### 📱 ADB 디버그 브리지

5개의 탭으로 구성된 포괄적인 Android 디바이스 디버깅 도구:

| 기능 | 설명 |
|------|------|
| **디바이스 목록** | 연결된 디바이스 스캔, Wi-Fi 연결/해제 지원, 모델명·Android 버전·배터리 잔량 표시 |
| **빠른 작업** | 원클릭 스크린샷, 화면 녹화, 재부팅 (일반 / Bootloader / Recovery) |
| **APK 관리** | APK 설치, 앱 제거, 설치된 앱 목록 (검색 지원) |
| **Logcat** | 실시간 디바이스 로그 뷰어, 키워드 필터링 지원, 시작/중지 가능 |
| **파일 브라우저** | 디바이스 파일 시스템 탐색, 파일 내용 보기 |

### 🌐 네트워크 도구

세 가지 네트워크 진단 도구 통합:

| 도구 | 기능 |
|------|------|
| **Ping** | 네트워크 연결 테스트, 대상 주소와 프로브 횟수 설정 가능 |
| **iPerf3** | 대역폭 측정, 클라이언트/서버 모드, 포트·시간·역방향 테스트 설정 가능 |
| **cURL** | HTTP 요청 빌더, GET/POST/PUT/DELETE/PATCH 지원, 커스텀 헤더와 바디 |

### ⬇️ Aria2 다운로드 관리자

경량 멀티 프로토콜 다운로드 도구:

| 기능 | 설명 |
|------|------|
| **RPC 서버** | 원클릭 Aria2 RPC 데몬 시작/중지, 포트·시크릿·동시 실행 수 설정 가능 |
| **HTTP 다운로드** | URL 다운로드, 멀티스레드·이어받기 지원 |
| **BT / 마그넷 링크** | BitTorrent 및 Magnet 링크 다운로드 지원 |

### 💻 터미널 런처

원클릭 시스템 터미널 실행, 플랫폼(macOS / Windows / Linux) 자동 감지, iTerm2(macOS) 지원.

### 🖥️ 시스템 정보 (macOS 강화)

포괄적인 시스템 상태 모니터링 패널:

| 기능 | 설명 |
|------|------|
| **CPU 정보** | 모델, 코어 수, 주파수, 실시간 사용률, 로드 애버리지 |
| **메모리 정보** | 총 용량, 사용 중, 사용 가능, 사용률 바, 스왑, **메모리 압력** (macOS) |
| **디스크 정보** | 마운트 지점, 용량, 사용 공간, 사용률 바 |
| **시스템 정보** | 호스트명, OS, 커널, 실행 시간, 프로세스 수 |
| **실시간 전력 모니터링** | macOS 전용, 백그라운드 powermetrics 프로세스로 CPU/GPU/총 전력 지속 모니터링, root 비밀번호 저장 지원 |

### ⚙️ 설정 및 개인화

- **테마 전환** — 다크/라이트 모드 전환
- **다국어 지원** — 简体中文 / English / 日本語 / 한국어
- **바이너리 관리** — adb / iperf3 / aria2c / curl / ping 사용 가능 여부 및 버전 정보 확인
- **Root 비밀번호** — macOS 전력 모니터링을 위한 root 비밀번호 저장

---

## 🛠️ 기술 스택

| 레이어 | 기술 | 목적 |
|-------|------|------|
| **데스크톱 프레임워크** | [Tauri 2](https://v2.tauri.app/) | 크로스 플랫폼 데스크톱 앱 컨테이너, 작은 용량·고성능 |
| **프론트엔드** | [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) | UI 레이어 개발 |
| **UI** | [Naive UI](https://www.naiveui.com/) + [Lucide](https://lucide.dev/) | Vue 3 컴포넌트 + 벡터 아이콘 |
| **국제화** | [vue-i18n](https://vue-i18n.intlify.dev/) | 4개 언어 (zh-CN / en-US / ja-JP / ko-KR) |
| **상태 관리** | [Pinia](https://pinia.vuejs.org/) | 전역 상태 관리 |
| **라우터** | [Vue Router](https://router.vuejs.org/) | 페이지 라우팅 |
| **빌드 도구** | [Vite](https://vitejs.dev/) | 프론트엔드 빌드 |
| **백엔드 언어** | [Rust](https://www.rust-lang.org/) | 시스템 호출, 플러그인 확장, 전력 모니터링 |
| **시스템 정보** | [sysinfo](https://crates.io/crates/sysinfo) | CPU/메모리/디스크/프로세스/부하 수집 |
| **Tauri 플러그인** | shell / fs / dialog / process / opener | 명령 실행, 파일 작업, 대화상자 |
| **macOS 전력** | powermetrics + pmset | 실시간 CPU/GPU/총 전력 모니터링 |

---

## 🚀 빠른 시작

### 사전 요구사항

- **Node.js** ≥ 18
- **Rust** (설치: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **시스템 의존성**:
  - **macOS**: Xcode CLI Tools (`xcode-select --install`)
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `libwebkit2gtk-4.1-dev` 등 ([Tauri 공식 문서](https://v2.tauri.app/start/prerequisites/) 참조)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/UltraToolBox.git
cd UltraToolBox/UltraToolBox

# 프론트엔드 의존성 설치
npm install

# 개발 모드로 실행 (핫 리로드)
npm run tauri dev
```

### 설치 프로그램 빌드

```bash
cd UltraToolBox/UltraToolBox
npm run tauri build
```

빌드 결과물은 `src-tauri/target/release/bundle/`에 위치:
- **macOS**: `.dmg` / `.app`
- **Windows**: `.msi` / `.exe`
- **Linux**: `.deb` / `.AppImage`

---

## 📁 메인 프로젝트 구조 (`UltraToolBox/UltraToolBox/`)

```
UltraToolBox/
├── index.html                      # 엔트리 HTML
├── package.json                    # 프론트엔드 의존성
├── vite.config.ts                  # Vite 설정 (@ 경로 별칭 포함)
├── tsconfig.json                   # TypeScript 설정
├── src/
│   ├── main.ts                     # Vue 앱 엔트리 포인트
│   ├── App.vue                     # 메인 레이아웃 (사이드바 + 콘텐츠 + 상태 표시줄)
│   ├── router/index.ts             # 라우트 설정 (8개 페이지, 레이지 로딩)
│   ├── stores/
│   │   ├── app.ts                  # 앱 상태 (테마/사이드바/root비밀번호/언어)
│   │   ├── tools.ts                # 도구 바이너리 설정
│   │   └── process.ts              # 프로세스 관리 (시작/종료/상태/로그)
│   ├── composables/
│   │   ├── useCommand.ts           # 명령 실행 엔진 (execute / spawn)
│   │   └── useBinary.ts            # 바이너리 감지 (확인/버전/상태)
│   ├── locales/                    # i18n 번역 (zh-CN / en-US / ja-JP / ko-KR)
│   ├── types/index.ts              # TypeScript 타입 정의
│   ├── components/
│   │   ├── layout/AppSidebar.vue   # 접을 수 있는 사이드바 내비게이션
│   │   └── common/LogPanel.vue     # 통합 로그 패널 (터미널 스타일)
│   └── views/
│       ├── Home.vue                # 🏠 대시보드
│       ├── SystemInfoView.vue      # 🖥️ 시스템 정보 (CPU/메모리/디스크/전력 모니터링)
│       ├── AdbView.vue             # 📱 ADB 디버그 브리지
│       ├── NetworkView.vue         # 🌐 네트워크 도구
│       ├── Aria2View.vue           # ⬇️ Aria2 다운로더
│       ├── TerminalView.vue        # 💻 터미널 런처
│       ├── Settings.vue            # ⚙️ 설정
│       └── About.vue               # ℹ️ 정보
└── src-tauri/
    ├── Cargo.toml                  # Rust 의존성
    ├── tauri.conf.json             # Tauri 창/플러그인 설정
    ├── capabilities/default.json   # 권한 설정
    └── src/
        ├── main.rs                 # 엔트리 포인트
        └── lib.rs                  # 시스템 정보 수집 / 전력 모니터링 백그라운드 프로세스 / 플러그인 등록
                                    # (sysinfo + powermetrics + pmset)
```

---

## 🧩 핵심 아키텍처

### 명령 실행 엔진

모든 CLI 도구의 실행은 `useCommand` 컴포저블을 통해 중앙 관리됩니다:

```
사용자 동작 → useCommand → Tauri Shell 플러그인 → 시스템 CLI → 출력 콜백 → LogPanel 표시
```

- **`executeCommand()`** — 명령을 실행하고 완료를 기다린 후 전체 출력 반환
- **`spawnCommand()`** — 스트림 실행, 실시간 출력 콜백, 종료 지원
- 플랫폼 적응: Unix는 `sh -c`, Windows는 `cmd /c`

### 프로세스 관리

`useProcessStore`가 모든 실행 중인 명령 프로세스를 관리:

- 프로세스 ID 자동 할당, 상태 추적 (실행 중/완료/오류/강제 종료)
- stdout/stderr 기록, 최대 라인 수 설정 가능
- 통합된 종료 인터페이스 제공

### 로그 패널

`LogPanel` 컴포넌트가 통합된 출력 표시 환경을 제공:

- 터미널 스타일 UI, 상태 표시기 (실행 중/완료/오류/강제 종료)
- 자동 스크롤과 수동 스크롤 전환
- 원클릭 복사, 출력 지우기
- 선택적 줄 번호 표시

---

## 🤝 기여 가이드

코드 기여, Issue 제출, 제안은 언제나 환영합니다!

1. 저장소를 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'feat: add some amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 제출

### 개발 팁

```bash
# 프론트엔드 개발 서버만 시작 (Tauri 창 없이)
cd UltraToolBox/UltraToolBox
npm run dev

# 프론트엔드 빌드 및 미리보기
npm run build
npm run preview

# Tauri 플러그인 추가
npm run tauri add <plugin-name>
```

---

## 📄 라이선스

이 프로젝트는 [MIT License](./LICENSE)에 따라 오픈소스로 제공됩니다.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ShenTongen">ShenTongen</a>
</p>