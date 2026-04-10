# 📋 Quick Reference - Malikina Islamic Education PWA

## Project Structure

```
malikina/
├── api/                             ← Express API server (port 5000)
│   ├── routes/                      ← REST API endpoints
│   ├── db/                          ← SQLite database & schema
│   ├── public/audios/               ← Audio files for Xassidas
│   └── server.ts
│
├── src/                             ← Frontend (Vite + React)
│   ├── components/
│   │   ├── screens/                 ← Full-page views (Home, Prayer, Quran, etc.)
│   │   ├── shared/                  ← Reusable components
│   │   └── ui/                      ← shadcn-ui components
│   ├── hooks/                       ← Custom hooks (usePrayerTimes, etc.)
│   ├── services/                    ← API integrations
│   └── data/
│       ├── abada.json               ← Xassida verses
│       ├── enrichedQassidasData.ts  ← Local Xassida data
│       └── frenchSurahNames.ts      ← Quran surah names
│
├── public/                          ← Static assets
│   ├── manifest.json                ← PWA manifest
│   ├── service-worker.js            ← PWA offline support
│   └── icons/                       ← PWA app icons
│
└── scripts/                         ← Build & deploy scripts
```

---

## ⚡ Quick Start Commands

### Frontend
```bash
npm run dev              # Start dev server (http://localhost:8080)
npm run build            # Production build
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### API
```bash
cd api && npm run dev    # Start API server (http://localhost:5000)
cd api && npm run build  # Compile TypeScript
cd api && npm run db:migrate  # Run database migrations
```

### Full Stack
```bash
# Terminal 1: API
cd api && npm run dev

# Terminal 2: Frontend
npm run dev
```

---

## � Core Features

| Feature | Status | Location |
|---------|--------|----------|
| Prayer Times | ✅ Live | `hooks/usePrayerTimes.ts` |
| Quran Viewer | ✅ Live | `components/screens/QuranScreen.tsx` |
| Xassidas | ✅ Live | `components/screens/QassidaScreen.tsx` |
| Islamic Calendar | ✅ Live | `components/screens/CalendarScreen.tsx` |
| PWA (Offline) | ✅ Live | `public/service-worker.js` |
| Push Notifications | ✅ Live | `hooks/useNotifications.ts` |

---

## ✅ Development Checklist

- [ ] Install dependencies: `npm install && cd api && npm install`
- [ ] Start API: `cd api && npm run dev`
- [ ] Start frontend: `npm run dev`
- [ ] Check browser: http://localhost:8080
- [ ] Run linter: `npm run lint`
- [ ] Build: `npm run build`
- [ ] Test PWA offline mode
- [ ] Verify all screens load

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8080 already in use | Change in `vite.config.ts`: `server.port` |
| API not connecting | Ensure `VITE_API_URL=http://localhost:5000/api` in `.env.local` |
| PWA not showing install prompt | Check DevTools → Application → Manifest |
| Icons not displaying | Verify icon files in `public/icons/` |
| Arabic text rendering issues | Check UTF-8 encoding, use `font-arabic` class |
| Build failures | Run `npm run lint` to check errors first |

---

## � Key Technologies

- **React 18** + React Router v6 for navigation
- **TypeScript** with loose type checking (intentional)
- **Tailwind CSS** + shadcn-ui for beautiful UI
- **Framer Motion** for smooth animations
- **TanStack Query (React Query)** for data fetching
- **React Hook Form** + Zod for form validation
- **Recharts** for data visualization
- **Service Worker** for offline support (PWA)

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Main layout & screen routing |
| `src/components/screens/` | Full-page views (8 screens) |
| `src/hooks/usePrayerTimes.ts` | Prayer times fetching |
| `src/services/quranApi.ts` | Quran API integration |
| `api/server.ts` | Express API server |
| `public/service-worker.js` | PWA caching strategy |

---

## 🚀 Getting Started

1. **Setup**
   ```bash
   npm install
   cd api && npm install
   ```

2. **Run Development**
   ```bash
   # Terminal 1: API
   cd api && npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

3. **Access**
   - Frontend: http://localhost:8080
   - API: http://localhost:5000/api
   - Swagger Docs: http://localhost:5000/api-docs

4. **Build & Deploy**
   ```bash
   npm run build         # Frontend
   cd api && npm run build  # API
   ```

---

## 📖 More Information

- **Development** → CLAUDE.md
- **PWA Features** → PWA-README.md
- **Project Info** → README.md

---

**Ready to develop!** 🎯
