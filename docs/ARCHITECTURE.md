# Arxitektura Planı

## 1. Ümumi baxış

```
Brauzer (React SPA, Vercel)
   │  HTTPS, JSON, Authorization: Bearer <access token>
   │  httpOnly cookie: refreshToken (yalnız /api/auth)
   ▼
Express API (Docker, Render/Railway)
   routes → middleware (auth, RBAC, Zod) → controllers → services → Prisma
   ▼
PostgreSQL (Neon/Supabase; lokal: Docker)
```

Prinsiplər:

- `client` və `server` tam ayrıdır, ayrı-ayrı build və deploy olunur.
- Hər qatın bir vəzifəsi var: marşrut → validasiya → controller → servis → verilənlər.
- Bütün giriş məlumatları Zod ilə yoxlanılır; Prisma SQL injection-dan qoruyur.
- Mühit dəyişənləri server başlayanda Zod ilə yoxlanılır; səhv varsa proses dayanır.

## 2. Verilənlər modeli (Prisma)

| Model | Təyinat | Əsas sahələr |
| --- | --- | --- |
| User | Müştəri və admin | email (unikal), passwordHash, role (CUSTOMER / ADMIN) |
| RefreshToken | Sessiyalar | tokenHash (SHA-256), expiresAt, revokedAt |
| Category | İerarxik kateqoriyalar | slug, parentId |
| Product | Məhsul | slug, sku, brand, price (Decimal), stock, images[], isActive |
| TechSpecification | Texniki göstəricilər (1:1) | cpu, gpu, ramGb, storageGb, storageType, screenSizeInch, resolution, refreshRateHz, batteryMah, os, weightGrams, connectivity[], extra (JSON) |
| Cart / CartItem | Səbət | (cartId, productId) unikal |
| WishlistItem | İstək siyahısı | (userId, productId) unikal |
| Order / OrderItem | Sifariş | orderNumber (unikal, ES-YYMMDD-XXXXXX), status, paymentStatus, total, shippingAddress (JSON); productName və unitPrice sifariş anında saxlanılır |
| OrderStatusHistory | Status tarixçəsi | hər status dəyişikliyi (yaradılma, ödəniş, admin dəyişikliyi, ləğv) tarixi ilə yazılır |

Dizayn qərarları:

- Texniki göstəricilər ayrı cədvəldədir və tez-tez filtrlənən sütunlar (`ramGb`, `storageGb`, `cpu`, `os`) indekslənib. Kateqoriyaya xas nadir sahələr `extra` JSON sahəsindədir.
- Pul dəyərləri `Decimal`-dır (float yuvarlaqlaşdırma xətası olmasın).
- Məhsul silinmir, `isActive = false` edilir — köhnə sifarişlər pozulmur.

## 3. Texniki göstəricilərə görə qabaqcıl filtrlər

`GET /api/products` aşağıdakı parametrləri qəbul edir (vergüllə ayrılmış siyahılar dəstəklənir):

| Parametr | Nümunə | Məntiq |
| --- | --- | --- |
| `q` | `macbook` | ad, brend, təsvirdə axtarış |
| `category` | `laptops` | kateqoriya slug-ı |
| `brand` | `Apple,Dell` | siyahıdan biri |
| `minPrice`, `maxPrice` | `1000`, `2500` | aralıq |
| `ram` | `16,32` | GB, siyahıdan biri |
| `storage` | `512,1024` | GB |
| `storageType` | `SSD,NVME` | enum |
| `cpu`, `gpu` | `M3,i7` | qismən uyğunluq |
| `os` | `Windows 11,macOS` | |
| `minScreen`, `maxScreen` | `13`, `15.6` | düym |
| `minRefreshRate`, `minBattery` | `120`, `5000` | minimum |
| `inStock` | `true` | stok > 0 |
| `sort` | `price_asc` | `newest`, `price_asc`, `price_desc`, `name_asc` |
| `page`, `limit` | `1`, `12` | səhifələmə |

`services/product.service.ts` bu parametrlərdən tip-təhlükəsiz `Prisma.ProductWhereInput` qurur. Eyni qrup daxilində seçimlər “VƏ YA”, qruplar arasında “VƏ” ilə birləşir.

`GET /api/products/facets?category=laptops` seçilmiş kateqoriyada mövcud olan brendləri, RAM/yaddaş dəyərlərini, OS-ləri, qiymət və ekran aralığını qaytarır — UI yalnız real mövcud seçimləri göstərir. Filtr vəziyyəti URL-də saxlanılır, link paylaşıla bilir.

## 4. Yan-yana müqayisə

- `CompareContext` seçilmiş məhsulları `localStorage`-da saxlayır (maks. 4, yalnız eyni kateqoriya).
- Aşağıda sabit “müqayisə paneli” görünür.
- `GET /api/products/compare?ids=a,b,c` məhsulları göstəriciləri ilə birlikdə qaytarır.
- Cədvəldə hər göstərici üzrə ən yaxşı dəyər yaşıl rənglə vurğulanır (RAM, yaddaş, batareya, tezlik — çox olan; qiymət, çəki — az olan).
- “Yalnız fərqləri göstər” seçimi eyni olan sətirləri gizlədir.

