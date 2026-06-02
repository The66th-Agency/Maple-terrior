# Maple Terroir - Workspace CLAUDE.md

Portfolio company under Sifer Technologies. Not a 66th agency client.
Previously located at Desktop/maple-terroir-site and Desktop/Shawny/.
Documented result: 1,500% organic traffic growth (used as case study for The 66th).
Run /taste-review on all frontend changes before shipping.

## Project Overview
Premium editorial + headless e-commerce website for Maple Terroir, a third-generation, family-owned Canadian maple syrup company based in Quebec's Appalachian Mountains. The site combines storytelling with a fully shoppable catalog powered by Shopify's Storefront API. Deployed as a **Cloudflare Worker (Workers Static Assets)**, auto-deploys on push to `main`. This is NOT a Cloudflare Pages project, which matters: the `functions/` directory does NOT execute (see Deployment & Environments).

## Tech Stack
- **HTML/CSS/JS** — all-in-one single-file pages (no build step, no bundler, no framework)
- **Tailwind CSS** compiled to a static file at `assets/tailwind.css` (theme in `tailwind.config.js`). The runtime `cdn.tailwindcss.com` script was removed 2026-05-29. Re-run the build after adding any NEW utility class (see Development), or it will be silently unstyled.
- **Shopify Storefront API** — headless e-commerce (cart, checkout, products, collections, blog)
- **PostHog** — analytics (loaded via `assets/shared.js`)
- **Fonts**: Fraunces (variable serif headings, optical sizing) + Plus Jakarta Sans (body)
- **Color palette**: cream `#FDFBF7`, amber-warm `#C4841D`, charcoal `#1A1714`, warm-gray scale
- **Animations**: IntersectionObserver scroll reveals, requestAnimationFrame video scrubbing, CSS marquees
- **Hosting**: Cloudflare **Worker** with Workers Static Assets (NOT Pages), GitHub repo at The66th-Agency/Maple-terrior. Honors `_redirects` and `_headers`. Does NOT run Pages Functions (`functions/` is inert).

## Development
Two build steps exist (the original "no build step" design no longer fully holds):
1. `node scripts/build-products.mjs` regenerates `products/<handle>.html` from Shopify when the catalog changes.
2. `npx tailwindcss@3 -c tailwind.config.js -i tailwind-input.css -o assets/tailwind.css --minify` recompiles the CSS. Run after adding ANY new Tailwind utility class to any HTML or JS, otherwise the class is silently unstyled (the CDN that used to JIT classes at runtime is gone). Editing existing classes needs no rebuild.

Preview with any static server (e.g. `npx serve`, or the `maple-terroir` preview config on port 4406). The root-relative `/assets/tailwind.css` link needs a server; opening via `file://` will not load the styles.

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
| Static blog | `blog/index.html` (hub, dynamic from Shopify), `blog/<slug>.html` (one static file per article) | Hub: Shopify articles query. Articles: pre-rendered static HTML. `blog/post.html` was DELETED 2026-05-30 (was a thin CSR shell). |
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
│   ├── favicon.png + favicon-32.png + apple-touch-icon.png  (cropped from mt-logo.webp)
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
**Always commit and push to `main` after completing changes.** This project auto-deploys on push to `main` (GitHub repo `The66th-Agency/Maple-terrior`). Don't wait for the user to ask - if the work is done, push it.

**Deployment model (verified 2026-05-29):** the Cloudflare project `maple-terrior-new` is a **Worker with Workers Static Assets**, NOT a Pages project (the dashboard shows the Workers icon and a "route", not a Pages custom domain). Consequences:
- `_redirects` and `_headers` ARE honored (Workers Assets supports them).
- Pages Functions (`functions/` directory) are NOT executed. Any `functions/_middleware.js` or `functions/<route>.js` is dead code here. Do not solve problems with Pages Functions; use static files, `_redirects`, or a real Worker entry (`_worker.js` / wrangler config) instead.
- `_redirects` is evaluated before any Worker logic, so a `_redirects` rule will shadow anything else trying to claim the same path.
- No `pages.dev` preview domains exist. Branch pushes build under Workers Builds; check build status in the dashboard.

