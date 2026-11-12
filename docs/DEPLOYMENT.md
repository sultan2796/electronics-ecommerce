# Deploy və CI/CD Təlimatı

## 1. Bulud verilənlər bazası

### Neon
1. https://neon.tech-də layihə yaradın.
2. **Pooled** bağlantı sətrini `DATABASE_URL`, **direct** bağlantını `DIRECT_URL` kimi götürün. Hər ikisinin sonunda `?sslmode=require` olmalıdır.

### Supabase
1. Project Settings → Database → Connection string.
2. `DATABASE_URL` = Transaction pooler (port 6543) + `?pgbouncer=true&connection_limit=1`
3. `DIRECT_URL` = Session/direct bağlantı (port 5432).

`DIRECT_URL` migrasiyalar üçün, `DATABASE_URL` tətbiq üçün istifadə olunur.

## 2. Backend — Render

1. Kodu GitHub-a yükləyin.
2. Render → **New → Blueprint** → repozitoriyanı seçin. `render.yaml` avtomatik oxunur.
3. Soruşulan dəyişənləri doldurun:
   - `DATABASE_URL`, `DIRECT_URL` — Neon/Supabase
   - `CLIENT_URL` — Vercel ünvanı, məs. `https://electroshop.vercel.app` (bir neçə ünvan vergüllə)
   - `JWT_ACCESS_SECRET` avtomatik yaradılır.
4. Konteyner hər başlayanda `prisma migrate deploy` işlədir.
5. Settings → **Deploy Hook** URL-ni kopyalayın → GitHub secret `RENDER_DEPLOY_HOOK_URL`.

`autoDeploy: false` qoyulub ki, deploy yalnız CI testləri keçdikdən sonra olsun.

## 2-alternativ. Backend — Railway

1. Railway → New Project → Deploy from GitHub → **Root Directory: `server`**. `server/railway.json` Dockerfile-ı istifadə edir.
2. Variables: `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET` (ən az 32 simvol), `CLIENT_URL`.
3. Project Settings → Tokens → project token → GitHub secret `RAILWAY_TOKEN`.
4. GitHub repository **variables**: `BACKEND_PROVIDER=railway`, `RAILWAY_SERVICE=<servis adı>`.

## 3. Frontend — Vercel

1. Vercel → Add New Project → repozitoriya → **Root Directory: `client`**. Framework: Vite (`client/vercel.json` SPA yönləndirməsini təmin edir).
2. Environment Variable: `VITE_API_URL=https://<backend-ünvanı>/api`
3. CLI ilə layihəni bağlayın və ID-ləri götürün:
   ```bash
   npm i -g vercel
   cd ~/Desktop/electronics-ecommerce
   vercel link
   cat .vercel/project.json
   ```
4. GitHub secrets: `VERCEL_TOKEN` (Account Settings → Tokens), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
5. Vercel-in öz Git avtomatik deploy-unu söndürmək istəyirsinizsə: Project Settings → Git → “Ignored Build Step” → `exit 0`.

## 4. GitHub Actions (`.github/workflows/deploy.yml`)

| Job | Nə vaxt | Nə edir |
| --- | --- | --- |
| server | hər push / PR | PostgreSQL servisi ilə `npm ci`, `prisma validate`, `migrate deploy`, typecheck, build |
| client | hər push / PR | `npm ci`, typecheck + Vite build |
| docker | server və client uğurlu olduqda | hər iki Docker image-in build olunduğunu yoxlayır |
| deploy-backend-render | `main`-ə push | Render deploy hook |
| deploy-backend-railway | `main`-ə push və `BACKEND_PROVIDER=railway` | `railway up` |
| deploy-frontend | `main`-ə push | `vercel pull → build → deploy --prebuilt --prod` |

### Lazım olan secrets və variables

| Ad | Növ | Harada istifadə olunur |
| --- | --- | --- |
| `RENDER_DEPLOY_HOOK_URL` | secret | Render |
| `RAILWAY_TOKEN` | secret | Railway |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | secret | Vercel |
| `BACKEND_PROVIDER` | variable | `render` (default) və ya `railway` |
| `RAILWAY_SERVICE` | variable | Railway servis adı |
| `VITE_API_URL` | variable | CI-da client build-i üçün |

Deploy job-ları `production` environment-indən istifadə edir — GitHub → Settings → Environments bölməsində təsdiq tələbi qoya bilərsiniz.

## 5. İlk deploy üçün yoxlama siyahısı

- [ ] `package-lock.json` faylları və `server/prisma/migrations` Git-dədir
- [ ] Backend `/health` cavab verir
- [ ] `CLIENT_URL` Vercel domeni ilə tam eynidir (sonunda `/` olmadan)
- [ ] `VITE_API_URL` sonunda `/api` var
- [ ] Seed-dəki admin şifrəsi dəyişdirilib (və ya istehsalda seed işlədilmir)
- [ ] `JWT_ACCESS_SECRET` uzun və təsadüfidir
