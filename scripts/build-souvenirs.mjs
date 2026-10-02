// Bakes the product shelf on /canadian-souvenirs.
//
// Why: until 2026-10-02 the souvenirs page described maple gifts in four text
// tiles and showed no product at all, so a visitor searching "canadian
// souvenirs" had to click away to buy. This writes real Shopify products into
// the page as plain HTML, so the cards are crawlable and shoppable on first
// paint. The page JS then re-checks price and stock live and greys out any
// product that has sold out since the bake.
//
// The shelf is curated, not a collection: CURATED below is the list, in order,
// with the filter tags each product answers to. Sold-out products are skipped at
// bake time. Re-run after changing the list or when a product comes back in stock.
//
// Run: node scripts/build-souvenirs.mjs   (idempotent; rewrites only the marked blocks)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'canadian-souvenirs.html');
const STOREFRONT_URL = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
const STOREFRONT_TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';

// Tags: top = Top picks, syrup = Maple syrup, carry = solid food CATSA allows in a
// carry-on (catsa-acsta.gc.ca, checked 2026-10-02; syrup, spreads and gift sets
// that hold syrup are NOT carry), under10 = $10 or less, gift = boxed sets.
const CURATED = [
  ['pure-maple-syrup-maple-leaf-bottle-250ml', 'top syrup'],
  ['organic-pure-maple-syrup-250ml', 'top syrup'],
  ['maple-leaf-mini-shortbread-cookies', 'top carry under10'],
  ['maple-syrup-stroopwafel', 'top carry under10'],
  ['maple-extravaganza-gift-set', 'top gift'],
  ['dark-chocolate-covered-cherry-pure-maple-syrup', 'top carry under10'],
  ['organic-first-tap-nouveau-limited-edition-pure-maple-syrup-limited-edition', 'top syrup'],
  ['organic-maple-cream-butter-jar', 'top syrup'],
  ['organic-pure-maple-sugar', 'syrup under10'],
  ['maple-syrup-mini-stroopwafel', 'carry under10'],
  ['dark-chocolate-covered-blueberry-pure-maple-syrup', 'carry under10'],
  ['cocoa-dark-chocolate-covered-maple-roasted-almonds', 'carry under10'],
  ['maple-ceylon-tea', 'carry under10'],
  ['maple-syrup-sea-salt-roasted-peanuts', 'carry under10'],
  ['handcrafted-pure-maple-syrup-butter-popcorn', 'carry under10'],
  ['maple-treat-home-set', 'gift'],
  ['maple-tea-party-home-set', 'gift'],
  ['maple-enthusiast-home-set', 'gift'],
  ['maple-mega-combo-gift-set', 'gift'],
];

// The three products in the hero, with the label and the photo each one gets.
const HERO = [
  { handle: 'pure-maple-syrup-maple-leaf-bottle-250ml', label: 'The classic', big: true },
  { handle: 'maple-extravaganza-gift-set', label: 'Ready to give' },
  { handle: 'maple-leaf-mini-shortbread-cookies', label: 'Fits in a carry-on', image: 'https://cdn.shopify.com/s/files/1/0636/0763/6217/files/mapleshortbread3boxes.png?v=1749671632' },
];

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sized = (url, w) => url + (url.includes('?') ? '&' : '?') + 'width=' + w;

async function gql(query, variables) {
  const res = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  return res.json();
}

// "250ml x 1" -> "250 mL", "113g x 1" -> "113 g", "Default Title" -> ""
function size(variantTitle) {
  const m = String(variantTitle || '').match(/^(\d+)\s*(ml|g)\b/i);
  return m ? `${m[1]} ${m[2].toLowerCase() === 'ml' ? 'mL' : 'g'}` : '';
}

const button = (p) => `<button class="atc-btn" data-variant-id="${esc(p.variant.id)}" onclick="MapleCart.addFromBtn(this)" aria-label="Add ${esc(p.title)} to cart">+ Add</button>`;

function card(p) {
  const carry = /\bcarry\b/.test(p.tags);
  return `<article class="product-card ring-1 ring-warm-gray-200/30 flex flex-col" data-tags="${esc(p.tags)}">` +
    `<a href="/products/${esc(p.handle)}" class="sv-media block relative aspect-square overflow-hidden bg-white" tabindex="-1" aria-hidden="true">` +
      `<img src="${esc(sized(p.image, 600))}" alt="" class="w-full h-full object-cover" loading="lazy" width="600" height="600">` +
      (carry ? '<span class="sv-chip">Carry-on friendly</span>' : '') +
    '</a>' +
    '<div class="p-4 md:p-5 flex flex-col flex-1">' +
      `<h3 class="font-display text-[15px] md:text-base font-semibold text-charcoal leading-snug sv-title"><a href="/products/${esc(p.handle)}" class="hover:text-amber-warm transition-colors">${esc(p.title)}</a></h3>` +
      `<p class="text-xs text-warm-gray-400 mt-1 min-h-[1rem]">${esc(p.size)}</p>` +
      '<div class="mt-auto pt-3 flex items-center justify-between gap-2 flex-wrap">' +
        `<p class="text-sm font-medium text-charcoal" data-price>$${p.price} CAD</p>` + button(p) +
      '</div>' +
    '</div>' +
  '</article>';
}

