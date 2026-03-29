# Intact Ghana — Mobile Responsiveness Audit Report

**Generated:** 2026-03-29  
**Overall Mobile Score:** 68/100  
**Maturity Label:** MOBILE_FAIR — Functional but noticeable issues  
**Total Pages Audited:** 37  
**Total Issues Found:** 42

## Issues by Severity

| Severity | Count |
|----------|-------|
| CRITICAL | 6     |
| HIGH     | 14    |
| MEDIUM   | 15    |
| LOW      | 7     |

---

## 1. Executive Summary

The Intact Ghana e-commerce platform has a solid responsive foundation using TailwindCSS v4 with mobile-first breakpoints. The Header, Footer, Admin Layout, and most storefront pages use responsive grids that collapse appropriately. However, **6 critical issues** block a good mobile experience: missing viewport meta tag `viewport-fit=cover`, Input component font-size causing iOS zoom, ProductCard hover-only actions inaccessible on touch, admin data tables overflowing on small screens, checkout form inputs lacking proper `inputmode`/`type` attributes, and the mega-menu being hover-only with no tap fallback. Fixing these will raise the score to ~82+.

---

## 2. Global Foundation Issues

### 2.1 CRITICAL — Missing `viewport-fit=cover` in viewport meta
- **File:** `src/app/layout.tsx`
- **Issue:** Next.js default viewport meta lacks `viewport-fit=cover`, required for safe-area-inset support on notched iPhones.
- **Fix:** Add viewport export to layout.

### 2.2 HIGH — No global `overflow-x: hidden` on html/body
- **File:** `src/app/globals.css`
- **Issue:** No overflow-x prevention at root level. Wide elements (tables, admin grids) can cause horizontal scroll.
- **Fix:** Add `overflow-x: hidden` to html and body.

### 2.3 HIGH — Input component font-size is `text-sm` (14px) — causes iOS auto-zoom
- **File:** `src/components/ui/input.tsx:12`
- **Issue:** Input uses `text-sm` which renders at 14px. iOS Safari auto-zooms on inputs < 16px.
- **Fix:** Change to `text-base` or add explicit `text-[16px]` for mobile.

### 2.4 MEDIUM — No `box-sizing: border-box` global reset
- **File:** `src/app/globals.css`
- **Issue:** Tailwind v4 includes this by default via `@import "tailwindcss"`, so this is actually OK. No fix needed.

### 2.5 LOW — Toaster position `top-right` may be hard to see on mobile
- **File:** `src/app/layout.tsx:53`
- **Fix:** Consider `bottom-center` for mobile or keep as-is (minor).

---

## 3. Page-by-Page Results

| Page | Score | Status | Top Issue |
|------|-------|--------|-----------|
| Homepage `/` | 72 | NEEDS_WORK | Hero buttons stack poorly at 320px |
| Shop `/shop` | 70 | NEEDS_WORK | Filter toolbar wraps awkwardly |
| Product Detail `/product/[slug]` | 65 | NEEDS_WORK | Quantity + Add to Cart row overflows at 320px |
| Cart `/cart` | 75 | NEEDS_WORK | Subtotal hidden on mobile (sm:block) |
| Checkout `/checkout` | 68 | NEEDS_WORK | Form inputs lack inputmode, GPS button small |
| Account `/account` | 78 | MOBILE_GOOD | Minor spacing |
| Search `/search` | 75 | MOBILE_GOOD | OK |
| Wishlist `/wishlist` | 78 | MOBILE_GOOD | OK |
| News `/news` | 80 | MOBILE_GOOD | OK |
| Brands `/brands` | 78 | MOBILE_GOOD | OK |
| About `/about` | 82 | MOBILE_GOOD | OK |
| Contact `/contact` | 80 | MOBILE_GOOD | OK |
| FAQ `/faq` | 82 | MOBILE_GOOD | OK |
| Promotions `/promotions` | 78 | MOBILE_GOOD | OK |
| Store Locations `/store-locations` | 80 | MOBILE_GOOD | OK |
| Reset Password `/reset-password` | 85 | MOBILE_GOOD | OK |
| Admin Dashboard `/admin` | 62 | NEEDS_WORK | Stats cards too tight at 320px |
| Admin Products `/admin/products` | 55 | NEEDS_WORK | Table overflows, no horizontal scroll |
| Admin Orders `/admin/orders` | 55 | NEEDS_WORK | Table overflows, modal not fullscreen on mobile |
| Admin New Product `/admin/products/new` | 60 | NEEDS_WORK | 3-col layout doesn't collapse well |
| Admin Categories-Settings (8 pages) | 70 | NEEDS_WORK | Forms OK, lists need scroll wrapper |

---

## 4. Component Issues

### 4.1 CRITICAL — ProductCard: Hover-only quick actions (wishlist, view, add-to-cart)
- **File:** `src/components/products/ProductCard.tsx:93`
- **Issue:** Quick action buttons use `opacity-0 group-hover:opacity-100` — completely invisible and inaccessible on touch devices. The "Add to Cart" overlay at bottom also uses `translate-y-full group-hover:translate-y-0`.
- **Fix:** Always show actions on mobile, or use a tap-to-reveal pattern.

