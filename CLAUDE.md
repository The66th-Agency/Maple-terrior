# Maple Terroir Site

## Project Overview
Premium editorial brand website for Maple Terroir — a fourth-generation, family-owned Canadian maple syrup company based in Quebec's Appalachian Mountains. The site prioritizes storytelling, visual refinement, and credibility over e-commerce (links out to mapleterroir.com shop).

## Tech Stack
- **HTML/CSS/JS** — all-in-one single-file pages (no build step)
- **Tailwind CSS** via CDN (`cdn.tailwindcss.com`)
- **Fonts**: Playfair Display (serif headings) + Plus Jakarta Sans (body)
- **Color palette**: cream (#FDFBF7), amber-warm (#C4841D), charcoal (#1A1714), warm-gray scale
- **Animations**: IntersectionObserver scroll reveals, requestAnimationFrame video scrubbing, CSS marquees

## Pages
| File | Purpose |
|------|---------|
| `index.html` | Main landing — hero, product showcase, story, testimonials, scroll sequence, terroir, certifications, CTA |
| `story.html` | Heritage narrative — timeline, founding story, values |
| `products.html` | Product catalog — stroopwafels, teas, chocolates, gift sets |
| `terroir.html` | Educational — "Four Elements" of terroir |
| `certifications.html` | Trust — Ecocert, USDA, JAS certs + global reach |
| `blog.html` | Blog hub — card grid listing all blog posts |
| `blog-ted2024.html` | Blog post — Maple Terroir partners with TED2024 (by Kai Lytton) |
| `blog-guide-canadian-maple-syrup.html` | Blog post — The Complete Guide to Canadian Maple Syrup |
| `product.html` | Dynamic product detail page — loads any product via `?handle=xxx` from Shopify Storefront API |
| `collection.html` | Dynamic collection page (fallback) — loads any collection via `?handle=xxx` from Shopify Storefront API |
| `collections/maple-syrup.html` | Collection: Organic Maple Syrups (handle: maple-syrup-all) |
| `collections/stroopwafels.html` | Collection: Maple Stroopwafels — 5 Flavours (handle: stroopwafels) |
| `collections/tea-coffee.html` | Collection: Maple Tea & Coffee (handle: tea-coffee) |
| `collections/cookies.html` | Collection: Maple Cookies & Biscuits (handle: maple-cookies) |
| `collections/chocolates.html` | Collection: Maple Chocolates (handle: chocolates) |
| `collections/nuts-snacks.html` | Collection: Maple Nuts, Popcorn & Snacks (handle: nuts-popcorn) |
| `collections/gift-sets.html` | Collection: Maple Gift Sets & Bundles (handle: gift-sets) |
| `collections/home-sets.html` | Collection: Maple Home Sets (handle: home-sets) |
| `collections/bestsellers.html` | Collection: Bestselling Maple Products (handle: bestsellers) |

## Assets
- `maple-bottle.mp4` — hero video (autoplay/loop/muted)
- `revised-stroop-stopmotion.mp4` — scroll-scrubbed video
- `maple-exploding-view.mp4` — exploded view video
- `frames/` — 96 JPG frames (frame-0000.jpg to frame-0095.jpg) for scroll sequence

## index.html Section Order
1. Hero — asymmetric editorial split with video
2. Retailer Logos — "Where to Find Us" trust strip (marquee)
3. Our Story — heritage, family, three generations (static)
4. Products — bento-style asymmetric grid with real Shopify product photos (static)
5. Testimonials — social proof marquee
6. Scroll Sequence — locomotive frame-by-frame animation
7. Terroir — single-origin story editorial split
8. Certifications — trust and credibility (dark section)
9. Global Reach — markets served
10. CTA Banner — final conversion push
11. Footer

## Change Log

### 2026-03-27 — Social proof reorder
**What:** Moved Retailer Logos and Testimonials sections from the bottom of the page to higher positions.
**Why:** Social proof was buried right before the CTA — too late to influence visitor trust. The "logo bar" pattern (retailers immediately after hero) answers "should I trust this brand?" right away. Testimonials after products answers "is it actually good?" before the deep-dive scroll sequence.
**Before:** Hero → Product Showcase → Story → Products → Scroll Sequence → Terroir → Certs → Global → Testimonials → Retailers → CTA → Footer
**After:** Hero → Retailers → Product Showcase → Story → Products → Testimonials → Scroll Sequence → Terroir → Certs → Global → CTA → Footer
**Backup:** `index.html.bak` contains the pre-change version.

### 2026-03-27 — Separate back-to-back marquees
**What:** Moved Product Showcase marquee from position 3 (right after Retailer Logos marquee) to position 4 (between Our Story and Products bento).
**Why:** Retailer Logos and Product Showcase were two marquees stacked back-to-back, which felt repetitive. Now each marquee is sandwiched between static sections for better visual rhythm.
**Before:** Hero → Retailers (marquee) → Product Showcase (marquee) → Story → Products → ...
**After:** Hero → Retailers (marquee) → Story (static) → Products (static) → Product Showcase (marquee) → Testimonials (marquee) → ...

### 2026-03-27 — Remove redundant Product Showcase marquee
**What:** Deleted the Product Showcase marquee section entirely. Replaced Unsplash stock images in the bento product grid with real Shopify CDN product photos from the marquee. Removed orphaned CSS (`product-scroll-left` keyframes, `.product-marquee-left`).
**Why:** Products were shown twice back-to-back — first as a curated bento grid, then immediately as a scrolling marquee of the same items. This created redundancy and "carousel fatigue" (two auto-scrolling sections adjacent). The bento grid is the stronger, more design-forward presentation. Swapping in real product photos also fixes the stock-imagery authenticity gap flagged in the taste-skill audit.
**Before (11 sections):** ...Products (bento, stock images) → Product Showcase (marquee, Shopify photos) → Testimonials...
**After (10 sections):** ...Products (bento, real Shopify photos) → Testimonials...
**Images swapped:** Maple Syrup, Stroopwafels, Tea, Coffee — all now use cdn.shopify.com URLs instead of Unsplash.

### 2026-03-27 — Add prefers-reduced-motion support
**What:** Added `@media (prefers-reduced-motion: reduce)` block that disables all animations, marquees, scroll reveals, floats, shimmers, and spin effects. Reveals become instantly visible (opacity: 1, no transform). Scroll behavior falls back to `auto`.
**Why:** Accessibility requirement — 3 marquees, scroll-scrubbed video, parallax floats, reveal animations on every element had no reduced-motion fallback. Also a taste-skill mandate: motion must degrade gracefully.

### 2026-03-27 — Section header variety (REVERTED)
**What:** Attempted to vary eyebrow→H2 headers across Testimonials, Terroir, Certifications, Global Reach. User preferred the consistent eyebrow pattern — reverted all 4 sections to original style.

### 2026-03-27 — Fix stale font comment
**What:** Changed HTML comment from "Clash Display" to "Playfair Display" to match the actual font loaded.
**Why:** Copy-paste debt — the comment referenced a different font than what's in the stylesheet.

### 2026-03-27 — Font swap: Playfair Display → Fraunces
**What:** Replaced Playfair Display with Fraunces (variable serif with optical sizing) as the display font across the site.
**Why:** Playfair Display is ubiquitous on "luxury" brand sites — taste-skill flags it as the serif equivalent of Inter. Fraunces has more character, especially in italics.

### 2026-03-27 — Blog section added
**What:** Created 3 new pages (blog.html hub, blog-ted2024.html, blog-guide-canadian-maple-syrup.html). Added "Blog" link to nav on all 8 HTML pages (desktop + mobile menu). Content pulled from mapleterroir.com/blogs/blogs-maple-terroir.
**Why:** Brand needed a blog presence with existing content. Hub uses Doppelrand card grid, post pages use max-w-[720px] editorial layout. Both posts have proper semantic article HTML, matching design system (Fraunces + Plus Jakarta Sans, cream/amber/charcoal palette, reveal animations, reduced-motion support).
**Posts:** TED2024 partnership (Kai Lytton, Jan 2025), Complete Guide to Canadian Maple Syrup (May 2025).

### 2026-03-27 — Shopify Storefront API integration (headless e-commerce)
**What:** Integrated Shopify Storefront API (Headless channel) across the entire site. Added: cart icon in nav (all 8+ pages), slide-out cart drawer with qty controls, Shopify cart create/add/update/remove mutations, checkout redirect to Shopify hosted checkout. Cart persists across pages via localStorage (`maple_cart_id`).
**Why:** Transform the editorial site into a working e-commerce store. Visitors can now browse, add to cart, and check out without leaving the site — checkout handled by Shopify.
**API:** Public Storefront Access Token, endpoint `https://maple-terroir.myshopify.com/api/2026-01/graphql.json`. Private token not needed for frontend.
**Pages modified:** index.html, products.html, story.html, terroir.html, certifications.html, blog.html, blog-ted2024.html, blog-guide-canadian-maple-syrup.html.

### 2026-03-27 — Products page rebuilt as shoppable catalog
**What:** Rewrote products.html with "Add to Cart" buttons on every product (~30 products across 7 categories: Syrups, Stroopwafels, Mini Snacks, Tea & Coffee, Cookies, Chocolates, Pantry). Each product card links to its detail page. Prices updated to match real Shopify data. Font fixed from Playfair Display → Fraunces.
**Why:** Previously a static showcase linking out to mapleterroir.com. Now a full shoppable catalog with quick-add and detail page navigation.

### 2026-03-27 — Product detail page (product.html)
**What:** Created dynamic product.html template that loads any product via `?handle=xxx` URL param from Shopify Storefront API. Features: image gallery with thumbnails, variant picker (bulk pricing tiers), Add to Cart with animation, trust badges (Organic, Free Shipping, Made in Canada, Non-GMO), rich HTML description from Shopify, product tags, FAQ accordion (6 SEO-rich Q&As), social proof testimonial, "You may also like" recommendations (4 products), sticky mobile Add to Cart bar, skeleton loading states, before/after slider for stroopwafel products (packaged vs. unpackaged comparison with draggable divider).
**Why:** Standard e-commerce product detail page needed for conversion. Variant picker enables bulk pricing. FAQ section adds SEO depth. Before/after slider is a differentiator for the stroopwafel line.

### 2026-03-27 — Collection page (collection.html)
**What:** Created dynamic collection.html template that loads any Shopify collection via `?handle=xxx`. Features: collection title/description from Shopify, filter pills for quick navigation between collections (All, Syrups, Stroopwafels, Cookies, Tea & Coffee, Chocolates, Nuts, Gift Sets, Home Sets, Bestsellers), product grid with images/prices/quick-add, product count, skeleton loading.
**Why:** Standard e-commerce collection/category pages. 20 collections already exist in Shopify — this template makes them all accessible.
**Collections available:** shop-all, maple-syrup-all, stroopwafels, maple-cookies, tea-coffee, chocolates, nuts-popcorn, gift-sets, home-sets, bestsellers, and more.

### 2026-03-27 — All "Shop Now" links internalized
**What:** Changed all `href="https://mapleterroir.com"` links across the site to point to `products.html` (internal). Removed `target="_blank" rel="noopener noreferrer"` from those links. Applies to nav buttons, mobile menu, homepage CTAs, product cards, and footer links.
**Why:** Visitors should stay on the site to shop, not be sent to the external Shopify store. The headless API integration makes this possible.

### 2026-03-27 — Product card links + quick-add pattern
**What:** All product cards on index.html and products.html now link to their respective `product.html?handle=xxx` detail pages. The "Add to Cart" button uses `event.stopPropagation()` to prevent navigation, enabling both paths: card click → detail page, button click → quick add to cart.
**Why:** E-commerce best practice (Shopify, Apple, Glossier pattern). Browsers get depth, repeat buyers get speed.

### 2026-03-27 — Homepage product prices fixed
**What:** Updated the 4 homepage bento product card prices to match real Shopify data: Maple Syrup $14.99, Stroopwafels $8.99, Tea $8.99, Coffee $14.99.
**Why:** Prices were editorial placeholders that didn't match the store.

### 2026-03-27 — Individual collection pages (SEO)
**What:** Created 9 individual collection pages in `/collections/` directory, each with unique `<title>`, `<meta description>`, OG tags, custom hero copy, and hardcoded Shopify collection handle. Pages: maple-syrup, stroopwafels, tea-coffee, cookies, chocolates, nuts-snacks, gift-sets, home-sets, bestsellers. Filter pills link between sibling collection pages. Products load dynamically from Shopify Storefront API. Dynamic `collection.html` kept as fallback.
**Why:** Individual pages with unique titles/meta are significantly better for SEO than a single dynamic page with query params. Each collection gets its own indexable URL, unique OG tags for social sharing, and custom copy — while still loading product data dynamically from Shopify.
**Bug fixed during QA:** Generated pages had JS that tried to `getElementById` on elements that were replaced with static content, causing null reference errors that killed the entire script. Fixed by stripping those JS lines in the generator. Also fixed redirect path from `products.html` to `../products.html` (relative path from subdirectory).

### 2026-03-27 — Homepage section reorder: Products moved up
**What:** Moved the Products bento grid section from position 4 (after Our Story) to position 3 (after Retailers, before Our Story). New order: Hero → Retailers → Products → Our Story → Testimonials → ...
**Why:** User wanted products visible sooner — right after the hero and trust strip, before the brand story.

### 2026-03-27 — Homepage bento cards link to collection pages
**What:** Updated all 7 homepage bento product cards to link to their respective individual collection pages (`collections/xxx.html`) instead of individual products or the generic products page. Maple Syrup → collections/maple-syrup.html, Stroopwafels → collections/stroopwafels.html, Tea → collections/tea-coffee.html, Coffee → collections/tea-coffee.html, Chocolates → collections/chocolates.html, Pantry → collections/nuts-snacks.html, Gift Sets → collections/gift-sets.html.
**Why:** Bento cards represent categories, not individual products — clicking should show the full collection, not a single product detail page.
