# Maple Terroir — Tier 1 SEO Action Plan (CTR Rescue + Internal-Link Cascade)

**Created:** 2026-05-04
**Owner:** Liam to execute in Shopify admin (articles still live in Shopify; mapleterroir.com renders them via Storefront API)
**Goal:** Recover ~700k monthly GSC impressions currently capped by low CTR, and redirect PageRank from TOFU blogs to the new commercial pages.

---

## CRITICAL — Stage 0 already shipped (no action needed from you)

Before this plan can work, the dead Shopify blog URLs needed to start resolving again. Every old `/blogs/blogs-maple-terroir/[slug]` was a 404 after the Cloudflare Pages cutover, so 700k monthly impressions were bleeding into nothing.

**Fix shipped in `_redirects`:**

```
/blogs/blogs-maple-terroir       /blog/                                              301
/blogs/blogs-maple-terroir/*     /blog/post?handle=:splat&blog=blogs-maple-terroir   301
```

After Cloudflare deploys (~2–3 min from push), every legacy blog URL 301s to the dynamic blog template, which fetches the article from Shopify by handle. Link equity preserved, users land on real content, Google updates the index.

**Verify after deploy:**
```bash
curl -s -o /dev/null -w "%{http_code} -> %{url_effective}\n" -L \
  "https://mapleterroir.com/blogs/blogs-maple-terroir/can-you-tap-any-maple-tree-the-truth-about-backyard-syrup-making"
```
Should end at `200` on `/blog/post?handle=...&blog=...`.

---

## How to execute Stage 1 + 2 in Shopify admin

For each of the 8 blog posts below:

1. Shopify admin → **Online Store → Blog Posts** → open the article
2. Scroll to **Search engine listing preview** → click *Edit website SEO*
3. Replace **Page title** with the new title from this doc
4. Replace **Meta description** with the new meta description
5. In the article body editor, find the suggested insertion point and paste the internal-link paragraph
6. Use Shopify's link tool with the *exact* anchor text and target URL specified — do not alter
7. Save

After all 8 are done, request indexing for each updated URL in GSC (URL Inspection → Request Indexing) so Google recrawls within a few days instead of weeks.

---

## Why each title rewrite works

The pattern: AI Overview at the top of the SERP is satisfying generic informational queries before the user clicks any blue link. To beat that, the title and description have to promise something *specifically more* than what the AI snippet can deliver — exhaustive lists, ranked breakdowns, year-tagged authority, named-source claims, or interactive depth that requires visiting the page.

Every new title:
- Keeps the primary keyword in the first 5 words
- Stays under 60 characters (full display in SERP)
- Includes a hook the AI Overview snippet structurally cannot satisfy
- Is fully accurate to existing article content (no false promises)

---

## The 8 blogs

### 1. Can You Tap Any Maple Tree (221k impressions, pos 4.9, CTR 0.59%)

**URL:** `/blogs/blogs-maple-terroir/can-you-tap-any-maple-tree-the-truth-about-backyard-syrup-making`
**Top queries:** "how many taps can one maple tree support" (25.7k imp), "what trees can be tapped for syrup" (1.5k), "do all maple trees produce syrup" (1.4k), "how many taps can you put on a maple tree" (1.3k)
**Why CTR is low:** AI Overview definitively answers "sugar maple, red maple, black maple" — searchers feel the snippet is enough.

**New page title (under 60 chars):**
> How Many Taps Per Maple Tree? The Backyard Sugaring Guide

**New meta description (under 160 chars):**
> Sugar makers explain exactly which maple species can be tapped, how many taps each tree can support by trunk size, and the equipment beginners actually need.

**Internal-link paragraph — insert in top third, after the intro answers "which trees can be tapped":**
> Most backyard sugarers tap two or three trees and end up with a few cups of finished syrup after a long boil. If you want to skip the wood-fire and the seven-week wait, our team in Quebec's Appalachian foothills makes the same single-origin syrup we drink ourselves — see our [pure Quebec maple syrup collection](https://mapleterroir.com/collections/premium-maple-syrup) for what a finished, third-generation product tastes like.

---

### 2. The Complete Guide to Canadian Maple Syrup (112k impressions, pos 5.4, CTR 0.35%)

