# ElectroShop — Elektronika E-ticarət Platforması

Elektronika (noutbuk, smartfon, planşet, monitor) satışı üçün full-stack, buluda hazır veb tətbiq.

| Qat | Texnologiya |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js 20, Express, TypeScript, Zod |
| Verilənlər bazası | PostgreSQL 16, Prisma ORM |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Bulud | Vercel (frontend), Render və ya Railway (backend), Neon və ya Supabase (DB) |

Ətraflı arxitektura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
Yerləşdirmə (deploy) təlimatı: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Qovluq strukturu

```
electronics-ecommerce/
├── .github/workflows/deploy.yml   CI/CD
├── docker-compose.yml             Lokal mühit (db + server + client)
├── render.yaml                    Render Blueprint
├── docs/                          Arxitektura və deploy sənədləri
├── server/
│   ├── prisma/schema.prisma       Verilənlər modeli
│   ├── prisma/seed.ts             Test məlumatları
│   ├── src/config                 env, prisma client
│   ├── src/controllers            HTTP məntiqi
│   ├── src/middleware             auth, RBAC, validasiya, xətalar
│   ├── src/models                 Zod sxemləri (DTO)
│   ├── src/routes                 API marşrutları
│   ├── src/services               Filtr qurucusu, səbət məntiqi
│   ├── src/utils                  JWT, AppError, asyncHandler
│   ├── Dockerfile
│   └── railway.json
└── client/
    ├── src/components             layout, product, common
    ├── src/context                Auth, Cart, Wishlist, Compare
    ├── src/hooks                  useAsync, useDebounce
    ├── src/pages                  Səhifələr + admin/
    ├── src/services               Axios API qatı
    ├── src/types                  TypeScript tipləri
    ├── src/utils                  Format və filtr köməkçiləri
    ├── Dockerfile, nginx.conf
    └── vercel.json
```

## Lokal işə salma (Docker olmadan)

Tələblər: Node.js 20+, PostgreSQL 16 (və ya yalnız `docker compose up db`).

```bash
cd ~/Desktop/electronics-ecommerce

docker compose up -d db

cd server
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Yeni terminalda:

```bash
cd ~/Desktop/electronics-ecommerce/client
cp .env.example .env
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api
- Sağlamlıq yoxlaması: http://localhost:4000/health
- Admin hesabı (seed): `admin@example.com` / `Admin12345!` — istehsalda mütləq dəyişin.

## Bütün sistemi Docker ilə işə salma

İlk dəfə migrasiya faylını yaratmaq lazımdır (yuxarıdakı `npx prisma migrate dev --name init` addımı). Sonra:

```bash
cd ~/Desktop/electronics-ecommerce
docker compose up --build
```

Server konteyneri başlayanda `prisma migrate deploy` avtomatik işləyir. Test məlumatları üçün (host maşından):

```bash
cd server && npm run db:seed
```

## Faydalı əmrlər

| Əmr | Harada | Nə edir |
| --- | --- | --- |
| `npm run dev` | server / client | İnkişaf rejimi |
| `npm run build` | server / client | İstehsal build-i |
| `npm run typecheck` | server / client | TypeScript yoxlaması |
| `npm run prisma:migrate` | server | Yeni migrasiya |
| `npm run prisma:studio` | server | DB-ni brauzerdə görmək |
| `npm run db:seed` | server | Test məlumatları |

## Vacib qeyd

`npm install`-dan sonra yaranan `package-lock.json` fayllarını və `server/prisma/migrations` qovluğunu Git-ə əlavə edin — CI/CD (`npm ci`, `prisma migrate deploy`) onlara ehtiyac duyur.
