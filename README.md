# 🕌 Malikina - Islamic Education & Community Platform

**Al Moutahabbina Fillahi** (الطريقة التيجانية) — A Progressive Web App for Islamic education, prayer times, Quran viewing, and community connection.

## 🌟 Features

- ✅ **Prayer Times** — Live prayer schedule with notifications
- ✅ **Quran Viewer** — Full Qur'anic text with translations
- ✅ **Xassidas** — Tidjiane spiritual poems & teachings
- ✅ **Islamic Calendar** — Hijri calendar & Islamic dates
- ✅ **Offline Support** — Full PWA with service worker caching
- ✅ **Mobile-First** — Responsive design for all devices
- ✅ **Multi-Language** — Arabic, French, English support

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ (v20 recommended)
- npm or bun

### Setup

```bash
# Clone repository
git clone https://github.com/DET-APP/malikina.git
cd malikina

# Install dependencies
npm install
cd api && npm install && cd ..

# Start development
npm run dev              # Frontend on http://localhost:8080
cd api && npm run dev    # API on http://localhost:5000 (separate terminal)
```

### Build & Deploy

```bash
# Frontend
npm run build            # Creates dist/
npm run preview          # Preview production build

# API
cd api && npm run build  # Creates dist/
```

## 📁 Project Structure

```
malikina/
├── src/                 ← React frontend (Vite)
├── api/                 ← Express API server
├── public/              ← Static assets & PWA config
└── scripts/             ← Build & deployment scripts
```

### Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Node.js, Express, SQLite
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **PWA**: Service Worker, offline support, install prompt

## 📚 Available Scripts

```bash
# Frontend
npm run dev              # Start dev server (port 8080)
npm run build            # Production build
npm run lint             # Run ESLint
npm run preview          # Preview production build

# API
cd api && npm run dev    # Start API server (port 5000)
cd api && npm run build  # Build API
```

## 🔧 Configuration

- **Frontend**: See `vite.config.ts`, `tailwind.config.ts`
- **API**: See `api/server.ts`, `api/db/schema.ts`
- **Environment**: `.env.local` (frontend), `api/.env` (backend)

## 📖 Documentation

- **[CLAUDE.md](CLAUDE.md)** — Development guidelines & conventions
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** — Quick reference guide
- **[PWA-README.md](PWA-README.md)** — PWA features & setup

## 🌐 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist/ to Vercel
```

### API (Render)
```bash
cd api && npm run build
# Deploy to Render Web Service
```

See `render.yaml` and `vercel.json` for deployment config.

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

## 📝 License

Private project — All rights reserved.

---

**Ready to contribute?** Check [CLAUDE.md](CLAUDE.md) for development guidelines!
