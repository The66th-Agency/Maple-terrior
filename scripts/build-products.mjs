// Static product-page generator.
//
// Why: mapleterroir.com is a Cloudflare Worker serving static assets, so Pages
// Functions do NOT run and there is no edge renderer. To give Google a unique,
// fully-formed page per product (instead of one client-rendered shell that caused
// the "Crawled, currently not indexed" drop), we pre-render one static HTML file
// per product from the product.html template, with unique <title>, meta, canonical,
// OG/Twitter, JSON-LD, and the product name + description baked into the body. The
// client JS still hydrates the gallery/variants/cart with live Shopify data on load.
//
// Run:  node scripts/build-products.mjs
// Output: products/<handle>.html  (served at /products/<handle>)
// Re-run whenever the catalog changes (new products, renamed handles, copy edits).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STOREFRONT_URL = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
const STOREFRONT_TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';
const SITE = 'https://mapleterroir.com';

const ALL_PRODUCTS_QUERY = `{
  products(first: 250) {
    edges { node {
      id title handle description descriptionHtml productType vendor
      images(first: 1) { edges { node { url altText } } }
      variants(first: 1) { edges { node { sku barcode priceV2 { amount currencyCode } availableForSale } } }
    } }
  }
}`;

const escAttr = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escText = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const widthUrl = (u, w) => (!u ? '' : u + (u.indexOf('?') === -1 ? '?' : '&') + 'width=' + w);

// Make the root-relative template work one directory deep (/products/<handle>).
function absolutize(html) {
  return html.replace(
    /(href|src)="(?!https?:\/\/|\/\/|\/|#|mailto:|tel:|data:|javascript:)([^"]*)"/g,
    (_, attr, path) => `${attr}="/${path}"`
  );
}

function renderProduct(template, p) {
  const handle = p.handle;
  const canonical = `${SITE}/products/${handle}`;
  const title = `${p.title} | Maple Terroir`;
  let desc = (p.description || '').replace(/\s+/g, ' ').trim().slice(0, 155);
  if (!desc) desc = `${p.title} from Maple Terroir. Single-origin Quebec maple, family-owned since 1978.`;

  const imgNode = p.images.edges[0] && p.images.edges[0].node;
  const image = imgNode ? widthUrl(imgNode.url, 1200) : '';
  const variant = p.variants.edges[0] && p.variants.edges[0].node;
  const price = variant && variant.priceV2 ? variant.priceV2.amount : null;
  const currency = variant && variant.priceV2 ? variant.priceV2.currencyCode : 'CAD';
  const availability = variant && variant.availableForSale
    ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const sku = variant && variant.sku ? String(variant.sku).trim() : '';
  const barcode = variant && variant.barcode ? String(variant.barcode).trim() : '';
  // priceValidUntil one year out keeps the Offer eligible for product rich results.
  const priceValidUntil = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  // Full, clean description for schema; meta/OG stay capped at 155 chars (desc, above).
  const ldDesc = ((p.description || '').replace(/\s+/g, ' ').trim() || desc).slice(0, 5000);

  const ld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.title, description: ldDesc,
    brand: { '@type': 'Brand', name: 'Maple Terroir' }, url: canonical,
  };
  if (image) ld.image = image;
  if (p.productType) ld.category = p.productType;
  if (sku) { ld.sku = sku; ld.mpn = sku; }
  if (barcode) ld.gtin = barcode;
  if (price) ld.offers = {
    '@type': 'Offer', price, priceCurrency: currency, availability, url: canonical,
    itemCondition: 'https://schema.org/NewCondition', priceValidUntil,
  };

  const headInject =
    `<link rel="canonical" href="${escAttr(canonical)}">` +
    `<meta property="og:type" content="product">` +
    `<meta property="og:url" content="${escAttr(canonical)}">` +
    `<meta property="og:title" content="${escAttr(title)}">` +
    `<meta property="og:description" content="${escAttr(desc)}">` +
    (image ? `<meta property="og:image" content="${escAttr(image)}">` : '') +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:title" content="${escAttr(title)}">` +
    `<meta name="twitter:description" content="${escAttr(desc)}">` +
    (image ? `<meta name="twitter:image" content="${escAttr(image)}">` : '') +
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>` +
    `<script>window.__PRODUCT_HANDLE__=${JSON.stringify(handle)};</script>\n`;

  const descHtml = p.descriptionHtml || `<p>${escText(p.description || '')}</p>`;

  let html = absolutize(template);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${escAttr(desc)}$2`);
  html = html.replace('</head>', headInject + '</head>');
  html = html.replace(
    /(<span id="breadcrumb-title"[^>]*>)[\s\S]*?(<\/span>)/,
    `$1${escText(p.title)}$2`
  );
  html = html.replace(
    /(<h1 id="product-title"[^>]*>)[\s\S]*?(<\/h1>)/,
    `$1${escText(p.title)}$2`
  );
  html = html.replace(
    /(<div class="pdp-acc-inner" id="product-desc">)\s*<div class="skeleton"[^>]*><\/div>\s*(<\/div>)/,
    `$1${descHtml}$2`
  );
  return html;
}

async function main() {
  const template = await readFile(join(ROOT, 'product.html'), 'utf8');

  const res = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
    body: JSON.stringify({ query: ALL_PRODUCTS_QUERY }),
  });
  const json = await res.json();
  const products = (json.data && json.data.products.edges || []).map((e) => e.node);
  if (!products.length) throw new Error('No products returned from Shopify');

  await mkdir(join(ROOT, 'products'), { recursive: true });
  let count = 0;
  for (const p of products) {
    if (!p.handle) continue;
    const html = renderProduct(template, p);
    await writeFile(join(ROOT, 'products', `${p.handle}.html`), html, 'utf8');
    count++;
  }
  console.log(`Generated ${count} product pages into products/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
