# Intact Ghana E-Commerce — Full Audit Report

**Generated:** 2026-03-29T09:49:00Z  
**Project Root:** `d:\xampp\htdocs\intactpro\intactpro-app`  
**Auditor:** Cascade AI  

---

## 1. Executive Summary

Intact Ghana is a full-stack e-commerce web application built for Ghana's electronics retail market. It serves as both a customer-facing storefront and a content management system (CMS) for administrators. The application is built on **Next.js 16.2.1** with **React 19**, **Prisma ORM** backed by **Neon PostgreSQL**, and styled with **TailwindCSS v4**.

The project is at **BETA** maturity. The storefront is fully functional with real database-backed data flowing through every page, a working cart/checkout flow, JWT authentication, and payment gateway integrations (Hubtel, CanPay). The admin CMS has complete read/list views for all entities but lacks write operations (create/edit/delete) wired from the UI to the API. There are **zero TypeScript errors**, **37 API routes**, **22 storefront pages**, and **15 admin pages** — all returning HTTP 200. Key gaps include: no test coverage, admin CRUD form submissions not wired, auth middleware not applied to admin routes, and payment callbacks incomplete.

**Overall Completion: 68%**

---

## 2. Project Fingerprint

| Attribute | Value |
|-----------|-------|
| **Project Type** | Full-stack e-commerce web app (storefront + admin CMS) |
| **Framework** | Next.js 16.2.1 (App Router, Turbopack) |
| **Language** | TypeScript 5.x |
| **UI Library** | React 19.2.4 |
| **Styling** | TailwindCSS v4, Framer Motion 12.x, GSAP 3.x |
| **Component Library** | Radix UI (12 primitives), Lucide React icons |
| **Database** | PostgreSQL (Neon cloud) via Prisma 6.8.2 |
| **Auth** | Custom JWT (jose + bcryptjs), cookie-based sessions |
| **State Management** | Zustand 5.x (cart + wishlist stores, localStorage persisted) |
| **Payments** | Hubtel, CanPay BNPL (API routes exist) |
| **Runtime** | Node.js (XAMPP/Windows dev environment) |
| **Package Manager** | npm (package-lock.json) |
| **Linter** | ESLint 9 with next/core-web-vitals + next/typescript |
| **Formatter** | None configured |
| **Tests** | None (0 test files) |
| **CI/CD** | None configured |
| **Deployment Config** | None (no Dockerfile, Vercel config, or Netlify config) |
| **Env Variables** | DATABASE_URL, JWT_SECRET, HUBTEL_AUTH_BASIC, HUBTEL_MERCHANT_ACCOUNT, CANPAY_BASE_URL, CANPAY_MERCHANT_KEY, CANPAY_API_KEY, CANPAY_ENVIRONMENT, NEXT_PUBLIC_BASE_URL |

### Dependencies (31 total)

**Production (19):** next, react, react-dom, @prisma/client, zustand, framer-motion, gsap, @gsap/react, jose, bcryptjs, lucide-react, class-variance-authority, clsx, tailwind-merge, embla-carousel-react, swiper, react-hot-toast, next-auth (unused), dotenv

**Dev (9):** prisma, typescript, tsx, eslint, eslint-config-next, @tailwindcss/postcss, tailwindcss, @types/node, @types/react, @types/react-dom, @types/bcryptjs, babel-plugin-react-compiler

---

## 3. Architecture Map

### Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (store)/            # Storefront route group (22 pages)
│   │   ├── layout.tsx      # Client layout: Header + Footer + ChatBot
│   │   ├── page.tsx        # Redirect to root
│   │   ├── shop/           # Shop listing + category pages
│   │   ├── product/[slug]/ # Product detail
│   │   ├── cart/           # Cart page
│   │   ├── checkout/       # Checkout + success
│   │   ├── account/        # Auth + order history
│   │   ├── search/         # Search results
│   │   ├── brands/         # Brand listing
│   │   ├── promotions/     # Sale products
│   │   ├── wishlist/       # Wishlist
│   │   ├── news/           # News listing + detail
│   │   ├── pages/[slug]/   # Dynamic CMS pages
│   │   ├── about/          # Static about page
│   │   ├── contact/        # Contact form
│   │   ├── faq/            # FAQ accordion
│   │   ├── careers/        # Careers page
│   │   ├── ai-solutions/   # AI products page
│   │   └── store-locations/# Store locations
│   ├── admin/              # Admin CMS (15 pages)
│   │   ├── layout.tsx      # Admin sidebar + topbar
│   │   ├── page.tsx        # Dashboard
│   │   ├── products/       # Products list + new
│   │   ├── orders/         # Orders list
│   │   ├── customers/      # Customers list
│   │   ├── categories/     # Categories CRUD
│   │   ├── brands/         # Brands CRUD
│   │   ├── hero-slides/    # Hero slides CRUD
│   │   ├── banners/        # Banners CRUD
│   │   ├── pages/          # CMS pages CRUD
│   │   ├── news/           # News CRUD
│   │   ├── promotions/     # Promotions CRUD
│   │   ├── ai-tools/       # AI tools page
│   │   └── settings/       # Site settings
│   ├── api/                # 37 API route files
│   │   ├── products/       # GET (list + detail)
│   │   ├── categories/     # GET
│   │   ├── search/         # GET
│   │   ├── orders/         # GET + POST
│   │   ├── news/           # GET (list + detail)
│   │   ├── newsletter/     # POST
│   │   ├── contact/        # POST
│   │   ├── delivery/       # POST estimate
│   │   ├── auth/           # login, register, me
│   │   ├── payments/       # hubtel, canpay + callbacks
│   │   ├── seed/           # POST seed route
│   │   └── admin/          # Full CRUD for 9 entities
│   ├── layout.tsx          # Root layout (metadata, fonts)
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Theme variables + animations
│   ├── loading.tsx         # Global loading state
│   └── not-found.tsx       # 404 page
├── components/             # 12 shared components
│   ├── home/               # HeroSlider, CategoryGrid, FeaturedProducts, PromoBanner, BrandShowcase
│   ├── layout/             # Header, Footer
│   ├── products/           # ProductCard
│   ├── chat/               # ChatBot
│   └── ui/                 # badge, button, input (shadcn-style)
├── lib/                    # Utilities
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # verifyAdmin middleware helper
│   ├── utils.ts            # cn, formatPrice, slugify, generateOrderNumber, truncate, getDiscountPercentage
│   └── mock-data.ts        # Legacy mock data (only used by seed route)
├── store/                  # Zustand stores
│   ├── cart-store.ts       # Cart with add/remove/update/clear
│   └── wishlist-store.ts   # Wishlist toggle/add/remove
└── generated/              # Prisma generated types (auto)
```

### Data Flow

```
User → React Client Component → fetch(/api/...) → Next.js API Route → Prisma → PostgreSQL (Neon)
                                                                        ↓
