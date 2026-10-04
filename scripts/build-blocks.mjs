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
//   <!-- CTA:START title="..." text="..." href="..." label="..." href2="..." label2="..." -->  <!-- CTA:END -->
//     The closing section, last before the footer: the homepage's amber panel
//     (Liam, October 3, 2026: one component reused across all pages, after the
//     site had grown photo, dark, grey and amber closers). Every attribute is
//     optional. A page sets one only when its reader needs a different heading
//     or button, as a city page or the press page does; left out, the page gets
//     the homepage's copy. href2 and label2 add a quieter second button. Inside
//     an attribute, write < > and " as &lt; &gt; and &quot;, so a link in the
//     text survives.
//
// Usage: node scripts/build-blocks.mjs [page.html ...]   (no files: every page)
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
import { join, dirname, relative, resolve } from 'node:path';
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
  // The collections of things people eat rather than pour or send: cookies,
  // chocolates, snacks, stroopwafels, tea and coffee (October 3, 2026).
  treats: [['maple-leaf-mini-shortbread-cookies', 'Rowena A.'], ['handcrafted-pure-maple-syrup-butter-popcorn', 'Chris'], ['cocoa-chocolate-maple-stroopwafels-caddy', 'Kiko W.']],
};
const HEAD = {
  syrup: 'Rated 5.0 by the People Who Pour It',
  gifts: 'Rated 5.0 by the People Who Send It',
  treats: 'Rated 5.0 by the People Who Snack on It',
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
    // The product photo sits beside the quote (Liam, 2026-10-03: the text-only
    // cards had "no design taste or visuals").
    const img = ((html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '').replace(/&amp;width=\d+/, '');
    return { name, text, date, product, img, href: `/products/${handle}` };
  }
  return null;
}
// A Shopify image is resized by the CDN; a card image of our own is served as is.
const sizedImg = (url, w) => /cdn\.shopify\.com/.test(url) ? `${url}${url.includes('?') ? '&amp;' : '?'}width=${w}` : url.replace('https://mapleterroir.com', '');
function reviews(set, where) {
  const picks = (SETS[set] || SETS.syrup).map(([h, n]) => review(h, n)).filter(Boolean);
  if (picks.length < 3) console.warn(`  ${where}: only ${picks.length} of the "${set}" reviews still published on their product pages`);
  const h2 = HEAD[set] || HEAD.syrup;
  const caption = (r) => `<figcaption class="mt-5 text-sm"><span class="font-medium text-charcoal">${esc(r.name)}</span><span class="text-warm-gray-500"> &middot; Verified purchase &middot; </span><a href="${r.href}" class="text-warm-gray-600 underline decoration-warm-gray-300 underline-offset-4 hover:text-amber-warm">${esc(r.product)}</a></figcaption>`;
  const [lead, ...rest] = picks;
  const big = lead ? `        <figure class="reveal group lg:col-span-7 lg:row-span-2 rounded-[2rem] overflow-hidden grid grid-cols-1 sm:grid-cols-2" style="background:#F3E6CF">
          <a href="${lead.href}" class="relative flex items-center justify-center p-8 md:p-10 min-h-[260px]" tabindex="-1" aria-hidden="true">
            <span class="absolute inset-6 rounded-full bg-white/50 blur-2xl"></span>
            <img src="${sizedImg(lead.img, 700)}" alt="" width="700" height="700" loading="lazy" class="relative w-full max-w-[320px] aspect-square object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2">
          </a>
          <div class="p-7 md:p-10 flex flex-col justify-center">
            ${STARS}
            <blockquote class="font-display text-2xl md:text-[1.7rem] leading-snug text-charcoal mt-5">&ldquo;${lead.text}&rdquo;</blockquote>
            ${caption(lead)}
          </div>
        </figure>` : '';
  const small = (r, i) => `        <figure class="reveal reveal-delay-${i + 1} group lg:col-span-5 bg-white rounded-[2rem] ring-1 ring-warm-gray-200/40 p-5 md:p-6 flex gap-5 items-center">
          <a href="${r.href}" class="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-[1.25rem] overflow-hidden flex items-center justify-center" style="background:#F5F0E8" tabindex="-1" aria-hidden="true"><img src="${sizedImg(r.img, 300)}" alt="" width="300" height="300" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"></a>
          <div class="flex flex-col">
            ${STARS}
            <blockquote class="text-charcoal leading-relaxed mt-3">&ldquo;${r.text}&rdquo;</blockquote>
            ${caption(r)}
          </div>
        </figure>`;
  return `  <section id="reviews" class="scroll-mt-28 py-16 md:py-24 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
        <div>
          <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal tracking-tight leading-tight">${h2}</h2>
        </div>
        <a href="/products" class="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-amber-warm transition-colors duration-300">Shop the full range <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
${[big, ...rest.map(small)].filter(Boolean).join('\n')}
      </div>
    </div>
  </section>`;
}

