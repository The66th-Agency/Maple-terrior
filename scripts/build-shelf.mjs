// Bakes a shelf of real products into any page that asks for one.
//
// Why: the Canada location pages each answer a different search (gift baskets,
// souvenirs, maple syrup, corporate gifts, stroopwafels in one city), so each
// shows the products that answer it, as plain HTML that Google can read and a
// shopper can add to the cart on first paint. The older city pages fill their
// syrup grid with JavaScript, which a crawler may never see.
//
// A page asks for a shelf with a marker pair naming Shopify product handles, in
// the order they should appear:
//   <!-- SHELF:START handles="maple-extravaganza-gift-set,maple-treat-home-set" -->
//   <!-- SHELF:END -->
// Products sold out at bake time are left off. A small script inside the shelf
// re-checks price and stock live and greys out anything that sold out since.
// The page must carry the site's cart (MapleCart.addFromBtn) and .product-card
// and .atc-btn styles, which every page scaffolded from a city page does.
//
// Run: node scripts/build-shelf.mjs   (idempotent; rewrites only the marked blocks)

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STOREFRONT_URL = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
const STOREFRONT_TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';
const OPEN = /<!-- SHELF:START handles="([^"]+)"[^>]*-->/;
const END = '<!-- SHELF:END -->';

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sized = (url, w) => url + (url.includes('?') ? '&' : '?') + 'width=' + w;
const size = (t) => { const m = String(t || '').match(/^(\d+)\s*(ml|g)\b/i); return m ? `${m[1]} ${m[2].toLowerCase() === 'ml' ? 'mL' : 'g'}` : ''; };

async function product(handle) {
  const q = 'query($h:String!){productByHandle(handle:$h){title handle images(first:1){edges{node{url}}} variants(first:1){edges{node{id title availableForSale price{amount}}}}}}';
  const r = await fetch(STOREFRONT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN }, body: JSON.stringify({ query: q, variables: { h: handle } }) }).then((x) => x.json());
  const p = r.data && r.data.productByHandle;
  const v = p && p.variants.edges[0] && p.variants.edges[0].node;
  if (!p || !v) return { handle, missing: true };
  return { handle, title: p.title, image: p.images.edges[0] ? p.images.edges[0].node.url : '', variant: v, size: size(v.title), price: parseFloat(v.price.amount).toFixed(2), soldOut: !v.availableForSale };
}

const card = (p) => `<article class="product-card ring-1 ring-warm-gray-200/30 flex flex-col">` +
  `<a href="/products/${esc(p.handle)}" class="block relative aspect-square overflow-hidden bg-white" tabindex="-1" aria-hidden="true">` +
    `<img src="${esc(sized(p.image, 600))}" alt="" class="w-full h-full object-cover" loading="lazy" width="600" height="600">` +
  '</a>' +
  '<div class="p-4 md:p-5 flex flex-col flex-1">' +
    `<h3 class="font-display text-[15px] md:text-base font-semibold text-charcoal leading-snug"><a href="/products/${esc(p.handle)}" class="hover:text-amber-warm transition-colors">${esc(p.title)}</a></h3>` +
    `<p class="text-xs text-warm-gray-400 mt-1 min-h-[1rem]">${esc(p.size)}</p>` +
    '<div class="mt-auto pt-3 flex items-center justify-between gap-2 flex-wrap">' +
      `<p class="text-sm font-medium text-charcoal" data-price>$${p.price} CAD</p>` +
      `<button class="atc-btn" data-variant-id="${esc(p.variant.id)}" onclick="MapleCart.addFromBtn(this)" aria-label="Add ${esc(p.title)} to cart">+ Add</button>` +
    '</div>' +
  '</div>' +
'</article>';

// Runs once per page however many shelves it has.
const LIVE = `<script>
      (function () {
        if (window.__mtShelfLive) return; window.__mtShelfLive = true;
        var btns = [].slice.call(document.querySelectorAll('[data-shelf] .atc-btn[data-variant-id]'));
        var ids = btns.map(function (b) { return b.getAttribute('data-variant-id'); }).filter(function (id, i, a) { return a.indexOf(id) === i; });
        if (!ids.length) return;
        fetch('${STOREFRONT_URL}', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': '${STOREFRONT_TOKEN}' }, body: JSON.stringify({ query: 'query($ids:[ID!]!){nodes(ids:$ids){... on ProductVariant{id availableForSale price{amount}}}}', variables: { ids: ids } }) })
          .then(function (r) { return r.json(); }).then(function (r) {
            var by = {}; ((r.data && r.data.nodes) || []).forEach(function (n) { if (n) by[n.id] = n; });
            btns.forEach(function (b) {
              var n = by[b.getAttribute('data-variant-id')]; if (!n) return;
              var pe = b.closest('article') && b.closest('article').querySelector('[data-price]');
              if (pe && n.price) pe.textContent = '$' + parseFloat(n.price.amount).toFixed(2) + ' CAD';
              if (!n.availableForSale) { b.disabled = true; b.removeAttribute('onclick'); b.textContent = 'Sold out'; }
            });
          }).catch(function () {});
      })();
    </script>`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules' || name === '_archive') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const cache = new Map();
let pages = 0;
// Usage: node scripts/build-shelf.mjs [page.html ...]   (no files: every page)
const only = process.argv.slice(2).filter((a) => a.endsWith('.html')).map((a) => resolve(a));
for (const file of only.length ? only : walk(ROOT)) {
  let html = readFileSync(file, 'utf8');
  if (!OPEN.test(html)) continue;
  let pos = 0, out = '';
  for (let m; (m = OPEN.exec(html.slice(pos))); ) {
    const start = pos + m.index, openEnd = start + m[0].length;
    const close = html.indexOf(END, openEnd);
    if (close < 0) throw new Error(`${relative(ROOT, file)}: SHELF:END missing`);
    const handles = m[1].split(',').map((h) => h.trim()).filter(Boolean);
    const items = [];
    for (const h of handles) {
      if (!cache.has(h)) cache.set(h, await product(h));
      const p = cache.get(h);
      if (p.missing) console.warn(`  ${relative(ROOT, file)}: ${h} not found in Shopify, left off`);
      else if (p.soldOut) console.warn(`  ${relative(ROOT, file)}: ${h} is sold out, left off`);
      else items.push(p);
    }
    if (items.length < 3) console.warn(`  ${relative(ROOT, file)}: only ${items.length} products in stock on this shelf`);
    // Columns follow the count so no card sits alone on the last row (Liam saw a
    // fifth card stranded under a row of four on 2026-10-02).
    const n = items.length, cols = n <= 5 ? n : n % 4 === 0 ? 4 : n % 3 === 0 ? 3 : 4;
    const inner = `\n      <div data-shelf class="grid grid-cols-2 ${({ 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' })[cols]} gap-3 md:gap-5">\n${items.map((p) => '        ' + card(p)).join('\n')}\n      </div>\n      ${LIVE}\n      `;
    out += html.slice(pos, openEnd) + inner;
    pos = close;
  }
  out += html.slice(pos);
  if (out !== html) writeFileSync(file, out);
  pages++;
}
console.log(`shelves baked on ${pages} page${pages === 1 ? '' : 's'}`);
