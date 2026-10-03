// Bakes the shared blocks of the Canada city pages into every page that carries
// their markers. One script, so a block changes in one place and every page
// that shows it changes on the next run (it replaced build-family.mjs on
// 2026-10-02).
//
// Markers, each an empty pair the page places where the block should sit:
//   <!-- LOGOS:START baked by scripts/build-blocks.mjs -->     <!-- LOGOS:END -->
//     A thin strip under the hero: the average customer rating, then the
//     retailer logos in one slow marquee. Liam, 2026-10-02: "a marquee sleek
//     with the logos of where we are located but one strip and subtle".
//   <!-- REVIEWS:START set="syrup" -->                          <!-- REVIEWS:END -->
//     Three real customer reviews right after the product grid, so the proof
//     sits in the top half (visual.md). set="syrup" or set="gifts".
//   <!-- FAMILY:START baked by scripts/build-blocks.mjs -->    <!-- FAMILY:END -->
//     The family section: who started the company and who packs the orders.
//
// Facts, checked 2026-10-02:
// - The rating: Loox holds 93 reviews averaging 5.0 (Loox admin). The count is
//   never printed (visual.md: the average rating stands alone).
// - The logos are the nine on the homepage's "Where to Find Us" strip, the set
//   Shawn reviewed in June 2026. They stay unlinked: trust, never a route away
//   from the store (site CLAUDE.md, 2026-06-29).
// - Reviews are read from the product pages, which build-reviews.mjs bakes from
//   the Loox export, so a quote here is always word for word what the customer
//   wrote and still published on the product page.
// - Family: Wayne Lytton, born in Nanaimo, founded the company with his wife
//   Kaori in 1978, and the brand calls itself three generations (old Shopify
//   About page, maple-terroir.myshopify.com/pages/about). Shawn Lytton is CEO
//   (same page). Gavin Lytton fulfils orders from the Vancouver location at 9291
//   Shaughnessy Street (Shopify order timelines). The photo is Shawn, from the old
//   About page, cropped to keep another company's packaging out of frame. When the
//   family group photo arrives, replace PHOTO and ALT below and re-run.
//
// Run: node scripts/build-blocks.mjs   (idempotent; rewrites only the marked blocks)

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true" class="w-4 h-4 fill-current"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
const STARS = `<span class="inline-flex gap-0.5 text-amber-warm" role="img" aria-label="5 out of 5 stars">${STAR.repeat(5)}</span>`;

// ------------------------------------------------------------ LOGOS
const LOGOS = [
  ['costco.webp', 'Costco'], ['amazon.webp', 'Amazon'], ['walmart.webp', 'Walmart'],
  ['save-on-foods.png', 'Save-On-Foods'], ['shoppers.webp', 'Shoppers Drug Mart'], ['homesense.webp', 'HomeSense'],
  ['urban-fare.webp', 'Urban Fare'], ['nesters.png', 'Nesters Market'], ['canex.png', 'CANEX'],
];
const logoRow = (hidden) => LOGOS.map(([f, a]) =>
  `<img src="/assets/images/logos/${f}" alt="${hidden ? '' : a}" class="mt-strip-logo h-6 md:h-7 w-auto object-contain flex-shrink-0" loading="lazy">`).join('');
const logos = () => `  <section aria-label="Customer rating and retailers" class="border-b border-warm-gray-200/40">
    <style>
      @keyframes mt-strip { to { transform: translateX(-50%); } }
      .mt-strip-track { animation: mt-strip 50s linear infinite; }
      .mt-strip-mask { -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
      .mt-strip-logo { filter: grayscale(1); opacity: .5; }
      .mt-strip-logo[alt="CANEX"] { filter: brightness(0); opacity: .4; }
      @media (prefers-reduced-motion: reduce) { .mt-strip-track { animation: none; } }
    </style>
    <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
      <p class="flex items-center gap-3 flex-shrink-0 text-sm text-charcoal">${STARS}<span><b class="font-semibold">5.0</b> <span class="text-warm-gray-500">average customer rating</span></span></p>
      <span class="hidden md:block w-px h-6 bg-warm-gray-200 flex-shrink-0" aria-hidden="true"></span>
      <p class="text-sm text-warm-gray-500 flex-shrink-0 hidden md:block">Also stocked by</p>
      <div class="mt-strip-mask relative flex-1 overflow-hidden">
        <div class="mt-strip-track flex items-center" style="width:max-content">
          <div class="flex items-center gap-12 md:gap-16 pr-12 md:pr-16">${logoRow(false)}</div>
          <div class="flex items-center gap-12 md:gap-16 pr-12 md:pr-16" aria-hidden="true">${logoRow(true)}</div>
        </div>
      </div>
    </div>
  </section>`;