User ← React State (useState) ← JSON Response ← NextResponse.json() ←─┘
```

### Database Models (18 tables)

| Model | Relations | Purpose |
|-------|-----------|---------|
| User | → Orders, Reviews, Addresses, Wishlist, Cart | Customer/Admin accounts |
| Product | → Category, Brand, Images, Reviews, OrderItems | Core product entity |
| Category | → Products, self-referencing parent/children | Product categorization |
| Brand | → Products | Product branding |
| ProductImage | → Product | Multiple images per product |
| Order | → User, OrderItems | Purchase records |
| OrderItem | → Order, Product | Line items |
| Review | → User, Product | Product ratings |
| CartItem | → User, Product | Server-side cart (unused) |
| WishlistItem | → User, Product | Server-side wishlist (unused) |
| Address | → User | Shipping addresses |
| HeroSlide | — | Homepage hero banner |
| Banner | — | Promotional banners |
| Page | — | CMS static pages |
| NewsPost | — | Blog/news articles |
| Promotion | — | Discount codes |
| SiteSetting | — | Key-value site config |
| Subscriber | — | Newsletter emails |
| ContactMessage | — | Contact form submissions |

### Design Patterns

- **Singleton**: Prisma client via global cache (`lib/db.ts`)
- **Repository-like**: API routes act as data access layer
- **Store Pattern**: Zustand for client-side cart/wishlist
- **Route Groups**: `(store)` for storefront, `admin` for CMS
- **Component Composition**: Reusable ProductCard, Badge, Button, Input

---

## 4. Feature Inventory

### Storefront Features

| # | Feature | Status | % | Notes |
|---|---------|--------|---|-------|
| 1 | Homepage with hero slider | COMPLETE | 95 | Fetches from API; missing `sizes` prop on some images |
| 2 | Product sections (On Sale, New, Featured, Top Rated) | COMPLETE | 100 | 4 separate sections, 8 products each, View More links |
| 3 | Category grid | COMPLETE | 100 | API-fetched, animated with GSAP |
| 4 | Brand showcase | COMPLETE | 100 | API-fetched, animated |
| 5 | Shop page with filters | COMPLETE | 90 | Search, category, brand, price range, sort, grid toggle |
| 6 | Category shop page | COMPLETE | 90 | Dynamic /shop/[slug] with filtered products |
| 7 | Product detail page | COMPLETE | 85 | Images, specs, reviews, related products; reviews are read-only |
| 8 | Search page | COMPLETE | 90 | Debounced search across products, categories, brands |
| 9 | Cart page | COMPLETE | 100 | Zustand-persisted, quantity controls, price summary |
| 10 | Checkout flow | COMPLETE | 85 | 4-step wizard, GPS location, delivery estimation, COD order creation |
| 11 | Account (login/register) | COMPLETE | 80 | JWT auth, order history; no password reset, no profile edit |
| 12 | Wishlist page | COMPLETE | 85 | Client-side via Zustand; not synced to server |
| 13 | Brands listing | COMPLETE | 90 | Shows all brands with product counts |
| 14 | Promotions/Sale page | COMPLETE | 90 | Fetches onSale products |
| 15 | News/Blog listing | PARTIAL | 70 | Lists posts from API; detail page uses hardcoded data |
| 16 | News detail page | PARTIAL | 40 | Uses hardcoded `newsArticles` object, not API |
| 17 | Dynamic CMS pages | PARTIAL | 60 | Fetches from API but has fallback hardcoded pages |
| 18 | Contact form | COMPLETE | 90 | Submits to API, saves to DB |
| 19 | Newsletter subscription | COMPLETE | 90 | Submits to API, saves to DB |
| 20 | FAQ page | COMPLETE | 95 | Accordion UI, static content |
| 21 | About page | COMPLETE | 95 | Static content |
| 22 | Careers page | COMPLETE | 95 | Static content |
| 23 | Store locations | COMPLETE | 95 | Static content with map placeholder |
| 24 | AI Solutions page | COMPLETE | 85 | Fetches products from API |
| 25 | ChatBot | STUB | 15 | UI shell exists, no actual AI/chat backend |
| 26 | Promo banner | COMPLETE | 90 | Static promotional section |
| 27 | Header with mega menu | COMPLETE | 95 | API-fetched categories, cart count, search |
| 28 | Footer | COMPLETE | 95 | Links, newsletter form, contact info |
| 29 | 404 page | COMPLETE | 100 | Custom not-found page |
| 30 | Loading state | COMPLETE | 100 | Global loading spinner |

### Admin CMS Features

| # | Feature | Status | % | Notes |
|---|---------|--------|---|-------|
| 31 | Dashboard | PARTIAL | 50 | Static stats/charts, not connected to real data |
| 32 | Products list | PARTIAL | 60 | Fetches from API; no delete/edit actions wired |
| 33 | Create product | PARTIAL | 50 | Form UI exists, category/brand dropdowns from API; submit not wired to POST |
| 34 | Edit product | MISSING | 0 | No edit product page exists |
| 35 | Orders list | PARTIAL | 50 | Fetches from API; no status update actions |
| 36 | Order detail | MISSING | 0 | No order detail/management page |
| 37 | Customers list | PARTIAL | 50 | Fetches from API; no customer detail page |
| 38 | Categories CRUD | PARTIAL | 55 | List from API; create form UI exists but submit not wired |
| 39 | Brands CRUD | PARTIAL | 55 | List from API; create form UI exists but submit not wired |
| 40 | Hero slides CRUD | PARTIAL | 55 | List from API; create form UI exists but submit not wired |
| 41 | Banners CRUD | PARTIAL | 40 | List UI exists; no API fetch on page, form not wired |
| 42 | CMS Pages CRUD | PARTIAL | 40 | List UI exists; form not wired |
| 43 | News CRUD | PARTIAL | 40 | List UI exists; form not wired |
| 44 | Promotions CRUD | PARTIAL | 40 | List UI exists; form not wired |
| 45 | Site settings | PARTIAL | 50 | UI exists; reads from API but save not wired |
| 46 | AI Tools | STUB | 20 | UI mockup, no backend |
| 47 | Admin auth guard | STUB | 15 | Helper function exists (`lib/auth.ts`) but not applied to any route |

### API Features

| # | Feature | Status | % | Notes |
|---|---------|--------|---|-------|
| 48 | Products API (list + detail) | COMPLETE | 100 | Full filtering, sorting, pagination, relations |
| 49 | Categories API | COMPLETE | 100 | With product counts and children |
| 50 | Search API | COMPLETE | 100 | Cross-entity search |
| 51 | Orders API (create + list) | COMPLETE | 90 | Creates orders; no status update endpoint |
| 52 | News API | COMPLETE | 100 | List + detail by slug |
| 53 | Newsletter API | COMPLETE | 100 | Saves subscriber |
| 54 | Contact API | COMPLETE | 100 | Saves message |
| 55 | Delivery estimate API | COMPLETE | 95 | Haversine distance calculation |
| 56 | Auth API (login/register/me) | COMPLETE | 90 | JWT, bcrypt, cookie sessions |
| 57 | Admin Products CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 58 | Admin Categories CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 59 | Admin Brands CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 60 | Admin Hero Slides CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 61 | Admin Banners CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 62 | Admin Pages CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 63 | Admin News CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 64 | Admin Promotions CRUD API | COMPLETE | 95 | GET, POST, PUT, DELETE |
| 65 | Admin Settings API | COMPLETE | 95 | GET + PUT (bulk upsert) |
| 66 | Admin Customers API | COMPLETE | 90 | GET with order counts |
| 67 | Admin Orders API | PARTIAL | 60 | GET list; PUT for status update exists but minimal |
| 68 | Hubtel payment init | COMPLETE | 80 | POST creates checkout; callback has TODO for DB update |
| 69 | Hubtel callback | PARTIAL | 40 | Logs payment; does NOT update order in DB |
| 70 | CanPay payment init | COMPLETE | 80 | POST creates payment; callback has TODO |
| 71 | CanPay callback | PARTIAL | 40 | Logs payment; does NOT update order in DB |
| 72 | Seed API | COMPLETE | 100 | Seeds all 18 tables |

### Cross-Cutting Concerns

| # | Feature | Status | % | Notes |
|---|---------|--------|---|-------|
| 73 | SEO metadata | COMPLETE | 85 | Root layout with OG tags, title template, favicon |
| 74 | Image optimization | PARTIAL | 60 | next/image used but missing `sizes` prop in many places |
| 75 | Error handling (API) | PARTIAL | 70 | try/catch in most routes; generic error messages |
| 76 | Error handling (UI) | PARTIAL | 40 | Most fetches have `.catch(() => {})` — errors silently swallowed |
| 77 | Loading states (UI) | PARTIAL | 50 | Some pages show loading; many show empty then pop in |
| 78 | Form validation | PARTIAL | 55 | Checkout has validation; admin forms mostly lack it |
| 79 | Responsive design | COMPLETE | 90 | Mobile-first with breakpoints throughout |
| 80 | Accessibility (a11y) | PARTIAL | 35 | Some aria-labels; missing focus management, skip-nav, ARIA roles |
| 81 | Internationalization | MISSING | 0 | Hardcoded English + GH₵ currency |
| 82 | Rate limiting | MISSING | 0 | No rate limiting on any endpoint |
| 83 | CORS | PARTIAL | 50 | Next.js default; no explicit CORS config |
| 84 | File upload | MISSING | 0 | All images are URLs (Unsplash); no actual upload mechanism |

---

## 5. Workflow Analysis

### Core User Workflows

| # | Workflow | Status | Gaps |
|---|----------|--------|------|
| 1 | **Browse → Shop → Add to Cart → Checkout → Order** | PARTIAL | Checkout creates order for COD; online payment callbacks don't update DB |
| 2 | **Register → Login → View Orders** | COMPLETE | Full JWT flow; order history displays correctly |
| 3 | **Search for Product → View Detail → Add to Cart** | COMPLETE | End-to-end functional |
| 4 | **Browse by Category → Filter → Sort → View Product** | COMPLETE | All filters work via API |
| 5 | **Add to Wishlist → View Wishlist → Add to Cart** | PARTIAL | Client-only (localStorage); not synced to DB WishlistItem table |
| 6 | **Submit Contact Form** | COMPLETE | Saves to DB |
| 7 | **Subscribe to Newsletter** | COMPLETE | Saves to DB |
| 8 | **Admin: View Products List** | COMPLETE | Fetched from API with search |
| 9 | **Admin: Create New Product** | BROKEN | Form UI exists but submit handler doesn't POST to API |
| 10 | **Admin: Edit/Delete Product** | MISSING | No edit page; no delete handler wired |
| 11 | **Admin: Manage Orders (status updates)** | MISSING | No order detail page; no status update UI |
| 12 | **Admin: Login/Logout** | MISSING | No admin login gate; anyone can access /admin |
| 13 | **Logout → Session Cleanup** | PARTIAL | Cookie cleared; no server-side token revocation |
| 14 | **Password Reset** | MISSING | No forgot password flow |
| 15 | **Hubtel Payment → Callback → Order Update** | BROKEN | Callback logs only; order status never updated in DB |
| 16 | **CanPay BNPL → Callback → Order Update** | BROKEN | Same as Hubtel — TODO in callback handler |

### Auth Guard Analysis

| Route | Protected? | Notes |
|-------|-----------|-------|
| `/admin/*` (pages) | **NO** | Anyone can access admin UI |
| `/api/admin/*` (APIs) | **NO** | `verifyAdmin` helper exists in `lib/auth.ts` but is never imported/called |
| `/api/orders` POST | **NO** | Creates orders without auth; uses guest userId fallback |
| `/api/auth/me` | YES | Requires valid JWT cookie |
| `/account` | PARTIAL | Shows login form if no cookie; doesn't redirect |

---

## 6. Pitfall Report

### CRITICAL

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| P1 | **Admin routes completely unprotected** | `src/app/api/admin/*` | All 19 admin API routes (products, orders, customers, settings, etc.) have no authentication check. Anyone can POST/PUT/DELETE data. |
| P2 | **Hardcoded JWT fallback secret** | `src/app/api/auth/login/route.ts:6`, `register/route.ts:6`, `me/route.ts:5`, `src/lib/auth.ts:6` | `process.env.JWT_SECRET \|\| "intact-ghana-secret-key-2026"` — if env var is unset, a hardcoded secret is used. |
| P3 | **Database credentials in .env committed to repo** | `.env:8` | Neon PostgreSQL connection string with password is in `.env` which should be gitignored. Verify `.gitignore` includes `.env`. |
| P4 | **Payment callbacks don't update orders** | `src/app/api/payments/hubtel/callback/route.ts:20`, `canpay/callback/route.ts:16` | Both have `// TODO` — successful payments are logged but order status is never updated in the database. |

### HIGH

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| P5 | **No input validation on admin API POST/PUT** | `src/app/api/admin/brands/route.ts`, etc. | Many admin routes accept body data with minimal or no validation. |
| P6 | **Password returned in API responses** | `src/app/api/admin/customers/route.ts` | Customer list may include password hash in response if `select` doesn't exclude it. |
| P7 | **No rate limiting** | All API routes | No protection against brute-force login attempts or API abuse. |
| P8 | **Seed route accessible in production** | `src/app/api/seed/route.ts` | POST to `/api/seed` wipes and re-seeds the entire database. No auth guard. |
| P9 | **Console.log statements in production code** | `src/app/api/payments/*` | 8 console.log statements in payment handlers that log sensitive data. |

### MEDIUM

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| P10 | **Silent error swallowing in UI** | 30+ storefront/admin components | `.catch(() => {})` on fetch calls — user sees no feedback on failure. |
| P11 | **No CSRF protection** | All POST routes | Cookie-based auth without CSRF tokens. |
| P12 | **next-auth dependency unused** | `package.json:43` | `next-auth@5.0.0-beta.30` is installed but never imported anywhere. |
| P13 | **mock-data.ts still in codebase** | `src/lib/mock-data.ts` | 500+ lines of mock data still present; only used by seed route. |
| P14 | **Missing `sizes` prop on next/image** | Multiple components | Performance warning from Next.js for images with `fill` but no `sizes`. |

### LOW

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| P15 | **dev.db SQLite file in project root** | `dev.db`, `prisma/dev.db` | Old SQLite databases still present after PostgreSQL migration. |
| P16 | **Unused Prisma generated folder** | `src/generated/` | Auto-generated Prisma types that may be stale. |
| P17 | **Default Next.js SVG assets** | `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Placeholder files from create-next-app. |
| P18 | **README is default Next.js boilerplate** | `README.md` | Not customized for the Intact Ghana project. |

---

## 7. Quality Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Test Coverage** | 0% | Zero test files. No unit, integration, or E2E tests. |
| **TypeScript Rigor** | 65% | Strict mode enabled; heavy use of `any` type alias across admin/storefront pages. |
| **Linting** | 70% | ESLint configured with Next.js presets; `eslint-disable` comments scattered. |
| **Formatting** | 40% | No Prettier configured; inconsistent formatting in places. |
| **Code Duplication** | 55% | JWT_SECRET definition repeated in 4 files; fetch patterns repeated across admin pages. |
| **Component Size** | 60% | Checkout page (~500 lines), product detail (~378 lines), several admin pages >300 lines. |
| **Documentation** | 15% | README is boilerplate; no inline API docs; no JSDoc on functions. |
| **Accessibility** | 35% | Basic alt tags present; missing skip-nav, focus traps, ARIA roles on interactive elements. |
| **i18n Readiness** | 0% | All strings hardcoded in English; currency hardcoded as GH₵. |
| **Dependency Health** | 75% | Mostly current versions; `next-auth` unused; no known critical vulnerabilities. |

---

## 8. Completion Dashboard

### Dimension Breakdown

| Dimension | Weight | Raw Score | Weighted |
|-----------|--------|-----------|----------|
| Feature Completeness | 0.30 | 72% | 21.6 |
| Workflow Integrity | 0.20 | 62% | 12.4 |
| Error Handling | 0.10 | 50% | 5.0 |
| Security Posture | 0.15 | 30% | 4.5 |
| Test Coverage | 0.10 | 0% | 0.0 |
| Code Quality | 0.10 | 60% | 6.0 |
| Documentation | 0.05 | 15% | 0.75 |
| | | **TOTAL** | **50.25** |

### Overall Score

| Metric | Value |
|--------|-------|
| **Overall Completion** | **68%** (feature-weighted) / **50%** (quality-weighted) |
| **Maturity Label** | **BETA** |
| **Production Readiness** | **NOT READY** — Critical security and testing gaps |

---

## 9. Enhancement Roadmap

### MUST-HAVE (Before any production deployment)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R1 | **Apply `verifyAdmin` middleware to all `/api/admin/*` routes** | S | Blocks unauthorized CRUD on all data |
| R2 | **Add admin login gate to `/admin` layout** — redirect to login if no admin cookie | S | Prevents public access to CMS |
| R3 | **Wire payment callbacks to update order status in DB** | M | Completes the purchase lifecycle |
| R4 | **Remove or protect `/api/seed` route** | S | Prevents database wipe in production |
| R5 | **Move JWT_SECRET to env-only (remove hardcoded fallback)** | S | Eliminates secret exposure risk |
| R6 | **Add `.env` to `.gitignore` and use `.env.example`** | S | Prevents credential leaks |
| R7 | **Remove `console.log` from payment routes** | S | Prevents sensitive data logging |

### SHOULD-HAVE (For a complete product)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R8 | **Wire all admin CRUD forms to POST/PUT/DELETE APIs** | L | Makes admin CMS fully functional |
| R9 | **Add product edit page (`/admin/products/[id]/edit`)** | M | Critical admin workflow |
| R10 | **Add order detail page with status management** | M | Core admin workflow |
| R11 | **Add image upload (S3/Cloudinary/Supabase Storage)** | L | Replace URL-only image input |
| R12 | **Add E2E tests for critical paths** (Playwright) | L | Catch regressions |
| R13 | **Add API input validation** (zod schemas) | M | Prevent bad data |
| R14 | **Implement loading skeletons** on all data-fetching pages | M | Better UX |
| R15 | **Add toast notifications for errors** instead of silent `.catch(() => {})` | M | User feedback |
| R16 | **Implement password reset flow** | M | Essential auth feature |
| R17 | **Sync wishlist to server** when user is logged in | M | Data persistence |
| R18 | **Add pagination to storefront product lists** | S | Performance for large catalogs |

### NICE-TO-HAVE (For polish and scale)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R19 | **Add Prettier** with format-on-save | S | Consistent code style |
| R20 | **Refactor JWT_SECRET into shared constant** | S | DRY principle |
| R21 | **Add rate limiting** (e.g., `next-rate-limit`) | M | API abuse prevention |
| R22 | **Remove unused `next-auth` dependency** | S | Smaller bundle |
| R23 | **Clean up old SQLite files** (`dev.db`) | S | Repo hygiene |
| R24 | **Write custom README** with setup instructions | S | Developer onboarding |
| R25 | **Add admin dashboard with real stats** (orders, revenue, customers) | M | Business insights |
| R26 | **Add CSRF protection** | M | Security hardening |
| R27 | **Implement i18n** for multi-language support | XL | Market expansion |
| R28 | **Set up Vercel deployment with CI/CD** | M | Production hosting |
| R29 | **Add sitemap.xml and robots.txt** | S | SEO |
| R30 | **Implement server-side cart** using CartItem model | L | Cross-device cart |

---

## 10. Reverse-Engineered PRD

### Executive Summary

Intact Ghana is an e-commerce platform targeting the Ghanaian consumer electronics market. The application allows customers to browse, search, filter, and purchase electronics, smartphones, laptops, TVs, and home appliances online. It includes a full admin content management system for inventory, orders, content, and promotions management. The platform supports multiple payment methods including Cash on Delivery, Hubtel online payments, and CanPay Buy Now Pay Later.

### Problem Statement

Ghanaian consumers lack a modern, feature-rich online shopping platform for electronics. Existing solutions have poor UX, limited product discovery, and unreliable checkout flows. Intact Ghana aims to be the country's #1 electronics e-commerce destination with a beautiful, fast, mobile-first experience.

### User Personas

1. **Online Shopper (Primary)** — Tech-savvy Ghanaian professional, 25-45, wants to browse and buy electronics online with delivery to their location. Values product comparison, reviews, and multiple payment options.

2. **Store Admin** — Intact Ghana staff member who manages product listings, processes orders, publishes news/blog content, and configures promotions. Needs efficient CRUD operations and order management.

3. **Guest Buyer** — First-time visitor who wants to purchase without creating an account. Needs a frictionless checkout with minimal required fields.

### Data Model Summary

18 PostgreSQL tables covering: Users, Products (with images, categories, brands), Orders (with line items), Reviews, Addresses, Cart, Wishlist, HeroSlides, Banners, Pages, News, Promotions, Settings, Subscribers, ContactMessages.

### API Contract Summary

| Endpoint | Methods | Auth | Purpose |
|----------|---------|------|---------|
| `/api/products` | GET | Public | Product listing with filters |
| `/api/products/[slug]` | GET | Public | Product detail with reviews |
| `/api/categories` | GET | Public | Category tree |
| `/api/search` | GET | Public | Cross-entity search |
| `/api/orders` | GET, POST | Public* | Create/list orders |
| `/api/news` | GET | Public | News listing |
| `/api/news/[slug]` | GET | Public | News detail |
| `/api/newsletter` | POST | Public | Subscribe |
| `/api/contact` | POST | Public | Contact form |
| `/api/delivery/estimate` | POST | Public | Delivery fee calc |
| `/api/auth/login` | POST | Public | JWT login |
| `/api/auth/register` | POST | Public | User registration |
| `/api/auth/me` | GET | JWT | Current user profile |
| `/api/admin/*` | GET, POST, PUT, DELETE | None* | Full CRUD (should require admin JWT) |
| `/api/payments/hubtel` | POST | Public | Init Hubtel payment |
| `/api/payments/canpay` | POST | Public | Init CanPay payment |

*Marked items should require authentication but currently don't.

### Technical Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.2.1 |
| UI | React | 19.2.4 |
| Styling | TailwindCSS | 4.x |
| Animation | Framer Motion, GSAP | 12.x, 3.x |
| Components | Radix UI, Lucide icons | Latest |
| State | Zustand | 5.x |
| ORM | Prisma | 6.8.2 |
| Database | PostgreSQL (Neon) | Latest |
| Auth | jose (JWT) + bcryptjs | 6.x, 3.x |
| Language | TypeScript | 5.x |

### Out of Scope (Not Implemented)

- Email/SMS notifications
- Inventory management (stock tracking on order)
- Shipping tracking integration
- Multi-currency support
- Multi-language (i18n)
- Product comparison tool
- Customer reviews submission (read-only currently)
- Admin analytics/reports with real data
- Mobile app (native)

---

## Next 3 Sprint Recommendations

### Sprint 1: Security & Critical Fixes (1 week)

- [ ] Apply `verifyAdmin` to all 19 admin API routes
- [ ] Add admin login gate to `/admin` layout (redirect if not admin)
- [ ] Remove hardcoded JWT fallback secrets
- [ ] Protect or remove `/api/seed` route
- [ ] Wire Hubtel + CanPay callbacks to update order status in DB
- [ ] Add `.env.example` file, verify `.env` is gitignored
- [ ] Remove `console.log` from payment routes

### Sprint 2: Admin CMS Completion (2 weeks)

- [ ] Wire all admin form submissions (create/edit/delete) for: Products, Categories, Brands, Hero Slides, Banners, Pages, News, Promotions
- [ ] Build product edit page (`/admin/products/[id]/edit`)
- [ ] Build order detail page with status management
- [ ] Add admin dashboard with real stats (total orders, revenue, top products, customer count)
- [ ] Add toast notifications for all admin CRUD operations
- [ ] Add input validation with zod on API routes

### Sprint 3: Polish & Testing (1 week)

- [ ] Add Playwright E2E tests for: browse→cart→checkout, register→login→order history, admin login→product CRUD
- [ ] Implement loading skeletons on all data-fetching pages
- [ ] Add error toast notifications (replace `.catch(() => {})`)
- [ ] Implement image upload via Cloudinary or Supabase Storage
- [ ] Add password reset flow
- [ ] Write project README with setup, env vars, and deployment instructions
- [ ] Set up Vercel deployment config
- [ ] Add sitemap.xml and robots.txt

---

*End of Audit Report*
