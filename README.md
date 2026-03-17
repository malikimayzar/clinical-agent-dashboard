# clinical-agent-dashboard

> **Industrial Command Center UI** — React dashboard untuk [clinical-agent v3.0](https://github.com/malikimayzar/clinical-agent), sistem monitoring literatur medis otonom yang mendeteksi kontradiksi antara paper ArXiv baru dengan knowledge base menggunakan NLI berbasis Groq + Rust.

**Live Dashboard:** [clinical-agent-ui.vercel.app](https://clinical-agent-ui.vercel.app)
**Live API:** [clinical-agent-api-production.up.railway.app](https://clinical-agent-api-production.up.railway.app/docs)

---

## Overview

Dashboard ini merupakan frontend dari ekosistem `clinical-agent v3.0` — sebuah autonomous medical AI agent yang berjalan setiap hari pukul 02:00 UTC. Dashboard dibangun dengan aesthetic **Brutalist-Industrial**: tipografi bold condensed, palette hitam-merah, monospace data labels, dan animasi yang merepresentasikan sistem AI yang benar-benar bekerja.

---

## Screenshots

| Overview | Conflicts | System Internals |
|---|---|---|
| Pipeline metrics realtime | NLI contradiction split cards | LangGraph 8-node visualizer |

---

## Features

### 6 Halaman Utama

**01 · Overview**
- Metric cards dengan count-up animation: Total Runs, Claims Extracted, Critical Conflicts, Avg Faithfulness
- Bar chart pipeline runs 14 hari terakhir (papers / claims / conflicts)
- Rust Performance Benchmark visual: Python ~58min vs Rust 963ms (3,600×)
- System status per-service dengan language badges (RUST/PYTHON/SQL/GROQ)
- Terminal audit log live feed dengan color-coded prefixes `[RUST]` `[NLI]` `[OK]`
- Scanline effect + dot grid background + glitch text animation
- Countdown timer NEXT RUN real-time

**02 · Conflicts**
- Contradiction split card: New Claim (ArXiv) vs Counter-Evidence (KB) dengan VS badge
- Circular gauge hybrid similarity score per conflict
- Score breakdown bars: NLI Confidence / Faithfulness / Hybrid
- Filter tabs dengan count badges: ALL · CRITICAL · MAJOR · MINOR
- Performance metadata per card: `NLI INFERENCE: 42MS` · `SIMILARITY: 47MS`
- Mark Resolved → card hilang dengan animasi
- Radar scanning animation pada empty state

**03 · Claims**
- Intelligence feed dengan FlipCounter total claims
- Status filter + live search
- `[RUST-ENGINE: <50MS]` tag per row
- Confidence mini bar + claim age fading (makin lama makin pudar)
- Bulk select + Export JSON
- Keyboard navigation ↑↓
- Terminal-style empty state

**04 · Papers**
- Search ArXiv papers
- Slide-in detail drawer: abstract, authors, ArXiv link
- Per-paper claim list dengan status badges
- Terminal empty state

**05 · Runs**
- 30-day execution heatmap (GitHub contribution graph style)
- Success rate badge (100% / N runs)
- Delta comparison: +2 CLAIMS / -1 CONFLICTS vs previous run
- ⚡ FASTEST run badge
- Expandable node execution trace: semua 8 node dengan timing + language badge
- Faithfulness health score: 15/18 PASSED · 83%
- Export run log sebagai JSON
- Reliability banner: MISSED RUN RECOVERY · ZERO-LOSS POSTGRESQL

**06 · System Internals**
- **LangGraph 8-Node Visualizer**: animasi replay pipeline dengan speed selector 1×/2×/4×
- **KB Growth Chart**: time-travel slider 0 → 3,245 chunks, tier legend, indexed papers list
- **API Latency Monitor**: realtime ping semua endpoints, history sparkline, PING ALL

### Sidebar
- Operator identity: MALIKI MAYZAR · ASPIRING AI ENGINEER
- Social links: GitHub · LinkedIn · Instagram dengan hover red glow
- Health dots API ● DB ● RUST dengan LED glow effect
- `[SYSTEM_INFRA]` monitor: Orchestrator, LLM, Similarity, Storage, Scheduler
- Live countdown NEXT_RUN
- `[TECH_STACK]` per layer dengan color-coded glow

### Mobile
- Responsive hamburger menu dengan slide-in drawer overlay
- Fixed bottom navigation bar (6 icons)
- Swipe kanan/kiri gesture buka/tutup drawer
- Touch targets minimum 44px
- PWA: installable via "Add to Home Screen"

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Charts | Recharts |
| Fonts | Bebas Neue · Barlow Condensed · JetBrains Mono |
| Deployment | Vercel |
| API | FastAPI on Railway |

---

## Connected Backend

Dashboard ini consume REST API dari `clinical-agent` backend:

| Endpoint | Description |
|---|---|
| `GET /stats` | Aggregate pipeline statistics |
| `GET /runs` | Pipeline execution history |
| `GET /runs/{id}` | Run detail + audit log |
| `GET /claims` | Extracted medical claims |
| `GET /conflicts` | NLI-detected contradictions |
| `GET /papers` | Fetched ArXiv papers |
| `GET /papers/{id}` | Paper detail + claims |

---

## Project Structure

```
clinical-agent-dashboard/
├── public/
│   ├── index.html          # PWA meta tags
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/
│   │   ├── UI.js            # Shared components (pills, cards, helpers)
│   │   ├── LangGraphVisualizer.js  # 8-node pipeline replay
│   │   ├── KBGrowthChart.js        # KB time-travel chart
│   │   └── APILatencyBadge.js      # Realtime API diagnostics
│   ├── pages/
│   │   ├── Overview.js      # Command center homepage
│   │   ├── Conflicts.js     # NLI contradiction explorer
│   │   ├── Claims.js        # Intelligence feed
│   │   ├── Papers.js        # ArXiv paper browser
│   │   ├── Runs.js          # Pipeline execution history
│   │   └── System.js        # System internals
│   ├── App.js               # Root: routing + sidebar + mobile nav
│   ├── api.js               # API fetch + useAPI hook
│   └── index.css            # Design system + animations
└── package.json
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm start
# → localhost:3000 (atau port lain jika bentrok)
```

---

## Deploy

Dashboard di-deploy otomatis ke Vercel setiap push ke `main`:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
# Vercel auto-deploy dalam ~1 menit
```

---

## Design System

**Palette:**
- Background: `#09090b` (off-black)
- Primary text: `#f4f4f5` (zinc-100)
- Labels: `#a1a1aa` (zinc-400)
- Accent: `#ef4444` (emergency red)
- Success: `#22c55e` (neon green)
- Warning: `#f59e0b` (amber)

**Typography:**
- Display: `Bebas Neue` / `Barlow Condensed` — headers bold uppercase
- Body: `Barlow` — UI text
- Data: `JetBrains Mono` — semua angka, label, metadata

**Aesthetic:** Brutalist-Industrial — high contrast, monospace data, no rounded corners, scanline effects, LED glow dots.

---

## Related Repositories

| Repo | Description |
|---|---|
| [clinical-agent](https://github.com/malikimayzar/clinical-agent) | Backend: Python + Rust + Go pipeline |
| [rag-research](https://github.com/malikimayzar/rag-research) | BM25 + dense hybrid knowledge base |
| [llm-eval-framework](https://github.com/malikimayzar/llm-eval-framework) | Faithfulness evaluator |
| [arxiv-research-assistant](https://github.com/malikimayzar/arxiv-research-assistant) | ArXiv paper fetcher (Go) |

---

*Maliki Mayzar · clinical-agent-dashboard v1.0 · React + Vercel · Zero Budget. Full Power.*