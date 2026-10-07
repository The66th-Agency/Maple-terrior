# Maple Terroir

A Sifer portfolio company, not a 66th client. Premium editorial plus headless commerce for a family-owned Canadian maple syrup brand: static HTML and CSS with no build framework, Tailwind compiled to a file, and Shopify's Storefront API behind the cart. Engagement state and audit findings are in `memory/project_maple_terroir_seo_audit.md`.

## Stack and the two build steps

HTML, CSS and JS in single-file pages, no bundler. Tailwind is compiled to `assets/tailwind.css` from `tailwind.config.js`; the runtime CDN script was removed 2026-05-29, so a NEW utility class is silently unstyled until you rebuild. PostHog loads through `assets/shared.js`. Fonts are Fraunces and Plus Jakarta Sans, self-hosted at `assets/fonts/`. Palette: cream `#FDFBF7`, amber `#C4841D`, charcoal `#1A1714`.

1. `node scripts/build-products.mjs` regenerates `products/<handle>.html` from Shopify when the catalog changes. It bakes title, meta, canonical, OG, JSON-LD, the visible price and BreadcrumbList into each file. Re-run and commit whenever the catalog changes, or the baked SEO goes stale.
2. `node scripts/build-grids.mjs` bakes crawlable static product cards into the ten `collections/*.html` grids and `products.html`. Run it alongside build-products on any catalog change.
3. `npx tailwindcss@3 -c tailwind.config.js -i tailwind-input.css -o assets/tailwind.css --minify` after adding any new utility class.

Preview with a static server (`npx serve`, or the `maple-terroir` config on port 4406). `/assets/tailwind.css` is root-relative, so opening a file directly loads no styles.

Shopify Storefront endpoint `https://maple-terroir.myshopify.com/api/2026-01/graphql.json`, public read-only token in `assets/shared.js`, cart id in `localStorage` under `maple_cart_id`. The token is read-only and hydration-only: content edits are made in this repo, never in Shopify admin.

## Deploy, and who clicks what

The Cloudflare project `maple-terrior-new` is a **Worker with Workers Static Assets, not Pages** (verified 2026-05-29). So `_redirects` and `_headers` are honoured, and anything in `functions/` is dead code that never runs. `_redirects` is evaluated before any Worker logic, so a rule there shadows anything claiming the same path. There are no `pages.dev` previews. Repo: The66th-Agency/Maple-terrior, auto-deploys on push to `main`.

**A deploy waits for Liam's yes, the rules page rule.** This file used to say "always commit and push to main, do not wait for the user to ask". That contradicts the standing rule that deploys and live-site changes wait for him, so the standing rule holds. He has not ruled on an exception for this one project, so ask.

`_redirects` ORDERING is load-bearing: wrangler counts every rule after the first wildcard as dynamic, capped at 100, and the deploy hard-fails past it. The file has two labelled sections, exact rules first and wildcards last; append exact rules to section one, never above a wildcard. When a Workers Build fails and the log is unreachable, `npx wrangler deploy --dry-run` then a local deploy reproduces the real validation error.

**Which URL is what, verify before any QA.** `https://mapleterroir.com/` is production and serves this repo. `https://maple-terrior-new.liamlytton99.workers.dev/` is the byte-identical Workers preview. Never say you are on the right site without checking both serve the same content.

**DNS lives in the Cloudflare dashboard, not this repo,** on the account Liamlytton99@gmail.com, which is a different account from the66th.com. The apex is a Worker route, proxied. `www` is a proxied CNAME to the apex with a Single Redirect rule sending www to the apex, 301, query preserved. A hostname redirect cannot be done in `_redirects`, which only matches paths after Cloudflare has routed the hostname. Shopify still lists `www.mapleterroir.com` as one of its domains, so without that rule www bounced to the myshopify store, a live duplicate competing for rankings. **Liam makes every DNS click**, because Claude has no Cloudflare token and because he runs DNS and cutovers himself; Claude writes the exact steps and verifies the result with curl.

## Google access