## 5. Autentifikasiya və RBAC

```
Login/Register ─► access token (JWT, 15 dəq, yaddaşda)
               └► refresh token (təsadüfi 48 bayt, httpOnly cookie, 7 gün; DB-də yalnız SHA-256 hash)

401 cavabı ─► axios interceptor ─► POST /api/auth/refresh
           ─► köhnə token ləğv edilir, yenisi verilir (rotasiya)
           ─► ləğv edilmiş token təkrar istifadə olunarsa, istifadəçinin bütün sessiyaları bağlanır
```

- Şifrələr bcrypt (12 raund) ilə hash-lənir.
- `authenticate` middleware JWT-ni yoxlayır, `authorize("ADMIN")` rolu yoxlayır.
- Access token `localStorage`-da saxlanılmır (XSS riski azalır); səhifə yenilənəndə cookie ilə bərpa olunur.
- Auth marşrutlarında rate limit var (15 dəqiqədə 50 sorğu).
- İstehsalda cookie `Secure` və `SameSite=None`-dur (Vercel ↔ Render fərqli domenlər).
- Əlavə qoruma: Helmet başlıqları, CORS yalnız `CLIENT_URL`-ə, JSON limiti 1 MB.

## 6. Səbət, istək siyahısı və sifariş axını

1. `POST /api/cart/items` — stok yoxlanılır, eyni məhsul varsa say artırılır.
2. `PATCH /api/cart/items/:productId` — say dəyişir; `0` göndərilsə silinir.
3. `POST /api/orders/checkout` — bir tranzaksiyada:
   - səbət oxunur, boşdursa xəta;
   - hər məhsul üçün şərti `UPDATE ... WHERE stock >= qty` ilə stok azaldılır (eyni anda iki alıcı olsa belə mənfi stok olmur);
   - qiymət və ad sifarişə “snapshot” kimi yazılır;
   - səbət təmizlənir.
4. Sifariş `PENDING` statusunda yaranır. Müştəri `PENDING` sifarişi ləğv edə bilər — stok geri qaytarılır.
5. İstək siyahısı: `POST/DELETE /api/wishlist/:productId`.

Ödəniş üçün növbəti addım: Stripe Checkout/PaymentIntent + webhook → `paymentStatus = SUCCEEDED`, `status = PAID`.

## 7. Admin panel (skelet)

| Səhifə | API | Funksiya |
| --- | --- | --- |
| İcmal | `GET /api/admin/stats` | gəlir, aktiv məhsul, az stok, istifadəçi sayı, statuslara görə sifarişlər, son sifarişlər |
| Anbar | `GET /api/admin/inventory`, `PATCH /api/admin/products/:id/stock`, `DELETE /api/products/:id` | axtarış, az stok filtri, stok redaktəsi, satışdan çıxarma |
| Sifarişlər | `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` | status filtri, status keçidləri |

Status keçidləri serverdə məhdudlaşdırılıb:
`PENDING → PAID | CANCELLED`, `PAID → PROCESSING | CANCELLED`, `PROCESSING → SHIPPED | CANCELLED`, `SHIPPED → DELIVERED`. Ləğv zamanı stok qaytarılır.

Məhsul yaratma/redaktə API-si hazırdır (`POST/PATCH /api/products`); UI formu növbəti mərhələdir.

## 8. API xülasəsi

| Metod | Marşrut | Giriş |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | açıq |
| POST | `/api/auth/refresh`, `/api/auth/logout` | cookie |
| GET | `/api/auth/me` | istifadəçi |
| GET | `/api/products`, `/api/products/facets`, `/api/products/compare`, `/api/products/:idOrSlug` | açıq |
| POST/PATCH/DELETE | `/api/products[/:id]` | admin |
| GET / POST | `/api/categories` | açıq / admin |
| GET/POST/PATCH/DELETE | `/api/cart[/items/:productId]` | istifadəçi |
| GET/POST/DELETE | `/api/wishlist[/:productId]` | istifadəçi |
| POST | `/api/orders/checkout`, `/api/orders/:id/cancel` | istifadəçi |
| GET | `/api/orders`, `/api/orders/:id` | istifadəçi |
| GET/PATCH | `/api/admin/*` | admin |

Xəta formatı: `{ "message": "...", "details": ... }`.

## 9. Növbəti mərhələ

- Stripe ödənişi və webhook
- Admin üçün məhsul formu və şəkil yükləmə (Cloudinary / S3)
- Rəylər və reytinqlər
- Vitest + Supertest testləri, Playwright E2E
- Redis keşi (facets), tam mətn axtarışı (PostgreSQL `tsvector`)
- E-poçt bildirişləri (sifariş təsdiqi)

## Sifariş izləmə və endirimlər

- `GET /api/admin/orders?q=&userId=&status=` — sifariş nömrəsi, müştəri adı və ya e-poçtu ilə axtarış.
- `GET /api/admin/users/:id` — müştəri detalları: ünvanlar, son sifarişlər, ödənilmiş sifarişlərin cəmi.
- `Product.salePrice` — məhsulun endirimli qiyməti; kampaniya ilə müqayisədə ən aşağı qiymət səbətdə və sifarişdə tətbiq olunur.