// ------------------------------------------------------------ REVIEWS
// [product handle, reviewer name as published]. Chosen to answer what a buyer
// on that page worries about: the taste, the gift, the delivery and packing.
const SETS = {
  syrup: [['organic-pure-maple-syrup-250ml', 'Amrit G.'], ['pure-maple-syrup-maple-leaf-bottle-250ml', 'Gary B.'], ['maple-syrup-mini-stroopwafel', 'Carol C.']],
  gifts: [['maple-frenzy-home-set', 'Simon S.'], ['pure-maple-syrup-stroopwafels-caddy', 'Yoshimi S.'], ['maple-syrup-mini-stroopwafel', 'Michelle Buchar']],
};
const HEAD = {
  syrup: 'Rated 5.0 by the People Who Pour It',
  gifts: 'Rated 5.0 by the People Who Send It',
};
function review(handle, name) {
  const f = join(ROOT, 'products', `${handle}.html`);
  if (!existsSync(f)) return null;
  const html = readFileSync(f, 'utf8');
  const product = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
  for (const a of html.match(/<article class="mt-review">[\s\S]*?<\/article>/g) || []) {
    const who = (a.match(/class="mt-review-name">([^<]*)/) || [])[1];
    if (who !== name) continue;
    const text = ((a.match(/class="mt-review-text">([\s\S]*?)<\/p>/) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const date = (a.match(/class="mt-review-date">([^<]*)/) || [])[1] || '';
    return { name, text, date, product };
  }
  return null;
}
function reviews(set, where) {
  const picks = (SETS[set] || SETS.syrup).map(([h, n]) => review(h, n)).filter(Boolean);
  if (picks.length < 3) console.warn(`  ${where}: only ${picks.length} of the "${set}" reviews still published on their product pages`);
  const h2 = HEAD[set] || HEAD.syrup;
  const card = (r) => `        <figure class="bg-white rounded-[2rem] p-6 md:p-7 ring-1 ring-warm-gray-200/40 flex flex-col">
          ${STARS}
          <blockquote class="text-charcoal leading-relaxed mt-4 flex-1">&ldquo;${r.text}&rdquo;</blockquote>
          <figcaption class="mt-5 text-sm"><span class="font-medium text-charcoal">${esc(r.name)}</span><span class="text-warm-gray-500"> &middot; Verified purchase &middot; ${esc(r.product)}</span></figcaption>
        </figure>`;
  return `  <section id="reviews" class="scroll-mt-28 py-16 md:py-20 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal tracking-tight leading-tight">${h2}</h2>
        </div>
        <a href="/products" class="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-amber-warm transition-colors duration-300">Shop the full range <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
${picks.map(card).join('\n')}
      </div>
    </div>
  </section>`;
}

// ------------------------------------------------------------ FAMILY
const PHOTO = { src: '/assets/images/story/shawn-lytton.webp', w: 640, h: 800 };
const ALT = 'Shawn Lytton, CEO of Maple Terroir, in front of a shelf of maple syrup and Canadian food gifts';
const CAPTION = 'Shawn Lytton, CEO of Maple Terroir.';
const family = () => `  <section id="family" class="scroll-mt-28 py-16 md:py-24 px-4 md:px-8 border-t border-warm-gray-200/30">
    <div class="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
      <figure class="reveal md:col-span-5 max-w-[420px] w-full mx-auto md:mx-0">
        <img src="${PHOTO.src}" alt="${ALT}" width="${PHOTO.w}" height="${PHOTO.h}" loading="lazy" class="w-full aspect-[4/5] object-cover rounded-[1.5rem]">
        <figcaption class="text-xs text-warm-gray-400 mt-3">${CAPTION}</figcaption>
      </figure>
      <div class="reveal reveal-delay-1 md:col-span-7">
        <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal tracking-tight leading-tight mb-5">Three Generations of One Maple Family.</h2>
        <p class="text-warm-gray-600 leading-relaxed mb-4 max-w-[56ch]">Wayne Lytton, born in Nanaimo, B.C., started Maple Terroir with his wife Kaori in 1978. Their son Shawn runs the company today, and Gavin Lytton packs and ships the online orders from Vancouver.</p>
        <p class="text-warm-gray-600 leading-relaxed mb-8 max-w-[56ch]">When you order from mapleterroir.com, the order goes to that family, and they are the ones who pack it.</p>
        <a href="/story" class="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-amber-warm transition-colors duration-300">Read the family story <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
    </div>
  </section>`;

// ------------------------------------------------------------ bake
const MARK = /<!-- (LOGOS|REVIEWS|FAMILY):START([^>]*?)-->/;
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === '_archive') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const counts = {};
for (const file of walk(ROOT)) {
  const html = readFileSync(file, 'utf8');
  if (!MARK.test(html)) continue;
  const where = relative(ROOT, file);
  let out = '', pos = 0;
  for (let m; (m = MARK.exec(html.slice(pos))); ) {
    const [, kind, attrs] = m;
    const open = pos + m.index, openEnd = open + m[0].length;
    const end = html.indexOf(`<!-- ${kind}:END -->`, openEnd);
    if (end < 0) throw new Error(`${where}: ${kind}:END missing`);
    const set = (attrs.match(/set="([^"]+)"/) || [])[1] || 'syrup';
    const marker = kind === 'REVIEWS' ? `<!-- REVIEWS:START set="${set}" -->` : `<!-- ${kind}:START baked by scripts/build-blocks.mjs -->`;
    const block = kind === 'LOGOS' ? logos() : kind === 'REVIEWS' ? reviews(set, where) : family();
    out += html.slice(pos, open) + marker + '\n' + block + '\n  ';
    pos = end;
    counts[kind] = (counts[kind] || 0) + 1;
  }
  out += html.slice(pos);
  if (out !== html) writeFileSync(file, out);
}
console.log(`blocks baked: ${Object.entries(counts).map(([k, n]) => `${k} on ${n} page${n === 1 ? '' : 's'}`).join(', ') || 'no markers found'}`);