function heroTile(p, h) {
  const img = h.image || p.image;
  // Product shots sit on white, so object-contain on a white box reads as one
  // surface at any aspect. The big tile fills the bento's full height on desktop.
  return `<article class="product-card ring-1 ring-warm-gray-200/30 flex flex-col${h.big ? ' col-span-2 md:row-span-2' : ''}">` +
    `<a href="/products/${esc(p.handle)}" class="block relative bg-white aspect-[4/3]${h.big ? ' md:aspect-auto md:flex-1' : ''}" tabindex="-1" aria-hidden="true">` +
      `<img src="${esc(sized(img, h.big ? 900 : 600))}" alt="" class="absolute inset-0 w-full h-full object-contain ${h.big ? 'p-6' : 'p-3 pt-11'}" width="${h.big ? 900 : 600}" height="${h.big ? 900 : 600}"${h.big ? ' fetchpriority="high"' : ''}>` +
      `<span class="sv-label">${esc(h.label)}</span>` +
    '</a>' +
    `<div class="p-4${h.big ? ' md:p-6' : ''}">` +
      `<p class="font-display ${h.big ? 'text-lg md:text-xl' : 'text-[15px]'} font-semibold text-charcoal leading-snug sv-title"><a href="/products/${esc(p.handle)}" class="hover:text-amber-warm transition-colors">${esc(p.title)}</a></p>` +
      '<div class="mt-3 flex items-center justify-between gap-2 flex-wrap">' +
        `<p class="text-sm font-medium text-charcoal" data-price>$${p.price} CAD</p>` + button(p) +
      '</div>' +
    '</div>' +
  '</article>';
}

function itemList(products) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Canadian souvenirs from Maple Terroir',
    url: 'https://mapleterroir.com/canadian-souvenirs',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem', position: i + 1, name: p.title, url: `https://mapleterroir.com/products/${p.handle}`,
    })),
  };
  return '<!-- itemlist:start (baked by scripts/build-souvenirs.mjs) -->\n  <script type="application/ld+json">' +
    JSON.stringify(json) + '</' + 'script>\n  <!-- itemlist:end -->';
}

function between(html, name, inner) {
  const a = `<!-- ${name}:START baked by scripts/build-souvenirs.mjs -->`, b = `<!-- ${name}:END -->`;
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i < 0 || j < i) throw new Error(`canadian-souvenirs.html: markers for ${name} not found`);
  return html.slice(0, i + a.length) + '\n' + inner + '\n' + html.slice(j);
}

async function main() {
  const q = 'query($h:String!){productByHandle(handle:$h){title handle availableForSale images(first:1){edges{node{url}}} variants(first:1){edges{node{id title availableForSale price{amount}}}}}}';
  const all = [];
  for (const [handle, tags] of CURATED) {
    const r = await gql(q, { h: handle });
    const p = r.data && r.data.productByHandle;
    const v = p && p.variants.edges[0] && p.variants.edges[0].node;
    if (!p || !v) { console.warn(`SKIP ${handle}: not found`); continue; }
    if (!v.availableForSale) { console.warn(`SKIP ${handle}: sold out`); continue; }
    all.push({
      handle, tags, title: p.title, variant: v, size: size(v.title),
      price: parseFloat(v.price.amount).toFixed(2),
      image: p.images.edges[0] ? p.images.edges[0].node.url : '',
    });
  }
  const byHandle = Object.fromEntries(all.map((p) => [p.handle, p]));
  const hero = HERO.filter((h) => byHandle[h.handle]).map((h) => heroTile(byHandle[h.handle], h)).join('\n');

  let html = await readFile(PAGE, 'utf8');
  html = between(html, 'SOUVENIR-HERO', hero);
  html = between(html, 'SOUVENIR-GRID', all.map(card).join('\n'));
  html = html.replace(/<!-- itemlist:start[\s\S]*?<!-- itemlist:end -->/, itemList(all));
  await writeFile(PAGE, html, 'utf8');
  const count = (t) => all.filter((p) => p.tags.split(' ').includes(t)).length;
  console.log(`canadian-souvenirs.html: ${all.length} products baked (top ${count('top')}, syrup ${count('syrup')}, carry ${count('carry')}, under10 ${count('under10')}, gift ${count('gift')}), ${HERO.length} hero tiles`);
}

main().catch((e) => { console.error(e); process.exit(1); });
