# Maple Terroir - Workspace CLAUDE.md

Portfolio company under Sifer Technologies. Not a 66th agency client.
Previously located at Desktop/maple-terroir-site and Desktop/Shawny/.
Documented result: 1,500% organic traffic growth (used as case study for The 66th).
Run /taste-review on all frontend changes before shipping.

## Project Overview
Premium editorial + headless e-commerce website for Maple Terroir — a third-generation, family-owned Canadian maple syrup company based in Quebec's Appalachian Mountains. The site combines storytelling with a fully shoppable catalog powered by Shopify's Storefront API. Deployed to Cloudflare Pages (auto-deploys on push to main).

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
- **Consistent section width**: All sections must use `max-w-[1400px] mx-auto px-4 md:px-8`. No section should break out of this container or use full-viewport width.

## Deployment & Environments
**Always commit and push to `main` after completing changes.** This project auto-deploys via Cloudflare Pages on push to `main` (GitHub repo `The66th-Agency/Maple-terrior`). Don't wait for the user to ask - if the work is done, push it.

### Which URL is what (CRITICAL — verify before any QA)
- **`https://mapleterroir.com/`** — PRODUCTION. The cutover from legacy Shopify to this rebuild has happened. mapleterroir.com now serves THIS repo via Cloudflare Pages. Default to this URL when the client says "the site."
- **`https://maple-terrior-new.liamlytton99.workers.dev/`** — Cloudflare Workers preview of this repo. Byte-identical to mapleterroir.com (same source). Use only if mapleterroir.com is unreachable or you need to test before DNS cache flushes.
- Never tell the client "I'm working on the right site" without first verifying both URLs serve the same content.

## Lab Notes
[date] [what happened] [what to do differently]

2026-04-26 — Wired add_to_cart and begin_checkout events into [assets/shared.js](assets/shared.js) via fetch monkey-patch + MapleSafeCheckout wrapper. One file edit covered all 22 pages. Pattern: hook the shared infrastructure, never edit per-page IIFEs for sitewide tracking. Also reduced /story hero LCP from 2237ms by serving 1600px@q=70 instead of 1920px@q=80 and adding `fetchpriority="high"` + preload hint. Re-confirmed mapleterroir.com IS the rebuild now (cutover happened); CLAUDE.md was stale on this.

2026-03-29 — [SUPERSEDED by 2026-04-15 entry below] Originally logged a "never switch to Workers" rule. That turned out to be stale. The Workers URL `maple-terrior-new.liamlytton99.workers.dev` IS the canonical preview the client reviews against.

2026-03-30 — When making bento grid changes (copy, subtext, contrast), apply changes uniformly across ALL cards. Proposed removing body copy from some cards but keeping it on others (syrup + chocolates) based on a judgment call - resulted in an inconsistent grid that looked worse than either all-in or all-out. Had to do a second commit to fix it. **Rule: Bento grids are a system. Any copy or style change must be applied consistently to every card. Never half-apply - pick a direction and commit to all cards at once.**

2026-03-31 — Multiple issues from processing Shawn's multi-email feedback batch:
1. Cherry chocolate images were shown in the conversation at the start but kept getting flagged as "never received" in email drafts. **Rule: When processing multi-email client feedback, inventory ALL requests and assets upfront before executing anything. Never claim something is missing without checking the conversation first.**
2. Blueberry box photo was uploaded to "Blueberry Ceylon Tea" instead of "Dark Chocolate Covered Blueberry" due to similar names. **Rule: Always use exact full Shopify product titles when giving upload instructions. Never use shorthand.**
3. object-contain CSS fix looked great on tall box products but broke wide bag products, had to revert. **Rule: Before deploying any CSS change, mentally test it against ALL product types on the page, not just the target.**
4. Syrup collection was reordered in Shopify but products.html had its own JS sort (SYRUP_ORDER) overriding Shopify's manual order. Wasted time in Shopify before finding the code override. **Rule: Always check if the codebase has client-side sort/filter logic before sending the user into Shopify to fix ordering.**

2026-04-15 — Full session log. Shawn sent red-markup screenshots with FAQ edits, product reorder asks, stat corrections, photo swaps, and a stroopwafel title-wrap complaint. All shipped, but several unforced errors along the way.

### Mistakes and rules

