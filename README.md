# Backlog Manager

A sleek, offline-first desktop application for tracking everything you want to watch, play, and visit — built with Electron, React, TypeScript, and SQLite.

![Electron](https://img.shields.io/badge/Electron-31-47848F?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

---

## ✨ Features

| | Feature |
|---|---|
| 🎬 | **Movies** — search via TMDB, full poster & backdrop images |
| 📺 | **TV Shows** — search via TMDB, track series separately |
| ⛩️ | **Anime** — search via AniList, banner + cover art |
| 🎮 | **Games** — search via IGDB, artwork banners + cover thumbnails |
| 🍽️ | **Restaurants** — search via Google Places, cuisine emoji icons |
| 🔒 | **Encrypted API keys** — stored locally using OS keychain (DPAPI on Windows) |

---

## 🖥️ Architecture

```
backlog-manager/
├── src/
│   ├── main/                     # Electron Main Process (Node.js)
│   │   ├── main.ts               # App entry, BrowserWindow, CSP
│   │   ├── database/
│   │   │   ├── db.ts             # better-sqlite3 connection & all query helpers
│   │   │   └── Sorters.ts        # All sorting logic (isolated, pure functions)
│   │   ├── ipc/
│   │   │   ├── handlers.ts       # backlog:* IPC channel handlers
│   │   │   └── settingsHandlers.ts # settings:* IPC channel handlers
│   │   └── services/
│   │       ├── ScannerService.ts # All external API fetchers
│   │       └── ConfigStore.ts    # Encrypted API key storage
│   ├── preload.ts                # contextBridge — the security boundary
│   ├── shared/
│   │   ├── types.ts              # Shared interfaces, enums, IPC channel names
│   │   └── cuisineIcons.ts       # Cuisine alias → emoji map
│   └── renderer/                 # React Frontend
│       ├── App.tsx               # Root component, state, handlers
│       ├── global.d.ts           # window.backlogAPI / window.settingsAPI types
│       ├── styles.css            # Tailwind v4 entry + custom @theme tokens
│       └── components/
│           ├── Sidebar.tsx       # Category navigation + settings button
│           ├── SortBar.tsx       # Sort mode selector
│           ├── BacklogList.tsx   # DnD list container
│           ├── HeroItem.tsx      # Index 0 — large hero card
│           ├── CompactItem.tsx   # Index 1+ — compact row
│           ├── SearchModal.tsx   # Search overlay
│           └── SettingsModal.tsx # API key management
├── assets/
│   └── icon.ico                  # App icon (provide your own)
├── webpack.main.config.js
├── webpack.renderer.config.js
├── webpack.preload.config.js
├── postcss.config.js
└── package.json
```

### IPC Architecture

The UI **never** touches the database or external APIs directly. Every action flows through a strict bridge:

```
Renderer (React)
    │  window.backlogAPI.getItems(category)
    ▼
preload.ts  (contextBridge — sanitises all calls)
    │  ipcRenderer.invoke('backlog:get-items', category)
    ▼
handlers.ts  (ipcMain.handle — validates & executes)
    │
    ├── db.ts        (SQLite reads/writes)
    ├── Sorters.ts   (pure sort functions)
    └── ScannerService.ts  (external API calls)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Git](https://git-scm.com/)
- A Windows machine (portable `.exe` targets Win32)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/backlog-manager.git
cd backlog-manager

# 2. Install dependencies
npm install

# 3. Copy the env example (optional — keys can be set in-app)
cp .env.example .env

# 4. Start in development mode
npm start
```

---

## 🔑 API Key Setup

API keys are managed inside the app via the **⚙️ API Settings** button at the bottom of the sidebar. Keys are encrypted on disk using your OS keychain — they are never stored in plain text.

### TMDB — Movies & TV

> Free forever, no credit card required.

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to **Settings → API → Create → Developer**
3. Copy the **API Read Access Token** (the long JWT starting with `eyJ`)
4. Paste into **TMDB API Key** in Settings

### AniList — Anime

> No API key required. Works out of the box.

### IGDB — Games

> Free tier via Twitch Developer account.

1. Create a Twitch account at [dev.twitch.tv](https://dev.twitch.tv/console)
2. Click **Register Your Application** → set OAuth redirect to `http://localhost`
3. Copy your **Client ID** and generate a **Client Secret**
4. Exchange them for an access token by running this in PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri "https://id.twitch.tv/oauth2/token?client_id=YOUR_ID&client_secret=YOUR_SECRET&grant_type=client_credentials"
```

5. Copy the returned `access_token`
6. Paste **Client ID** and **Access Token** into Settings

> ⚠️ The access token expires every ~60 days. Re-run the PowerShell command to refresh it.

### Google Places — Restaurants

> Free tier: $200/month credit (covers ~5,000 searches/month).

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Enable APIs**
3. Search for and enable **"Places API (New)"** — not the legacy Places API
4. Go to **Credentials → Create API Key**
5. Under key restrictions: set **Application restrictions** to `None`
6. Under **API restrictions**: restrict to `Places API (New)` only
7. Paste the key into **Google Places API Key** in Settings

---

## 📦 Building the Portable `.exe`

```bash
npm run make
```

Output will be at:
```
out/make/zip/win32/x64/BacklogManager-win32-x64-1.0.0.zip
```

Unzip anywhere and run `BacklogManager.exe`. Your database and API keys are stored in `%AppData%\Backlog Manager\` and persist across updates.

> **SmartScreen warning?** Click **More info → Run anyway**. This is expected for unsigned executables. See [code signing](https://www.electronjs.org/docs/latest/tutorial/code-signing) if you plan to distribute publicly.

---

## 🗄️ Data & Privacy

- All data is stored **locally** on your machine
- The database lives at `%AppData%\Backlog Manager\backlog.db`
- API keys are encrypted using Windows DPAPI via Electron's `safeStorage`
- No telemetry, no analytics, no accounts

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 31 |
| Frontend | React 18 + Tailwind CSS v4 |
| Language | TypeScript 5 (strict) |
| Database | SQLite via better-sqlite3 |
| Bundler | Webpack 5 via Electron Forge |
| Drag & Drop | @hello-pangea/dnd |
| Movies & TV | TMDB API |
| Anime | AniList GraphQL API |
| Games | IGDB API (Twitch) |
| Restaurants | Google Places API (New) |

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.
