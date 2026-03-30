# Maple Terroir - Workspace CLAUDE.md

Portfolio company under Sifer Technologies. Not a 66th agency client.
Previously located at Desktop/maple-terroir-site and Desktop/Shawny/.
Documented result: 1,500% organic traffic growth (used as case study for The 66th).
Run /taste-review on all frontend changes before shipping.

## Project Overview
Premium editorial + headless e-commerce website for Maple Terroir — a fourth-generation, family-owned Canadian maple syrup company based in Quebec's Appalachian Mountains. The site combines storytelling with a fully shoppable catalog powered by Shopify's Storefront API. Deployed to Cloudflare Pages (auto-deploys on push to main).

## Tech Stack
- **HTML/CSS/JS** — all-in-one single-file pages (no build step, no bundler, no framework)
- **Tailwind CSS** via CDN (`cdn.tailwindcss.com`)
- **Shopify Storefront API** — headless e-commerce (cart, checkout, products, collections, blog)
- **PostHog** — analytics (loaded via `assets/shared.js`)
- **Fonts**: Fraunces (variable serif headings, optical sizing) + Plus Jakarta Sans (body)
- **Color palette**: cream `#FDFBF7`, amber-warm `#C4841D`, charcoal `#1A1714`, warm-gray scale
- **Animations**: IntersectionObserver scroll reveals, requestAnimationFrame video scrubbing, CSS marquees
- **Hosting**: Cloudflare Pages, GitHub repo at The66th-Agency/Maple-terrior

## Development
No build step. Open any HTML file in a browser to preview. For local development with live reload, use any static file server (e.g., `npx serve` or VS Code Live Server extension).

## Shopify Storefront API
- **Endpoint**: `https://maple-terroir.myshopify.com/api/2026-01/graphql.json`
- **Public token**: in `assets/shared.js` and inline in each page's `<script>` block
- **Cart persistence**: `localStorage` key `maple_cart_id`
- Dynamic pages (`product.html`, `collection.html`, `blog/post.html`) load data via URL params (`?handle=xxx`)

## Architecture

### Shared infrastructure (`assets/shared.js`)
Loaded by every page. Provides: announcement bar, search modal (Ctrl+K), back-to-top button, recently viewed tracking, cart drawer (slide-out with qty controls, Shopify mutations). Each page also has its own inline `<script>` with page-specific Shopify API calls and cart logic.

### Page types
| Type | Files | Data source |
|------|-------|-------------|
| Static editorial | `index.html`, `story.html`, `terroir.html`, `certifications.html` | Hardcoded HTML |
| Static catalog | `products.html` | Hardcoded product cards with Shopify variant IDs |
| Dynamic product | `product.html?handle=xxx` | Shopify Storefront API (single product query) |
| Dynamic collection | `collection.html?handle=xxx` | Shopify Storefront API (collection query) |
| SEO collection | `collections/*.html` (9 pages) | Hardcoded hero + Shopify API for product grid |
| Dynamic blog | `blog/index.html`, `blog/post.html?handle=xxx&blog=yyy` | Shopify Storefront API (articles query) |
| Utility | `404.html`, `sitemap.xml` | Static |

### Directory structure
```
├── index.html              # Homepage
├── product.html            # Dynamic product detail (PDP)
├── products.html           # Full shoppable catalog
├── collection.html         # Dynamic collection (fallback)
├── story.html, terroir.html, certifications.html
├── blog/
│   ├── index.html          # Blog hub (dynamic from Shopify)
│   └── post.html           # Blog post template (dynamic)
├── collections/            # 9 SEO-optimized collection pages
├── assets/
│   ├── shared.js           # Sitewide features (search, cart, announcement bar)
│   ├── favicon.svg
│   ├── videos/             # Hero video, scroll-scrub video, exploding view
│   ├── frames/             # 96 JPGs for scroll sequence (frame-0000.jpg to frame-0095.jpg)
│   └── images/             # Static images
└── sitemap.xml
```

### index.html section order
1. Hero — asymmetric editorial split with video
2. Retailer Logos — "Where to Find Us" trust strip (marquee)
3. Products — bento-style asymmetric grid linking to collection pages
4. Our Story — heritage, family narrative (static)
5. Testimonials — social proof marquee
6. Scroll Sequence — locomotive frame-by-frame animation
7. Terroir — single-origin story editorial split
8. Certifications — trust and credibility (dark section)
9. Global Reach — markets served
10. CTA Banner — final conversion push
11. Footer

## Key Patterns

### Cart + Add to Cart
Every page includes inline Shopify cart logic (createCart, addToCart, updateCart mutations). Product cards use `event.stopPropagation()` on the Add to Cart button so card click → detail page, button click → quick add.

### Scroll reveals
Elements with class `.reveal` use IntersectionObserver to animate in. Must include `@media (prefers-reduced-motion: reduce)` fallback (opacity: 1, no transform) on every page.

### Nav + mobile menu
Navigation is duplicated inline in every HTML file (no templating). When modifying nav links, update all pages: `index.html`, `story.html`, `terroir.html`, `certifications.html`, `products.html`, `product.html`, `collection.html`, `404.html`, `blog/index.html`, `blog/post.html`, and all 9 `collections/*.html` files.

### Subdirectory path handling
Pages in `blog/` and `collections/` use `../` relative paths. `shared.js` detects subdirectory via `window.location.pathname` and adjusts link prefixes.

## Design Constraints
- **Accessibility**: All pages must include `@media (prefers-reduced-motion: reduce)` support
- **Touch targets**: Minimum 44px for all interactive elements
- **No emoji entities**: Use inline SVG icons instead of HTML emoji entities (&#xxx;)
- **Accent color**: Amber only (`#C4841D` / `#F4C77D`) — no emerald, blue, or rose accents
- **Border radius**: 2rem on cards
- **No stock images**: Product images come from Shopify CDN (`cdn.shopify.com`)
- **Consistent headers**: Use the eyebrow → H2 pattern across all sections (user rejected variety)

## Deployment
**Always commit and push to `main` after completing changes.** This project auto-deploys via Cloudflare Pages on push to `main` (GitHub repo `The66th-Agency/Maple-terrior`). Don't wait for the user to ask - if the work is done, push it.

## Lab Notes
[date] [what happened] [what to do differently]

2026-03-29 — Deployment was switched from Cloudflare Pages to Workers (`maple-terrior-new`) via Wrangler in a previous session. Workers requires manual `wrangler deploy` and API token auth, breaking the auto-deploy flow. Reverted back to Pages (auto-deploys on push to `main` via GitHub repo `The66th-Agency/Maple-terrior`). **Rule: Always use Cloudflare Pages for this project. Never switch to Workers - there's no benefit and it breaks auto-deploy.**

