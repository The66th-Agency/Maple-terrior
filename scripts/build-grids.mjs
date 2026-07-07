// Static product-grid pre-renderer.
//
// Why: the collection pages, /products, and the homepage bento render their
// product links entirely client-side (Storefront API + innerHTML), so the raw
// HTML served to crawlers contained ZERO product links sitewide. Googlebot's
// render queue is a second, delayed, budget-constrained wave, and the 2026-07-07
// audit found 7 of 40 PDPs stale or wrong in Google's index with almost no
// internal link equity. This script bakes real <a href="/products/<handle>">
// cards into each grid at build time. The existing page JS still runs on load
// and replaces the static grid with the live hydrated version (prices, cart),
// so shoppers see exactly what they saw before.
//
// Run:  node scripts/build-grids.mjs   (after any catalog change, alongside build-products.mjs)
// Idempotent: re-running replaces the previously baked cards.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STOREFRONT_URL = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
const STOREFRONT_TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';

// filename -> Shopify collection handle (NOT always the same as the page slug)
const COLLECTION_PAGES = {
  'collections/bestsellers.html': 'bestsellers',
  'collections/chocolates.html': 'chocolates',
  'collections/cookies.html': 'maple-cookies',
  'collections/home-sets.html': 'home-sets',
  'collections/maple-stroopwafels.html': 'stroopwafels',
  'collections/maple-syrup-gift-set.html': 'gift-sets',
  'collections/nuts-snacks.html': 'nuts-popcorn',
  'collections/premium-maple-syrup.html': 'maple-syrup-all',
  'collections/tea-coffee.html': 'tea-coffee',
};

// Mirror of HIDDEN_PRODUCTS in products.html: products deliberately kept out of
// the catalog UI stay out of the static grid too.
const HIDDEN = ['blueberry-ceylon', 'blueberry ceylon', 'blueberry-tea', 'blueberry tea',
  'kettle-chip', 'kettle chip', 'maple kettle', 'chocolates-bare-50', 'chocolate bare 50', 'chocolate-bar-50'];
const isHidden = (p) => {
  const h = (p.handle || '').toLowerCase(), t = (p.title || '').toLowerCase();
  return HIDDEN.some((x) => h.includes(x) || t.includes(x));
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function gql(query, variables) {
  const res = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  return res.json();
}

function card(p) {
  const img = p.images.edges[0] && p.images.edges[0].node;
  const v = p.variants.edges[0] && p.variants.edges[0].node;
  const price = v && v.priceV2 ? parseFloat(v.priceV2.amount).toFixed(2) : '';
  const soldOut = v && !v.availableForSale;
  return '<div class="product-card group">' +
    `<a href="/products/${esc(p.handle)}" class="block">` +
      '<div class="aspect-square rounded-2xl overflow-hidden mb-3 bg-cream-dark ring-1 ring-warm-gray-200/30">' +
        (img ? `<img src="${esc(img.url)}&width=500" alt="${esc(img.altText || p.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy">` : '<div class="w-full h-full bg-cream-dark"></div>') +
      '</div>' +
      `<h3 class="font-medium text-sm text-charcoal mb-1" style="min-height:2.5rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.title)}</h3>` +
    '</a>' +
    '<div class="flex items-center justify-between">' +
      `<p class="text-xs text-warm-gray-500">$${price} CAD</p>` +
      (soldOut ? '<span class="sold-out-badge">Sold Out</span>' : '') +
    '</div>' +
  '</div>';
}

// Replace the inner content of the element opened by `openTag` (balanced-div scan).
function replaceInner(html, openTagRe, inner, label) {
  const m = html.match(openTagRe);
  if (!m) throw new Error(`open tag not found for ${label}`);
  const start = m.index + m[0].length;
  let depth = 1, i = start;
  const token = /<div\b|<\/div>/g;
  token.lastIndex = start;
  let t;
  while ((t = token.exec(html))) {
    depth += t[0] === '</div>' ? -1 : 1;
    if (depth === 0) { i = t.index; break; }
  }
  if (depth !== 0) throw new Error(`unbalanced divs for ${label}`);
  return html.slice(0, start) +
    '\n        <!-- Static crawlable grid baked by scripts/build-grids.mjs; page JS replaces it with the live hydrated version on load. -->\n        ' +
    inner + '\n      ' + html.slice(i);
}

async function main() {
  let pages = 0, links = 0;

  for (const [file, handle] of Object.entries(COLLECTION_PAGES)) {
    const json = await gql(
      'query($handle:String!){collectionByHandle(handle:$handle){products(first:50){edges{node{title handle images(first:1){edges{node{url altText}}} variants(first:1){edges{node{priceV2{amount currencyCode} availableForSale}}}}}}}}',
      { handle }
    );
    const c = json.data && json.data.collectionByHandle;
    if (!c) { console.warn(`SKIP ${file}: collection "${handle}" not found`); continue; }
    const products = c.products.edges.map((e) => e.node).filter((p) => !isHidden(p));
    if (!products.length) { console.warn(`SKIP ${file}: 0 products`); continue; }
    const path = join(ROOT, file);
    let html = await readFile(path, 'utf8');
    html = replaceInner(html, /<div id="product-grid"[^>]*>/, products.map(card).join(''), file);
    await writeFile(path, html, 'utf8');
    pages++; links += products.length;
    console.log(`${file}: ${products.length} static cards (${handle})`);
  }

  // new-arrivals uses a sorted all-products query, not a collection
  {
    const json = await gql('query{ products(first:24, sortKey:CREATED_AT, reverse:true){ edges{ node{ title handle images(first:1){edges{node{url altText}}} variants(first:1){edges{node{priceV2{amount currencyCode} availableForSale}}} } } } }');
    const products = (json.data ? json.data.products.edges : []).map((e) => e.node).filter((p) => !isHidden(p));
    if (products.length) {
      const path = join(ROOT, 'collections/new-arrivals.html');
      let html = await readFile(path, 'utf8');
      html = replaceInner(html, /<div id="product-grid"[^>]*>/, products.map(card).join(''), 'new-arrivals');
      await writeFile(path, html, 'utf8');
      pages++; links += products.length;
      console.log(`collections/new-arrivals.html: ${products.length} static cards`);
    }
  }

  // /products catalog: full flat grid baked into the #categories-loading shell,
  // which the page JS hides once the categorized live view is built.
  {
    const json = await gql('{ products(first: 250) { edges { node { title handle images(first:1){edges{node{url altText}}} variants(first:1){edges{node{priceV2{amount currencyCode} availableForSale}}} } } } }');
    const products = (json.data ? json.data.products.edges : []).map((e) => e.node).filter((p) => !isHidden(p));
    const grid = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">' +
      products.map(card).join('') + '</div>';
    const path = join(ROOT, 'products.html');
    let html = await readFile(path, 'utf8');
    html = replaceInner(html, /<div id="categories-loading"[^>]*>/, grid, 'products.html');
    await writeFile(path, html, 'utf8');
    pages++; links += products.length;
    console.log(`products.html: ${products.length} static cards (full catalog)`);
  }

  console.log(`Done: ${pages} pages, ${links} crawlable product links baked in.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