### Which URL is what (CRITICAL — verify before any QA)
- **`https://mapleterroir.com/`**: PRODUCTION. The cutover from legacy Shopify to this rebuild has happened. mapleterroir.com now serves THIS repo via the Cloudflare Worker. Default to this URL when the client says "the site."
- **`https://maple-terrior-new.liamlytton99.workers.dev/`** — Cloudflare Workers preview of this repo. Byte-identical to mapleterroir.com (same source). Use only if mapleterroir.com is unreachable or you need to test before DNS cache flushes.
- Never tell the client "I'm working on the right site" without first verifying both URLs serve the same content.

### DNS and domain redirects (Cloudflare dashboard, invisible to this repo)
The `mapleterroir.com` DNS zone is on Cloudflare (account `Liamlytton99@gmail.com`, a different account than the66th.com). These settings live only in the dashboard, NOT in `_redirects` or anywhere in the repo, so a future session will not see them by reading code:
- **apex `mapleterroir.com`**: Worker route to `maple-terrior-new`, proxied (orange cloud). Production.
- **`www.mapleterroir.com`**: CNAME to the apex, **proxied (orange cloud)**. A Cloudflare **Single Redirect rule** ("Redirect from WWW to root": wildcard `https://www.*` to `https://${1}`, 301, preserve query string) sends all www traffic to the apex at the edge with the path preserved. Set up 2026-05-30.
- **HTTP to HTTPS**: forced via Cloudflare "Always Use HTTPS" (SSL/TLS, Edge Certificates) or a "Redirect from HTTP to HTTPS" rule.
- **Why a Redirect Rule, not `_redirects`**: `_redirects` only matches paths on the apex Worker, after Cloudflare has already routed the hostname, so it cannot catch the `www` hostname. Hostname-level redirects (www to apex, http to https) must be Cloudflare Redirect Rules.
- **Gotcha**: Shopify still lists `www.mapleterroir.com` as one of its domains, so before this rule existed www bounced visitors to `maple-terroir.myshopify.com` (a live duplicate of the store competing for rankings). The edge redirect rule overrides that. Do not try to fix it with DNS alone: a proxied www with no route and no rule returns a 522.
- **Who makes the changes**: Claude has no Cloudflare API token, so Liam makes the dashboard clicks; Claude gives exact steps and verifies the result live with `curl` (status codes, redirect chain, headers).

### Search Console / Google API access (verified 2026-06-01)
Maple Terroir's GSC data is pullable through the connected Google API (claude-seo plugin, OAuth Tier 2). Gotchas worked out 2026-06-01:
- Scripts + venv live under the **`seo`** skill, NOT `seo-google` (whose dir is docs only): run `~/.claude/skills/seo/.venv/bin/python ~/.claude/skills/seo/scripts/<script>.py`.
- The config's `default_property` is `https://www.the66th.com/`, so you MUST override the property for Maple Terroir or every call errors "Permission denied ... the66th.com":
  - Search analytics + sitemaps: `gsc_query.py --property "https://mapleterroir.com/"` (and `gsc_query.py sitemaps --property ...`).
  - URL inspection: `gsc_inspect.py <url> -s "https://mapleterroir.com/"` (flag is `--site-url`/`-s`, NOT `--property`).
