// Cloudflare Pages Function: handles every request under /blog/*.
//
// Why a function instead of _redirects: a 200 rewrite in _redirects to a
// .html target triggers CF Pages' .html-to-clean-URL auto-redirect, which
// loops. Serving the static template through env.ASSETS bypasses URL
// routing entirely so the clean URL stays in the address bar.
//
// Routing logic:
//   /blog/             -> serve blog/index.html (URL stays clean)
//   /blog/index[.html] -> serve blog/index.html (URL stays clean)
//   /blog/post[.html]  -> legacy template URL. If ?handle=X present,
//                         301 to /blog/X. Otherwise 301 to /blog/.
//   /blog/SLUG         -> serve blog/post.html content. The page's JS
//                         reads SLUG from window.location.pathname and
//                         fetches the article from Shopify Storefront.

export async function onRequest(context) {
  const { params, request, env } = context;
  const url = new URL(request.url);
  const parts = params.slug || [];
  const first = (parts[0] || '').toLowerCase();

  if (!first || first === 'index' || first === 'index.html') {
    return env.ASSETS.fetch(new URL('/blog/index.html', url).toString());
  }

  if (first === 'post' || first === 'post.html') {
    const handle = url.searchParams.get('handle');
    if (handle) {
      const cleanUrl = new URL('/blog/' + encodeURIComponent(handle), url);
      return Response.redirect(cleanUrl.toString(), 301);
    }
    return Response.redirect(new URL('/blog/', url).toString(), 301);
  }

  // Article slug. Serve the static template; client-side JS extracts the
  // slug from the URL and renders the article from Shopify.
  return env.ASSETS.fetch(new URL('/blog/post.html', url).toString());
}