1. **Pulled up mapleterroir.com (legacy Shopify) when Liam said "pull up the MT website."** Wasted his time. Then cited a stale 2026-03-29 lab note ("never use Workers") to argue when he pushed back, instead of verifying against reality. **Rule: Before any MT QA, content, or "check the site" task, default to `maple-terrior-new.liamlytton99.workers.dev`. Never cite a lab note against observed evidence — verify first, update the note second.** The Workers URL vs Shopify URL distinction is now in the Deployment & Environments section above; re-read it any time the client says "the site."

2. **Claimed all 5 stroopwafel titles rendered on 2 lines when Pure Maple Syrup Stroopwafels was actually on 1 line of text inside a 2-line-padded box.** Was measuring `boundingBox.height / lineHeight`, which is fooled by `min-height` + `line-clamp`. Shawn was right; I told Liam he was wrong; had to eat it. **Rule: When asked "does this text wrap to N lines," measure via `Range.getClientRects()` and count distinct `top` values. Bounding-box math lies whenever `min-height`, padding, `line-clamp`, or `-webkit-box` is involved.**

3. **Shipped a hardcoded `<br>` for Pure Maple that fixed mid-width but broke wide viewports** — others went to 1 line while Pure Maple stayed 2 lines, the inverse of the original bug. Didn't test at multiple widths before pushing. **Rule: Any fix to product-card title wrapping, grid alignment, bento copy, or any layout symptom caused by mixed line counts must be tested at a minimum of 3 viewport widths (narrow ~400px, mid ~1280px, wide ~1920px) before commit. Per-item overrides almost always create the inverse bug somewhere else — prefer dynamic equalizers (post-render JS measuring actual line counts per grid).**

4. **Summarised only part of the session when Liam asked for a recap.** Gave him the 4 latest edits and left out the FAQ work from earlier in the same session. He had to chase me for it. **Rule: When the user asks for "what did we do" or "summary," recap the entire session, not just the most recent batch. When unsure of scope, check `git log` for every commit since the session started and list each.**

### Patterns and infrastructure we built this session

- **Dynamic title equalizer** — in [products.html](products.html) and [collections/stroopwafels.html](collections/stroopwafels.html). Post-render JS per grid: measure each title via `Range.getClientRects()`; if any wraps to 2+ lines, split every title before its last word with `<br>`; if all fit on 1 line, collapse `min-height` to 0. Re-runs on window resize (debounced 150ms). Reuse this pattern for any grid where mixed title lengths cause uneven card heights.
- **Cookie sort order** — `COOKIE_ORDER` + `cookieSortKey` in [products.html](products.html), same pattern as `SYRUP_ORDER` (client-side sort overrides Shopify's manual collection order). If Shawn reorders the cookies collection in Shopify and nothing moves, this is why.
- **Markets grid is 3-col on md+** — [certifications.html](certifications.html). Was 2-col; upgraded to fit CA/JP/KR/CN/US/TW. Touching this grid means accounting for 6+ cards, not 4.

### Copy and content facts locked in

- **"Our Promise" stats on [terroir.html](terroir.html):** 3rd Generation Farm (not 4th), 3x Certified (not "4x Organic Certified"). Only the SYRUP is organic-certified, not the full product line — so claims like "4x organic certified" across the whole company are wrong. The 3 certs are Ecocert, Canada Organic, USDA Organic.
- **FAQ source of truth is [index.html](index.html) homepage only** — no standalone FAQ page. Currently 12 Qs: 7 original (Shawn-edited) + 5 new (international shipping, storage, grades, organic cert, wholesale). When Shawn asks to "add more FAQs," append here.
- **Markets list (CA/JP/KR/CN/US/TW)** is framed as "markets served" on the certifications page — that context is fine to list countries in. This is different from the global rule "don't list specific shipping countries in FAQ/shipping claims" (import regs vary). The distinction: market presence vs shipping offering.
- **No contractions rule** still holds for all user-facing MT copy. Drafted new FAQ entries this session follow this.

### Asset handling

- **Photo swaps from the legacy Shopify site** — the current `mapleterroir.com` is built on Instant.so and its CDN is `cdn.instant.so/sites/Kjn4vpPuFvAsOEBs/assets/...`. When the client references "the photo on the current site," find it there and **download + host locally** in `assets/images/`. Never hotlink from `cdn.instant.so` — if their plan lapses or assets rotate, our site breaks. Example this session: [assets/images/maple-syrup-french-toast-pour.webp](assets/images/maple-syrup-french-toast-pour.webp).
- **Unsplash is a fallback only** — when a real product/lifestyle photo exists on the legacy site, always prefer that over Unsplash. Unsplash images flag as generic stock to anyone who has seen the client's real content.