- GA4 is NOT wired for MT (the configured ga4_property_id is the66th's; MT uses PostHog). A GA4 pull would need MT's own property id.
- 2026-06-01 baseline read (28 days): 253 clicks / 42,925 impressions / 0.59% CTR; sitemap 92 URLs, 0 errors; homepage + `/blog/organic-vs-conventional-maple-syrup` inspect as PASS (indexed).

## Lab Notes
[date] [what happened] [what to do differently]

2026-06-01: **SEO/GEO session: blog cannibalization fix, product schema enrichment, AI-crawler unblock, llms.txt.** Triggered by a GSC Insights screenshot showing the blog query-split "chaos." Diagnosed as mostly normal post-migration settling (three URL generations of each article still indexed: Era 1 `/blogs/blogs-maple-terroir/<h>` correctly 301'd, Era 2 `/blog/post[.html]?handle=<h>` floored to the hub, Era 3 `/blog/<h>` canonical), NOT a regression. Shipped to main, all verified live:
1. **Blog cannibalization fix.** Two posts targeted "is organic maple syrup better" and both ranked: the thin `/blog/is-organic-maple-syrup-better` (~150 words) and the strong `/blog/organic-vs-conventional-maple-syrup` (~2,400 words). Consolidated onto the deeper URL (Liam chose this): upgraded it (added real citations to USDA NOP / eCFR Part 205, USDA AMS, Vermont Organic Farmers; added a Key Takeaways block; folded in the "is it better" decision; ~2,610 words), deleted the thin file, added `/blog/is-organic-maple-syrup-better  /blog/organic-vs-conventional-maple-syrup  301` to `_redirects` (verified 301 live), removed its sitemap entry, repointed a stray query-param link on `maple-syrup-corporate-gift.html`. **Rule: before writing or expanding any MT blog post, SERP-check for an existing MT page on the same query and consolidate (one canonical page + 301) rather than create a second internal competitor.**
2. **Product schema.** Extended `scripts/build-products.mjs` Shopify query to fetch variant `sku` + `barcode`; baked `sku`/`mpn`/`gtin`/`priceValidUntil`/`itemCondition` and the FULL cleaned description (not the 155-char meta slice, which had been truncating mid-sentence, e.g. blueberry-ceylon-tea) into each Product/Offer JSON-LD. Regenerated all 40 product pages. Only add `aggregateRating` if real Shopify reviews exist (never fabricate); none wired yet.
3. **AI crawlers unblocked.** Live robots.txt had a Cloudflare-injected "BEGIN Cloudflare Managed content" block Disallowing GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Bytespider, Amazonbot, meta-externalagent (Cloudflare default-on for new zones; nobody chose it). Liam turned OFF Cloudflare **AI Crawl Control to "Managed robots.txt"** in the dashboard. Live robots.txt now clean (the repo's own open file serves); dashboard shows ChatGPT-User, Googlebot, BingBot, Claude-SearchBot, Applebot pulling HTTP 200s. **The AI-bot block is a Cloudflare dashboard toggle (AI Crawl Control), not in the repo; Liam owns the click; verify the result on live robots.txt, not just the dashboard.**
4. **llms.txt** added at repo root, served at `/llms.txt` (verified 200). NOTE: it survives because it is `.txt`; an `llms.md` would have been eaten by the `*.md` line in `.assetsignore`.
5. **Security headers were NOT missing.** Initial audit flagged them missing off one `curl -sI` that returned only 3 headers; the `_headers` file already runs the full stack (HSTS+preload, a real CSP scoped for Shopify/PostHog/fonts, Permissions-Policy, nosniff) and it serves on every page. **Rule: verify audit findings against the repo and a fresh cache-busted request before reporting; one stale curl produced a false "missing" finding here.**
**Status of open items:**
- (a) **[DONE 2026-06-01] Per-article blog redirect is LIVE.** Liam added a Cloudflare dynamic Single Redirect Rule named "Blog handle to article": when `http.request.uri.path eq "/blog/post"` or `"/blog/post.html"` AND `len(http.request.uri.args["handle"]) > 0`, 301 to `concat("https://mapleterroir.com/blog/", http.request.uri.args["handle"][0])`, Preserve query string OFF. Verified live: `/blog/post?handle=X` -> 301 -> `/blog/<X>` (real article, proper title; junk `&blog=` param stripped). **GOTCHA for next time:** the redirect expression needs `["handle"][0]` (array index). `["handle"]` alone fails to deploy with "expected value of type Bytes, but got Array<Bytes>" because query args are arrays. The 2026-05-30 note's expression was missing the `[0]`.
- (b) **PRODUCT twin NOT added yet** (the `/product[.html]?handle=X` -> `/products/<handle>` Cloudflare rule). Caveat that keeps it lower priority: some old handles were RENAMED in Shopify and now 404. Confirmed example: "Maple Tea" was renamed "Maple Ceylon Tea" (handle `maple-tea` -> `maple-ceylon-tea`), so `/products/maple-tea` 404'd. **Fixed 2026-06-01:** added `/products/maple-tea  /products/maple-ceylon-tea  301` to `_redirects`. **Lesson: when a Shopify product title changes, its handle changes and the old `/products/<old-handle>` URL dies. Sweep GSC 404s against the current Shopify handle list (query the Storefront API in build-products.mjs) and add `_redirects` for each renamed one.** A full sweep is still TODO before adding the product Cloudflare twin.
- (c) **[DONE 2026-06-01] `Organization.sameAs` populated.** Real socials found via web search and added to `index.html`: Instagram `https://www.instagram.com/mapleterroir/` (@mapleterroir, bio "Maple Terroir Products Ltd.", est. 1978, 3rd-gen family) and Facebook `https://www.facebook.com/mapleterroir/` ("Maple Terroir | Vancouver BC"). Both verified as genuinely the brand. **STILL TODO:** add visible IG/FB links to the footer sitewide (footer is duplicated inline in ~22 files, so it is a batch job, do not half-apply). Open question for Liam: do YouTube / TikTok / LinkedIn channels exist to add to `sameAs` too?
- Artifacts: full audit in `~/Downloads/maple-terroir-seo-audit-2026-06-01/`; plain-language live GSC status (June 1) in `~/Downloads/maple-terroir-search-status-2026-06-01.md`. GSC 28-day read: 253 clicks / 42,925 impressions; top non-brand traffic was still on the old `/blog/post?handle=` URLs (now fixed by item a).

2026-05-30: **Blog URL triplication: legacy `/blog/post*` variants were silently 404ing.** GSC showed each article indexed at up to 3 URLs splitting clicks and tanking avg position: `/blog/post.html?handle=<h>`, `/blog/post?handle=<h>`, and `/blogs/blogs-maple-terroir/<h>`. State found on live prod: variant 3 was already 301'd to `/blog/<h>` by `_redirects`; variants 1 and 2 returned **404** because they relied on a `functions/_middleware.js` that DOES NOT EXIST (and could never run, since this is a Worker with Static Assets, not Pages). The `_redirects` comment claiming otherwise was false. Canonical is `/blog/<slug>` (sitemap + live 200 confirm), so do NOT revert to the old Shopify `/blogs/blogs-maple-terroir/` pattern. **Fix shipped (repo):** removed the dead-middleware comment and added `/blog/post.html /blog/ 301` + `/blog/post /blog/ 301` as a floor that stops the 404. **Why only a hub floor:** Cloudflare `_redirects` cannot match or capture the `?handle=` query param (verified against Cloudflare docs: query-param matching is unsupported), and the path is identical for every article, so per-article 301 is impossible in `_redirects`. **Per-article precision needs a dashboard Single Redirect Rule** (runs at edge BEFORE `_redirects`, so it wins when a handle is present). Rule Liam must add in the `mapleterroir.com` Cloudflare zone, Rules, Redirect Rules, Create, "Custom filter expression":
- **When:** `(http.request.uri.path eq "/blog/post.html" or http.request.uri.path eq "/blog/post") and len(http.request.uri.args["handle"]) > 0`
- **Then:** Dynamic redirect, expression `concat("https://mapleterroir.com/blog/", http.request.uri.args["handle"])`, status **301**, Preserve query string **OFF**.
**Rule going forward:** any future "blog URL split" must be diagnosed against the Worker-not-Pages model (Pages Functions are inert) and the `_redirects` query-param limitation; per-handle redirects belong in a dashboard Redirect Rule, not `_redirects`.

2026-05-30: **Two domain/SEO fixes: www was serving a duplicate Shopify storefront, and the Shopify blog import had truncated `<title>` tags.**
1. **www to Shopify duplicate site.** `www.mapleterroir.com` was a DNS-only CNAME to `shops.myshopify.com`, so Shopify claimed www and 301'd visitors to `maple-terroir.myshopify.com`, a second live copy of the store competing with the rebuild for rankings. Fix: repointed the www CNAME to the apex, set it **proxied** (orange cloud), and added a Cloudflare **Single Redirect rule** (www to root, 301, preserve query string). See Deployment & Environments, "DNS and domain redirects". **Rule: hostname-level redirects (www to apex, http to https) are Cloudflare Redirect Rules in the dashboard, never `_redirects`, which only sees paths after the Worker already owns the hostname. A proxied www with no route or rule returns 522.** Checkout is unaffected: the redirect allowlist in [assets/shared.js](assets/shared.js) trusts only `*.myshopify.com`, `*.shopify.com`, `checkout.mapleterroir.com`, and the apex, never www.
2. **Truncated blog titles.** 13 of ~25 blog posts had `<title>`, `og:title`, and `twitter:title` cut off mid-phrase by the old Shopify-to-static import (e.g. "Canadian Maple Syrup Heist: A $30 Million | Maple Terroir"). The full title survives in each post's JSON-LD `headline`. Fix: restored every `<title>` from its `headline`. **Rule: any time blog posts are re-imported from Shopify, diff each `<title>` against its JSON-LD `headline` and restore the truncated ones.** Same session also retired the client-rendered `/product` and `/collection` shells (301 to `/products`) and renamed the meaningless `/blog/1123` slug to a keyword URL with a 301.

2026-05-29: **SEO migration regression: product pages were not getting indexed, and the deploy is a Worker not Pages.** GSC was full of "Crawled, currently not indexed" for product URLs and organic product traffic had tanked after the custom rebuild. **Root cause:** every product was served from one client-rendered template (`product.html`) via `?handle=`. Googlebot saw byte-identical generic HTML for all ~40 products (same `<title>` "Maple Products | Single-Origin Quebec", no canonical, zero product copy until JS ran), so it treated them as duplicate thin pages and refused to index. Blogs (static HTML) and the 9 hand-built `collections/*.html` were fine; only products (and the dynamic `collection.html` fallback) were CSR. **Second discovery:** the Cloudflare project is a **Worker with Static Assets, not Pages**, so `functions/` never runs (an earlier `functions/_middleware.js` blog-redirect fix was silently inert, and `_redirects` is evaluated before any Worker logic). **Fix (merged to main and verified live on prod 2026-05-29):** pre-render one static `products/<handle>.html` per product via [scripts/build-products.mjs](scripts/build-products.mjs), baking unique title/meta/canonical/OG/JSON-LD + product name and description into each file; client JS still hydrates gallery/variants/cart with live Shopify data. Asset/nav paths are absolutized in the generator so they resolve at `/products/<handle>` depth. Also removed the `/products/* -> /product?handle=` rule from `_redirects`, switched the sitemap and all internal product links sitewide to `/products/<handle>`, and pointed the template canonical at the clean URL. **Rules going forward:** (1) re-run `node scripts/build-products.mjs` and commit `products/*.html` whenever the catalog changes (new products, renamed handles, copy edits), since baked SEO goes stale otherwise (prices stay live via JS). (2) Never use Pages Functions on this project; use static files, `_redirects`, or a real Worker entry. (3) For any new dynamic page type, make sure Googlebot gets unique server-side HTML (title + canonical + content), never one shared CSR shell.

2026-04-26 — Wired add_to_cart and begin_checkout events into [assets/shared.js](assets/shared.js) via fetch monkey-patch + MapleSafeCheckout wrapper. One file edit covered all 22 pages. Pattern: hook the shared infrastructure, never edit per-page IIFEs for sitewide tracking. Also reduced /story hero LCP from 2237ms by serving 1600px@q=70 instead of 1920px@q=80 and adding `fetchpriority="high"` + preload hint. Re-confirmed mapleterroir.com IS the rebuild now (cutover happened); CLAUDE.md was stale on this.

2026-04-26 — **CRITICAL CHECKOUT BUG (post-cutover gotcha).** Discovered that checkout was 404ing for every customer since the mapleterroir.com cutover from Shopify-storefront → Cloudflare Pages. Root cause: Shopify still had `mapleterroir.com` as primary domain, so cartCreate's `checkoutUrl` came back as `mapleterroir.com/cart/c/...`. CF Pages doesn't serve those routes. Adding a CF Pages `_redirects` rule to bounce `/cart/*` → `maple-terroir.myshopify.com/cart/*` triggered an infinite loop because Shopify auto-redirected the .myshopify.com URL back to mapleterroir.com (`x-redirect-reason: primary_domain_redirection`). **Fix**: in Shopify admin → Settings → Domains, change `maple-terroir.myshopify.com` from "Redirecting domain" to "Primary domain". Now Shopify issues maple-terroir.myshopify.com URLs directly, no loop. **Rule for any future Shopify→headless cutover**: before flipping DNS, change the .myshopify.com domain to primary in Shopify and add CF Pages `_redirects` for `/cart/*`, `/checkout/*`, `/checkouts/*`, `/account/*`. Both must happen before traffic moves. Notes: `_redirects` syntax is CF Pages, not Netlify — no `!` modifier. Customer briefly sees `maple-terroir.myshopify.com` URL during checkout; to keep on apex domain, would need a CF Worker proxy (separate task, not done yet).

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

## Writing rules

- Agency Rule: only people act. Abstract nouns (clarity, results, change, strategy, leadership) cannot be the subject of a sentence. Recast so a person or group is the subject. The abstract noun becomes an object, modifier, or part of a prepositional phrase.
  - AVOID: "SEO drives traffic." USE: "We build pages that bring in buyers."
  - Exception: real systems taking real actions are fine. "Shopify handles the cart" and "Cloudflare serves the page" are correct.
