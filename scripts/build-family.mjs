// Bakes the family section into every page that carries its markers.
//
// Why: Liam asked on 2026-10-02 for the family on the city landing pages, so a
// shopper in Winnipeg or Calgary sees the people behind the bottle, the way a
// small business shows itself. The section lives here and nowhere else, so a new
// photo or a changed line is one edit and one run.
//
// A page opts in with the marker pair, placed where the section should sit:
//   <!-- FAMILY:START baked by scripts/build-family.mjs -->
//   <!-- FAMILY:END -->
//
// Facts, checked 2026-10-02: Wayne Lytton, born in Nanaimo, founded the company
// with his wife Kaori in 1978, and the brand describes itself as three generations
// (the old Shopify About page, maple-terroir.myshopify.com/pages/about). Shawn
// Lytton is CEO (same page). Gavin Lytton fulfils orders from the Vancouver
// location at 9291 Shaughnessy Street (Shopify order timelines, e.g. #2020-MT).
// The photo is Shawn, from the old About page (shawn-lytton-2.jpg), cropped to
// keep another company's packaging out of frame. When the family group photo
// arrives, replace PHOTO and ALT below and re-run.
//
// Run: node scripts/build-family.mjs   (idempotent; rewrites only the marked blocks)

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- FAMILY:START baked by scripts/build-family.mjs -->';
const END = '<!-- FAMILY:END -->';
const PHOTO = { src: '/assets/images/story/shawn-lytton.webp', w: 640, h: 800 };
const ALT = 'Shawn Lytton, CEO of Maple Terroir, in front of a shelf of maple syrup and Canadian food gifts';
const CAPTION = 'Shawn Lytton, CEO of Maple Terroir.';

const BLOCK = `  <section id="family" class="scroll-mt-28 py-16 md:py-24 px-4 md:px-8 border-t border-warm-gray-200/30">
    <div class="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
      <figure class="reveal md:col-span-5 max-w-[420px] w-full mx-auto md:mx-0">
        <img src="${PHOTO.src}" alt="${ALT}" width="${PHOTO.w}" height="${PHOTO.h}" loading="lazy" class="w-full aspect-[4/5] object-cover rounded-[1.5rem]">
        <figcaption class="text-xs text-warm-gray-400 mt-3">${CAPTION}</figcaption>
      </figure>
      <div class="reveal reveal-delay-1 md:col-span-7">
        <span class="eyebrow text-amber-warm mb-4 block">A Family Business</span>
        <h2 class="font-display text-3xl md:text-4xl font-semibold text-charcoal tracking-tight leading-tight mb-5">Three Generations of One Maple Family.</h2>
        <p class="text-warm-gray-600 leading-relaxed mb-4 max-w-[56ch]">Wayne Lytton, born in Nanaimo, B.C., started Maple Terroir with his wife Kaori in 1978. Their son Shawn runs the company today, and Gavin Lytton packs and ships the online orders from Vancouver.</p>
        <p class="text-warm-gray-600 leading-relaxed mb-8 max-w-[56ch]">When you order from mapleterroir.com, the order goes to that family, and they are the ones who pack it.</p>
        <a href="/story" class="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-amber-warm transition-colors duration-300">Read the family story <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
    </div>
  </section>`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === '_archive') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

let n = 0;
for (const file of walk(ROOT)) {
  const html = readFileSync(file, 'utf8');
  const i = html.indexOf(START), j = html.indexOf(END);
  if (i < 0) continue;
  if (j < i) throw new Error(`${relative(ROOT, file)}: FAMILY:END missing after FAMILY:START`);
  const next = html.slice(0, i + START.length) + '\n' + BLOCK + '\n  ' + html.slice(j);
  if (next !== html) writeFileSync(file, next);
  n++;
}
console.log(`family section baked into ${n} page${n === 1 ? '' : 's'}`);