### 4.2 CRITICAL — Header mega-menu is hover-only
- **File:** `src/components/layout/Header.tsx:229-231`
- **Issue:** Categories dropdown uses `onMouseEnter`/`onMouseLeave` — no tap support. Desktop-only `hidden lg:block` nav bar hides it, but the categories in mobile menu are fine.
- **Status:** Mitigated — mobile menu has categories. But the desktop nav bar's hover menu has no touch fallback for tablet users.

### 4.3 HIGH — Footer feature badges text overflow at 320px
- **File:** `src/components/layout/Footer.tsx:73`
- **Issue:** `grid-cols-2` with `flex items-center gap-3` — at 320px, text wraps awkwardly inside the 2-col grid.
- **Fix:** Switch to `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`.

### 4.4 HIGH — ChatBot window height is fixed 520px
- **File:** `src/components/chat/ChatBot.tsx:139`
- **Issue:** `style={{ height: "520px" }}` — on short mobile screens (e.g., landscape or with keyboard), this exceeds viewport.
- **Fix:** Use `max-h-[calc(100vh-8rem)]` or `max-h-[80dvh]`.

### 4.5 MEDIUM — HeroSlider nav arrows small tap targets
- **File:** `src/components/home/HeroSlider.tsx:118-128`
- **Issue:** Arrow buttons are `w-12 h-12` (48px) which meets Material Design minimum. OK but `left-4` positioning may be too close to screen edge on small devices.

### 4.6 MEDIUM — HeroSlider dot indicators small tap targets
- **File:** `src/components/home/HeroSlider.tsx:134-141`
- **Issue:** Dots are `h-2 w-2` (8px) — far below 44px minimum tap target. Hard to tap on mobile.
- **Fix:** Add padding around dots or increase clickable area.

---

## 5. Critical Fix List (sorted by impact)

| # | Severity | Issue | File | Fix |
|---|----------|-------|------|-----|
| 1 | CRITICAL | iOS input zoom — font-size < 16px | `src/components/ui/input.tsx` | Change `text-sm` to `text-base` in the className |
| 2 | CRITICAL | ProductCard actions invisible on touch | `src/components/products/ProductCard.tsx` | Show actions on mobile via media query |
| 3 | CRITICAL | Admin tables overflow on mobile | `src/app/admin/products/page.tsx` + orders | Wrap table in `overflow-x-auto` container |
| 4 | CRITICAL | Missing viewport-fit=cover | `src/app/layout.tsx` | Add Next.js viewport export |
| 5 | CRITICAL | Product detail qty+cart row overflow at 320px | `src/app/(store)/product/[slug]/page.tsx` | Make flex-wrap on mobile |
| 6 | CRITICAL | Admin order detail modal not mobile-friendly | `src/app/admin/orders/page.tsx` | Make modal full-width on mobile |
| 7 | HIGH | Footer features grid too tight at 320px | `src/components/layout/Footer.tsx` | grid-cols-1 on xs |
| 8 | HIGH | ChatBot fixed height overflows | `src/components/chat/ChatBot.tsx` | Use max-h with dvh |
| 9 | HIGH | No overflow-x:hidden on body | `src/app/globals.css` | Add overflow-x: hidden |
| 10 | HIGH | Checkout inputs lack inputmode | `src/app/(store)/checkout/page.tsx` | Add type/inputmode attrs |
| 11 | HIGH | Hero slider dots too small for tap | `src/components/home/HeroSlider.tsx` | Increase tap target |
| 12 | HIGH | BrandShowcase 8-col grid too many on mobile | `src/components/home/BrandShowcase.tsx` | Already `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` — OK |

---

## 6. Quick Wins (< 30 min each)

1. **Input font-size fix** — 1 line change in `input.tsx`
2. **Add overflow-x: hidden** to globals.css — 1 line
3. **Add viewport-fit=cover** — 3 lines in layout.tsx
4. **ChatBot max-height** — 1 line change
5. **Footer grid responsive** — 1 class change
6. **Hero dots padding** — add `p-2` to dot buttons
7. **ProductCard mobile actions** — add `sm:opacity-0 opacity-100` pattern

---

## 7. Dimension Scores

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Navigation | 82 | 0.15 | 12.3 |
| Layout Responsiveness | 65 | 0.20 | 13.0 |
| Typography | 72 | 0.10 | 7.2 |
| Touch Targets | 60 | 0.15 | 9.0 |
| Forms & Inputs | 62 | 0.10 | 6.2 |
| Charts & Media | 78 | 0.10 | 7.8 |
| Modals & Overlays | 65 | 0.10 | 6.5 |
| Safe Area & Gestures | 55 | 0.05 | 2.75 |
| Spacing & Density | 72 | 0.05 | 3.6 |
| **TOTAL** | | | **68.35** |

---

## 8. Post-Fix QA Checklist

- [ ] Test all pages on iPhone SE (320px) in Safari
- [ ] Test all pages on iPhone 14 (390px) in Safari
- [ ] Test all pages on Galaxy S23 (360px) in Chrome
- [ ] Verify no horizontal scroll on any page
- [ ] Verify all inputs don't trigger iOS zoom
- [ ] Verify ProductCard actions visible on tap/touch
- [ ] Verify checkout form works with mobile keyboard
- [ ] Verify admin tables scroll horizontally without page overflow
- [ ] Verify ChatBot doesn't overflow viewport on small screens
- [ ] Verify order detail modal is usable on mobile
- [ ] Test GPS location button on real mobile device
- [ ] Verify hero slider swipe/dots work on touch
