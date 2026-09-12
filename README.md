# AMBIS — Frontend

Dashboard & pengalaman web untuk **miniatur observatorium otomatis off-grid** (Semarang): landing page berlayer dengan data live + panorama langit 360° ala Stellarium (Three.js).

Stack: **Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript · Axios** — bicara hanya ke backend NestJS; semua kalkulasi astronomi di astronomy-service (FastAPI/Skyfield).

## Menjalankan

```bash
npm install
cp .env.example .env   # isi NEXT_PUBLIC_API_BASE_URL (NestJS)
npm run dev            # http://localhost:3000
```

## Dokumentasi

Seluruh keputusan teknis & desain ada di [`docs/`](./docs). Untuk AI coding agent, baca [panduan operasional](./docs/10-ai-agent-guide.md) setelah overview agar target tidak tertukar dengan implementasi yang sudah ada. Mulai dari [peta dokumen](./docs/00-overview.md#4-peta-dokumen):

| Dokumen | Scope |
|---|---|
| [00 — Overview](./docs/00-overview.md) | ringkasan, glosarium, prinsip |
| [01 — Architecture](./docs/01-architecture.md) | struktur folder, data flow, state |
| [02 — Design System](./docs/02-design-system.md) | "Cosmic Editorial": token & komponen |
| [03 — Fase 1: Landing](./docs/03-fase1-landing-page.md) | spec halaman utama berlayer |
| [04 — Fase 2: Sky View](./docs/04-fase2-sky-view.md) | panorama Three.js + HUD |
| [05 — API Integration](./docs/05-api-integration.md) | endpoint & kontrak data |
| [06 — Security](./docs/06-security.md) | auth, servo safety, CSP |
| [07 — Performance](./docs/07-performance.md) | budget & optimasi |
| [08 — Testing](./docs/08-testing.md) | strategi uji |
| [09 — Roadmap](./docs/09-roadmap.md) | fase 0–4 & out-of-scope |
| [10 — AI Agent Guide](./docs/10-ai-agent-guide.md) | fakta repo, status, workflow, validasi |
| [11 — Motion & 3D](./docs/11-motion-and-3d.md) | bahasa gerak, arah artistik 3D, anti-slop |

## Referensi desain (root repo)

- `stitch_modern_minimalist_design_system/` — mock HUD sky view (Stitch), dipakai selektif.
- `referensi_threejs/` — scene Three.js murni, di-port ke Fase 2.

> Prinsip utama: **data live, tidak ada angka palsu** — semua angka di layar adalah posisi benda langit yang sedang nyata.
