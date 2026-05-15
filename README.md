# 🌟 WebNovel - 星的码字

A modern web-based novel writing platform with AI assistance.

![Stack](https://img.shields.io/badge/React-18-blue?logo=react) ![Stack](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss) ![Stack](https://img.shields.io/badge/PocketBase-0.22-green) ![Stack](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

## ✨ Features

- 📚 **Bookshelf** — Manage multiple novels with cover images, genre tags, progress tracking
- ✍️ **Chapter Editor** — Split-pane editor with chapter tree, real-time word count, auto-save
- 👥 **Character Management** — Categorized character cards with AI generation and text import
- 🌍 **World-building** — Hierarchical worldview tree with expand/collapse
- 🤖 **AI Assistant** — Outline generation, content expansion, character creation via AI
- 📊 **Writing Statistics** — Weekly word count charts, writing streaks, daily goals
- 🎨 **Light Theme** — Clean, modern UI inspired by professional writing tools
- 🔌 **Plug & Play** — Single binary backend (PocketBase), no Docker/Node required

## 🚀 Quick Start

### Backend (PocketBase)

```bash
# Download PocketBase
curl -sL https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip -o pb.zip
unzip pb.zip -d pb && rm pb.zip

# Start server
./pb/pocketbase serve --http=0.0.0.0:8090 --dir=./pb_data --origins="*"

# Create admin account
./pb/pocketbase admin create admin@example.com your-password --dir=./pb_data
```

Admin UI: `http://localhost:8090/_/`

### Frontend (React + Vite)

```bash
cd novelwriter-web
npm install
npm run dev
```

App: `http://localhost:5173`

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5 |
| UI Components | shadcn/ui (manual), TailwindCSS 3, Lucide React |
| State Management | Zustand |
| Backend | PocketBase 0.22 (Go, SQLite) |
| AI Integration | OpenAI-compatible API (Kimi, DeepSeek, MiMo, etc.) |

## 📁 Project Structure

```
novelwriter-web/
├── src/
│   ├── App.tsx                    # Main layout (3-column)
│   ├── main.tsx                   # Entry point
│   ├── lib/
│   │   ├── pb.ts                  # PocketBase client
│   │   └── utils.ts               # cn() utility
│   ├── store/
│   │   └── useAppStore.ts         # Zustand app state
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── DailyProgress.tsx      # Circular progress ring
│   │   ├── WeeklyChart.tsx        # Weekly stats chart
│   │   └── RightSidebar.tsx       # Quick actions + characters
│   └── pages/
│       ├── BookshelfPage.tsx      # Bookshelf + recent edits + stats
│       ├── EditorPage.tsx         # Chapter editor + sidebar
│       ├── CharactersPage.tsx     # Character management
│       ├── WorldPage.tsx          # World-building tree
│       ├── AIPage.tsx             # AI assistant
│       ├── StatsPage.tsx          # Writing statistics
│       └── SettingsPage.tsx       # AI config + settings
├── pb/                            # PocketBase binary (download separately)
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 📦 PocketBase Collections

| Collection | Key Fields |
|-----------|-----------|
| `works` | title, cover, genres, totalWords, progress |
| `volumes` | title, sortOrder, work (relation) |
| `chapters` | title, content, wordCount, chapterNumber, work (relation) |
| `characters` | name, gender, role, personality, ability, work (relation) |
| `world_nodes` | name, category, description, parent (self-relation) |
| `ai_configs` | name, baseUrl, apiKey, model, isDefault |

## 🔧 AI Configuration

Supports any OpenAI-compatible API:
- **Kimi** — `https://api.moonshot.cn/v1`
- **DeepSeek** — `https://api.deepseek.com/v1`
- **MiMo** — `https://token-plan-cn.xiaomimimo.com/v1`
- **OpenRouter** — `https://openrouter.ai/api/v1`

Configure in Settings → AI Provider.

## 📄 License

MIT
