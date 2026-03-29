# Intact Ghana E-Commerce Platform

Full-stack e-commerce platform for **Intact Ghana** — Ghana's #1 destination for electronics, smartphones, laptops, TVs, and home appliances.

## Tech Stack

- **Framework:** Next.js 16.2.1 (App Router, Turbopack)
- **Language:** TypeScript, React 19
- **Database:** PostgreSQL (Neon) via Prisma ORM v6
- **Styling:** TailwindCSS v4, Framer Motion, GSAP
- **Auth:** JWT (jose + bcryptjs), cookie-based sessions
- **State:** Zustand (cart, wishlist)
- **UI:** Radix UI, Lucide Icons, shadcn/ui components
- **Payments:** Hubtel, CanPay BNPL, Mobile Money, Cash on Delivery

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)

### Installation

```bash
git clone <repo-url>
cd intactpro-app
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Strong random string (min 32 chars)
- `NEXT_PUBLIC_BASE_URL` — Your site URL

### Database Setup

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin Access

After seeding, log in with:
- **Email:** admin@intactghana.com
- **Password:** admin123

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Project Structure

```
src/
├── app/
│   ├── (storefront)/     # Public pages (shop, product, cart, etc.)
│   ├── admin/            # Admin CMS pages
│   ├── api/              # API routes
│   │   ├── admin/        # Protected admin endpoints
│   │   ├── auth/         # Login, register, me
│   │   ├── payments/     # Hubtel & CanPay callbacks
│   │   └── ...           # Public endpoints
│   ├── layout.tsx        # Root layout
│   ├── sitemap.ts        # Dynamic sitemap
│   └── robots.ts         # Robots.txt
├── components/ui/        # Reusable UI components
├── lib/
│   ├── auth.ts           # Admin auth middleware
│   ├── db.ts             # Prisma client singleton
│   ├── utils.ts          # Utility functions
│   └── mock-data.ts      # Seed data reference
├── store/
│   ├── cart-store.ts     # Zustand cart store
│   └── wishlist-store.ts # Zustand wishlist store
└── generated/prisma/     # Prisma generated client
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Database seed script
```

## Features

### Storefront
- Homepage with hero slides, product sections, brand showcase
- Shop page with category filtering, search, pagination
- Product detail with image gallery, reviews, related products
- Cart with quantity management and price calculation
- Multi-step checkout (shipping → delivery → payment → review)
- GPS/digital address support with geolocation
- 4 delivery options (Yango, Bolt, Standard, Pickup)
- Multiple payment methods (Hubtel, CanPay, MoMo, COD)
- User account with order history
- Wishlist functionality
- News/blog section
- Store locations page
- FAQ, About, Contact, Career pages
- CMS-driven policy pages

### Admin CMS
- Dashboard with real-time stats (revenue, orders, products, customers)
- Full CRUD for: Products, Categories, Brands, Hero Slides, Banners, Pages, News, Promotions
- Order management with status updates (modal detail view)
- Customer list with search
- Site settings management
- Admin auth gate (requires admin role)

### Security
- All admin API routes protected with `verifyAdmin` middleware
- JWT authentication with no hardcoded fallback secrets
- Admin layout client-side auth gate
- Seed route protected behind admin auth
- `.env` files gitignored, `.env.example` provided

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/products` | Public | List products |
| GET | `/api/products/[slug]` | Public | Product detail |
| GET | `/api/categories` | Public | List categories |
| GET | `/api/search` | Public | Search products |
| POST | `/api/orders` | Public | Create order |
| POST | `/api/newsletter` | Public | Subscribe |
| POST | `/api/contact` | Public | Contact form |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/register` | Public | Register |
| GET | `/api/auth/me` | Auth | Current user |
| GET/POST | `/api/admin/products` | Admin | Products CRUD |
| GET/PUT/DELETE | `/api/admin/products/[id]` | Admin | Product detail |
| GET/POST | `/api/admin/categories` | Admin | Categories CRUD |
| GET/POST | `/api/admin/brands` | Admin | Brands CRUD |
| GET/POST | `/api/admin/hero-slides` | Admin | Hero slides CRUD |
| GET/POST | `/api/admin/banners` | Admin | Banners CRUD |
| GET/POST | `/api/admin/pages` | Admin | CMS pages CRUD |
| GET/POST | `/api/admin/news` | Admin | News CRUD |
| GET/POST | `/api/admin/promotions` | Admin | Promotions CRUD |
| GET/PUT | `/api/admin/settings` | Admin | Site settings |
| GET | `/api/admin/customers` | Admin | Customer list |
| GET | `/api/admin/orders` | Admin | Order list |
| GET/PUT | `/api/admin/orders/[id]` | Admin | Order detail |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |

## License

Proprietary — Intact Ghana Ltd.