// ------------------------------------------------------------ FAMILY
const PHOTO = { src: '/assets/images/story/shawn-lytton.webp', w: 640, h: 800 };
const ALT = 'Shawn Lytton, CEO of Maple Terroir, in front of a shelf of maple syrup and Canadian food gifts';
const CAPTION = 'Shawn Lytton, CEO of Maple Terroir.';
const family = (where) => `  <section id="family" class="scroll-mt-28 py-16 md:py-24 px-4 md:px-8 border-t border-warm-gray-200/30">
    <div class="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
      <figure class="reveal md:col-span-5 max-w-[420px] w-full mx-auto md:mx-0">
        <img src="${PHOTO.src}" alt="${ALT}" width="${PHOTO.w}" height="${PHOTO.h}" loading="lazy" class="w-full aspect-[4/5] object-cover rounded-[1.5rem]">
        <figcaption class="text-xs text-warm-gray-400 mt-3">${CAPTION}</figcaption>
      </figure>
      <div class="reveal reveal-delay-1 md:col-span-7">
        <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal tracking-tight leading-tight mb-5">Three Generations of One Maple Family.</h2>
        <p class="text-warm-gray-600 leading-relaxed mb-4 max-w-[56ch]">Wayne Lytton, born in Nanaimo, B.C., started Maple Terroir with his wife Kaori in 1978. Their son Shawn runs the company today, and Gavin Lytton packs and ships the online orders from Vancouver.</p>
        <p class="text-warm-gray-600 leading-relaxed mb-8 max-w-[56ch]">When you order from mapleterroir.com, the order goes to that family, and they are the ones who pack it.</p>
${where === 'story.html' ? '' : `        <a href="/story" class="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-amber-warm transition-colors duration-300">Read the family story <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`}
      </div>
    </div>
  </section>`;

// ------------------------------------------------------------ bake
// ------------------------------------------------------------ CTA
const CTA_DEFAULT = {
  title: 'Order straight from our family.',
  text: 'Orders of $99 CAD or more ship free. Standard delivery takes 3 to 9 business days, and Express takes 1 to 2 business days for $39.99.',
  href: '/products',
  label: 'Shop All Products',
};
const attr = (attrs, k) => {
  const m = attrs.match(new RegExp(`\\b${k}="([^"]*)"`));
  return m ? m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : null;
};
const cta = (attrs) => {
  const c = Object.fromEntries(Object.entries(CTA_DEFAULT).map(([k, v]) => [k, attr(attrs, k) ?? v]));
  const href2 = attr(attrs, 'href2'), label2 = attr(attrs, 'label2');
  const second = href2 && label2 ? `
                <a href="${href2}" class="btn-premium inline-flex items-center gap-3 bg-white/10 border border-white/25 text-cream rounded-full px-8 py-4 text-sm font-medium hover:bg-white/15">${label2}</a>` : '';
  return `  <section class="pb-24 md:pb-40 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto">
      <div class="reveal">
        <div class="bg-warm-gray-100/50 ring-1 ring-warm-gray-200/30 p-2 md:p-2.5 rounded-[2rem] md:rounded-[2.5rem]">
          <div class="relative overflow-hidden rounded-[calc(2rem-0.5rem)] md:rounded-[calc(2.5rem-0.625rem)] bg-gradient-to-br from-amber-warm via-amber-deep to-charcoal p-10 md:p-16 lg:p-20 text-center text-cream min-h-[320px] flex flex-col items-center justify-center">
            <div class="relative">
              <h2 class="font-display text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 max-w-[20ch] mx-auto">${c.title}</h2>
              <p class="text-base md:text-lg text-cream/75 leading-relaxed max-w-[45ch] mx-auto mb-10 [&_a]:underline [&_a]:underline-offset-4">${c.text}</p>
              <div class="flex flex-wrap gap-3 justify-center">
                <a href="${c.href}" class="btn-premium inline-flex items-center gap-3 bg-cream text-charcoal rounded-full px-8 py-4 text-sm font-semibold group">
                  <span>${c.label}</span>
                  <span class="w-7 h-7 rounded-full bg-charcoal/[0.08] flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110 group-hover:bg-charcoal/15">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                </a>${second}
              </div>
            </div>
            <div class="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] rounded-[inherit] pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
};

const MARK = /<!-- (LOGOS|REVIEWS|FAMILY|CTA):START([^>]*?)-->/;
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === '_archive') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const counts = {};
const only = process.argv.slice(2).filter((a) => a.endsWith('.html')).map((a) => resolve(a));
for (const file of only.length ? only : walk(ROOT)) {
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
    const marker = kind === 'REVIEWS' ? `<!-- REVIEWS:START set="${set}" -->` : kind === 'CTA' ? `<!-- CTA:START${attrs.trimEnd() ? attrs.trimEnd() + ' ' : ' '}-->` : `<!-- ${kind}:START baked by scripts/build-blocks.mjs -->`;
    const block = kind === 'LOGOS' ? logos() : kind === 'REVIEWS' ? reviews(set, where) : kind === 'CTA' ? cta(attrs) : family(where);
    out += html.slice(pos, open) + marker + '\n' + block + '\n  ';
    pos = end;
    counts[kind] = (counts[kind] || 0) + 1;
  }
  out += html.slice(pos);
  if (out !== html) writeFileSync(file, out);
}
console.log(`blocks baked: ${Object.entries(counts).map(([k, n]) => `${k} on ${n} page${n === 1 ? '' : 's'}`).join(', ') || 'no markers found'}`);