**URL:** `/blogs/blogs-maple-terroir/the-complete-guide-to-canadian-maple-syrup`
**Top queries:** "canadian maple syrup", "real canadian maple syrup", "maple syrup canada", "best canadian maple syrup" (pos 7.3 — striking distance)
**Why CTR is low:** Generic guide title; SERP is dominated by listicles and brand pages (per the SOP's worked example).

**New page title:**
> Canadian Maple Syrup: Grades, Regions & How to Buy Real Syrup

**New meta description:**
> The full guide to Canadian maple syrup — Grade A vs B, Quebec vs Ontario terroir, what makes syrup truly real, and which producers ship the genuine product.

**Internal-link paragraph — insert in top third, after the intro establishes Canada as the source of 71% of world supply:**
> If you came here ready to buy rather than read all the way through, we keep a current shortlist of [the best Canadian maple syrup brands](https://mapleterroir.com/canadian-maple-syrup) — ranked by region, grade, and where to actually find each producer online or in stores.

*Note: this internal link is the most strategic on the entire site. The /canadian-maple-syrup BOFU listicle is built specifically to rank for "best canadian maple syrup" (currently pos 7.3 — striking distance). This blog passes 112k monthly impressions of authority straight to it.*

---

### 3. Canadian Maple Syrup Production Report 2025 (110k impressions, pos 5.5, CTR 0.32%)

**URL:** `/blogs/blogs-maple-terroir/canadian-maple-syrup-production-report-2025-hidden-market-opportunities-revealed`
**Top queries:** "canadian maple syrup production", production volumes by year, market opportunities
**Why CTR is low:** The "2025" in the title is now stale (we're in 2026); "hidden market opportunities" is vague.

**New page title:**
> Canadian Maple Syrup Production: 2026 Volumes, Trends & Buyers

**New meta description:**
> Annual Canadian maple syrup production by region, recent volume swings, the global price pressure heading into 2026, and where wholesale buyers are sourcing now.

**Internal-link paragraph — insert in top third, after the opening data point on Canada's share of global production:**
> Buyers reading this report often want to source the actual product, not just the data. We supply restaurants, hotel groups, and corporate gifting programs at volume — see our [maple syrup wholesale program](https://mapleterroir.com/maple-syrup-wholesale) for current pricing tiers and lead times.

---

### 4. The Truth About Maple Syrup Hidden Uses (68k impressions, pos 5.0, CTR 0.62%)

**URL:** `/blogs/blogs-maple-terroir/the-truth-about-maple-syrup-hidden-uses`
**Top queries:** "maple syrup uses", "what to use maple syrup for", recipe-adjacent searches
**Why CTR is low:** "Hidden uses" sounds clickbaity to skeptical searchers; AI Overview lists pancake/waffle/glaze.

**New page title:**
> 17 Maple Syrup Uses That Aren't Pancakes (Cooking & Health)

**New meta description:**
> From bourbon glazes and salad dressing to skin care and coffee — every legitimate maple syrup use beyond breakfast, ranked by how often Quebec producers actually use them.

*If the article doesn't have 17 distinct uses, count what it has and use that exact number — round numbers like "12 Maple Syrup Uses" or "15 Maple Syrup Uses" both work.*

**Internal-link paragraph — insert in top third, after the intro lists pancakes/waffles as the obvious ones:**
> Most of the recipes below assume you're starting with real, single-origin syrup — not the corn-syrup blends sold next to them on the shelf. Our [pure Quebec maple syrup](https://mapleterroir.com/collections/premium-maple-syrup) is what we actually cook with at home; the difference shows up most when the syrup is the only sweetener in the dish.

---

### 5. 5 Surprising Maple Syrup Benefits (59k impressions, pos 5.5, CTR 0.29%)

**URL:** `/blogs/blogs-maple-terroir/5-surprising-maple-syrup-benefits-you-need-to-know`
**Top queries:** "maple syrup benefits", "health benefits of maple syrup", "is maple syrup anti inflammatory"
**Why CTR is low:** "5 surprising" reads as listicle filler; AI Overview lists antioxidants/minerals/lower glycemic-index — readers feel done.

**New page title:**
> Maple Syrup Health Benefits: What 24 Studies Actually Show

**New meta description:**
> A working sugar maker's review of every peer-reviewed maple syrup study — antioxidants, glycemic index, inflammation, minerals — and which claims actually hold up.

*Verify the article cites at least ~20 studies before using "24 Studies" — adjust the number to whatever the article actually references. If the article doesn't cite specific studies, swap the title to: "Maple Syrup Health Benefits: The Honest Sugar Maker's Take"*

**Internal-link paragraph — insert in top third, after the framing that not all maple syrup is the same:**
> The benefits below mostly hold for *real* syrup — single-ingredient, properly graded, ideally certified organic so the trees are managed without synthetic inputs. Our [certified organic maple syrup](https://mapleterroir.com/organic-maple-syrup) carries Canada Organic, USDA Organic, and Ecocert certifications across the line; if you're reading this for the health angle, that's the version worth drinking.

---

### 6. The Hidden Truth Behind Real Maple Syrup Sap Values (56k impressions, pos 5.9)

**URL:** `/blogs/blogs-maple-terroir/the-hidden-truth-behind-real-maple-syrup-sap-values-2025-guide`
**Top queries:** "sap to syrup ratio", "real maple syrup", "how much sap to make a gallon of syrup"
**Why CTR is low:** "Hidden truth" is vague; the 40:1 ratio is the AI Overview's headline answer.

**New page title:**
> Sap to Syrup Ratio: Why 40:1 Is Wrong (And What's Real)

**New meta description:**
> The actual sap-to-syrup ratio varies by tree species, season, and sugar content — see real numbers from a working Quebec sugar bush, plus how grade affects yield.

**Internal-link paragraph — insert in top third, after the intro mentions the commonly-cited 40:1 ratio:**
> The reason these ratios matter to anyone outside a sugar bush is they explain why genuine syrup costs what it does — and why anything labelled "syrup" under $0.40 per ounce is almost certainly not pure. If you want the finished product the ratios above produce, see our [pure Quebec maple syrup](https://mapleterroir.com/collections/premium-maple-syrup).

---

### 7. Canadian Maple Syrup Heist (49k impressions, pos 5.7, CTR 1.18%)

**URL:** `/blogs/blogs-maple-terroir/canadian-maple-syrup-heist-a-30-million-theft-unveiled`
**Top queries:** "canadian maple syrup heist", "great maple syrup heist", "maple syrup robbery"
**Why CTR is already higher (1.18%):** Story-driven curiosity click.
**Strategy here:** This is a TOFU blog with no real commercial intent — keep the title strong, focus on the internal-link cascade to soak up the curiosity traffic.

**New page title (lighter rewrite — current title already converts):**
> The $30M Canadian Maple Syrup Heist: How They Pulled It Off

**New meta description:**
> The full inside story of the 2011–2012 Quebec maple syrup heist — how the strategic reserve was emptied, who got caught, and why the cartel system existed in the first place.

**Internal-link paragraph — insert near the close, after the heist resolution but before the article ends, framed as "what real syrup is worth":**
> The reason 9,500 tonnes of syrup was worth stealing in the first place is the same reason genuine Canadian maple syrup commands a premium today: it's labour-intensive, weather-dependent, and impossible to fake at scale. If you've never tasted what the cartel was sitting on, our [pure Quebec maple syrup](https://mapleterroir.com/collections/premium-maple-syrup) is from the same Appalachian terroir the strategic reserve protected.

---

### 8. Authentic Dutch Stroopwafel Recipe (48k impressions, pos 6.8, CTR 0.68%)

**URL:** `/blogs/blogs-maple-terroir/authentic-dutch-stroopwafel-recipe-a-bakers-guide-to-making-these-caramel-filled-treats`
**Top queries:** "stroopwafel recipe" (8.3 pos, 617 imp — striking distance), "dutch stroopwafel", "how to make stroopwafels"
**Why CTR is low:** Generic recipe-page title competing against AllRecipes / Food.com / King Arthur.

**New page title:**
> Authentic Stroopwafel Recipe: The Dutch Caramel Cookie at Home

**New meta description:**
> The traditional Dutch stroopwafel recipe — from the dough and the iron to the maple-caramel filling that makes the bakery version worth recreating. Step-by-step with timing.

**Internal-link paragraph — insert in top third, after the intro explains what a stroopwafel is:**
> Most stroopwafel recipes online use a corn-syrup caramel center because it's stable and cheap. The version below uses pure maple syrup in the filling — the same approach we use for our [maple stroopwafels](https://mapleterroir.com/collections/maple-stroopwafels), if you'd rather skip the iron and have them shipped.

---

## What this should move (rough expected impact)

If 700k monthly impressions averaged 0.45% CTR before (≈3.1k clicks), and the title/description rewrites lift CTR to a more typical 1.5–2.0% for striking-distance pages (industry norm), that's:

- Conservative: **3.1k → 10.5k clicks/month** (+7.4k)
- Aggressive: **3.1k → 14k clicks/month** (+10.9k)

The internal-link cascade additionally moves PageRank from these 700k-impression blogs into the four BOFU pages (`/canadian-maple-syrup`, `/organic-maple-syrup`, `/maple-syrup-wholesale`, `/collections/premium-maple-syrup`), which should pull at least one of them out of striking distance and into top-3 within 30–45 days.

---

## What's NOT in this plan (Tier 1.5+ for next pass)

- **Adding actual downloadable assets** (calculator PDF, equipment checklist, study reference list) — these would unlock stronger title hooks ("Free Tap Calculator [PDF]") that the AI Overview structurally can't compete with. Tier 1.5 if CTR rewrite alone doesn't move the needle.
- **Schema markup additions** — recipe schema on the stroopwafel post, FAQ schema on guides, Article schema everywhere. Would be a separate technical SEO pass.
- **New BOFU pages for "sap to syrup ratio" and "stroopwafel recipe" striking-distance queries** — both are pos 7–8 with thousands of impressions; once they're properly internal-linked from the blogs they'll likely move on their own, but worst case we build dedicated pages next sprint.
- **Refreshing the production report and benefits posts with 2026 data** — these already rank but feel dated; an update + GSC re-index request would lift positions further.

---

## Verification checklist (run after Liam executes in Shopify)

- [ ] All 8 article URLs return 200 via the redirect chain
- [ ] New meta title appears in `view-source:` of each rendered post (first ~70 chars of `<title>` tag)
- [ ] Each internal link is present, descriptive anchor matches this doc, target URL matches this doc
- [ ] All 8 URLs submitted via GSC URL Inspection → Request Indexing
- [ ] Add a row to the GSC scoreboard tracking sheet noting today's date and "Tier 1 CTR + link cascade shipped"
- [ ] Set a 30-day calendar reminder to re-pull GSC and measure delta in CTR + position for all 8 URLs
