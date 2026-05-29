// Cloudflare Pages Function: server-render product pages at /products/<handle>.
//
// Why this exists: the original build served every product from a single
// client-rendered template (product.html). Googlebot saw identical generic HTML
// for all ~40 products (same <title>, no canonical, no product copy until JS ran),
// so it crawled them and refused to index them ("Crawled, currently not indexed").
//
// This Function fetches the product from the Shopify Storefront API on the edge and
// injects a unique <title>, meta description, canonical, OG/Twitter tags, JSON-LD
// Product schema, and the product name + description into the template BEFORE it
// reaches the browser. The existing client JS still hydrates the interactive UI
// (gallery, variants, add-to-cart) on top.

const STOREFRONT_URL = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
const STOREFRONT_TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';
const SITE = 'https://mapleterroir.com';

const PRODUCT_QUERY =
  'query($handle:String!){ productByHandle(handle:$handle){ id title handle description descriptionHtml productType vendor images(first:1){edges{node{url altText}}} variants(first:1){edges{node{priceV2{amount currencyCode} availableForSale}}} } }';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function widthUrl(u, w) {
  if (!u) return '';
  return u + (u.indexOf('?') === -1 ? '?' : '&') + 'width=' + w;
}

export async function onRequest(context) {
  const { params, request, env } = context;
  const url = new URL(request.url);
  const handle = String(params.handle || '').toLowerCase();

  // Defensive: only real-looking handles. Anything else gets the real 404.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(handle)) {
    const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url), request));
    return new Response(nf.body, { status: 404, headers: nf.headers });
  }

  // Fetch the product server-side.
  let product = null;
  try {
    const r = await fetch(STOREFRONT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: PRODUCT_QUERY, variables: { handle } }),
    });
    const j = await r.json();
    product = j && j.data && j.data.productByHandle;
  } catch (e) {
    product = null;
  }

  // Unknown handle -> serve the real 404 page with a 404 status.
  if (!product) {
    const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url), request));
    return new Response(nf.body, { status: 404, headers: nf.headers });
  }

  // Load the client template to enhance.
  const templateRes = await env.ASSETS.fetch(new Request(new URL('/product.html', url), request));

  const canonical = SITE + '/products/' + handle;
  const title = product.title + ' | Maple Terroir';
  let desc = (product.description || '').replace(/\s+/g, ' ').trim().slice(0, 155);
  if (!desc) desc = product.title + ' from Maple Terroir. Single-origin Quebec maple, family-owned since 1978.';

  const imgNode = product.images.edges[0] && product.images.edges[0].node;
  const image = imgNode ? widthUrl(imgNode.url, 1200) : '';
  const variant = product.variants.edges[0] && product.variants.edges[0].node;
  const price = variant && variant.priceV2 ? variant.priceV2.amount : null;
  const currency = variant && variant.priceV2 ? variant.priceV2.currencyCode : 'CAD';
  const availability = variant && variant.availableForSale
    ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: desc,
    brand: { '@type': 'Brand', name: 'Maple Terroir' },
    url: canonical,
  };
  if (image) ld.image = image;
  if (product.productType) ld.category = product.productType;
  if (price) {
    ld.offers = {
      '@type': 'Offer', price: price, priceCurrency: currency,
      availability: availability, url: canonical,
    };
  }

  const headInject =
    '<link rel="canonical" href="' + esc(canonical) + '">' +
    '<meta property="og:type" content="product">' +
    '<meta property="og:url" content="' + esc(canonical) + '">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    (image ? '<meta property="og:image" content="' + esc(image) + '">' : '') +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(title) + '">' +
    '<meta name="twitter:description" content="' + esc(desc) + '">' +
    (image ? '<meta name="twitter:image" content="' + esc(image) + '">' : '') +
    '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>' +
    '<script>window.__PRODUCT_HANDLE__=' + JSON.stringify(handle) + ';</script>';

  const descHtml = product.descriptionHtml || ('<p>' + esc(product.description || '') + '</p>');

  const rewriter = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', desc); } })
    .on('head', { element(el) { el.append(headInject, { html: true }); } })
    .on('#breadcrumb-title', { element(el) { el.setInnerContent(product.title); } })
    .on('#product-title', { element(el) { el.setInnerContent(product.title); } })
    .on('#product-desc', { element(el) { el.setInnerContent(descHtml, { html: true }); } });

  const out = rewriter.transform(templateRes);
  const headers = new Headers(out.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=300, s-maxage=86400');
  return new Response(out.body, { status: 200, headers });
}