Scripts and their venv live under the `seo` skill: `~/.claude/skills/seo/.venv/bin/python ~/.claude/skills/seo/scripts/<script>.py`. The config's default property is the66th.com, so ALWAYS override for Maple Terroir or every call errors with permission denied:

- `gsc_query.py --property "https://mapleterroir.com/"`, and the same flag for `sitemaps`.
- `gsc_inspect.py <url> -s "https://mapleterroir.com/"`, where the flag is `--site-url`, not `--property`.
- GA4 is live: gtag `G-2HETD7E9WS`, numeric property `534540699`, passed explicitly to `ga4_report.py --property 534540699`.

## Rules learned here, one line each

- **Googlebot needs unique server-side HTML for every page type.** Forty products served from one client-rendered `product.html?handle=` looked byte-identical to Google and went unindexed. Any new dynamic page type gets a unique baked title, canonical and body copy.
- **Never use Pages Functions on this project.** Use static files, `_redirects`, or a real Worker entry.
- **A CSP change is diffed against every external script, fetch, font, image and media the pages use.** The April 2026 hardening silently blocked the homepage globe's three CDNs for six weeks with no visible error. Prefer self-hosting a library over whitelisting a CDN, and after any CSP change confirm each dependent feature still renders in a real browser.
- **The headless preview has no WebGL**, so the globe cannot be screenshot-verified locally. Check that the libraries load and the assets return 200, then look at it in a real browser.
- **The nav, and the cart drawer, are systems duplicated across about 73 files in two naming dialects.** Any change sweeps every file carrying the signature in ONE commit. The May quantity-button fix landed only on the product template and left 33 pages generating rage clicks for three months.
- **A bento grid is a system**: a copy or style change applies to every card, never half of them.
- **Test any title-wrap or grid-alignment fix at three widths** (about 400, 1280 and 1920). A per-item override almost always creates the inverse bug at another width. Prefer a dynamic equalizer that measures real line counts.
- **To ask whether text wraps to N lines, count distinct `top` values from `Range.getClientRects()`.** Bounding-box maths lies whenever min-height, padding or line-clamp is involved.
- **Retailer logos are social proof, never an order-elsewhere route.** Keep them unlinked under a quiet "Trusted and Stocked By" label, with an on-site buy as the prominent action.
- **An "available at retailer X" claim traces to the retailer's own site**, never to Maple Terroir's own page. Nine of nine Montreal stockist claims failed that check on 2026-06-28. The real footprint is Western and national chains: Costco, Save-On-Foods, Urban Fare, Shoppers Drug Mart, HomeSense, CANEX.
- **`_scripts/generate-static-blogs.mjs` is a one-way import from Shopify.** Hand-editing a served `blog/<slug>.html` and later re-running it for that handle silently reverts the edit; put the content into the Shopify article first.
- **Photos referenced from the legacy site get downloaded and hosted** in `assets/images/`, never hotlinked from `cdn.instant.so`. Unsplash is a fallback only.
- Accessibility: every page carries a `prefers-reduced-motion` fallback, touch targets stay at 44px, icons are inline SVG rather than emoji entities.
- Layout: sections use `max-w-[1400px] mx-auto px-4 md:px-8`, cards use a 2rem radius, and amber is the only accent.

## Copy facts locked by the client

The "Our Promise" stats on `terroir.html` read 3rd Generation Farm and 3x Certified. Only the syrup is organic-certified, not the product line, and the three certifications are Ecocert, Canada Organic and USDA Organic. The FAQ lives on the homepage only; new questions append there. The markets list (Canada, Japan, Korea, China, USA, Taiwan) is framed as markets served, which is different from listing shipping countries. No contractions in user-facing copy.

## Finish condition

`node scripts/build-products.mjs` and `build-grids.mjs` run clean if the catalog changed, the page loads on a local static server with a screenshot and a clean console, and `curl -I` the production URL returns 200 after any deploy.

## Open

Liam needs backlinks to `https://mapleterroir.com/blog/best-canadian-maple-syrup-brands-2026`, the fastest-growing page (0 to 291 clicks in six weeks, position 6 to 7). Every on-page lever is done; links are what is left. Raise it on any Maple Terroir session until they are acquired, then delete this line.
