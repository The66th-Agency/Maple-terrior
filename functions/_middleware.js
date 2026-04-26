// Cloudflare Pages middleware. Runs for every request before the static asset handler.
//   1. Hard-block indexing on preview hosts (workers.dev, pages.dev) so Google never picks
//      up the staging URL while we are polishing. Auto-disables on the prod domain.
//   2. Apply 301 redirects for renamed pages so SEO equity transfers to the new URLs.

// Map of OLD path -> NEW path. Keep keys lowercased.
const REDIRECTS = {
  '/wholesale.html': '/maple-syrup-wholesale.html',
  '/wholesale': '/maple-syrup-wholesale.html',
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.toLowerCase();

  // 1) 301 redirects for renamed pages
  const target = REDIRECTS[path];
  if (target) {
    const redirectUrl = new URL(target, url);
    redirectUrl.search = url.search;
    return Response.redirect(redirectUrl.toString(), 301);
  }

  // 2) Pass through to the static asset, then layer on noindex for preview hosts
  const response = await context.next();
  const host = url.hostname.toLowerCase();
  const isPreview = host.endsWith('.workers.dev') || host.endsWith('.pages.dev');
  if (isPreview) {
    const out = new Response(response.body, response);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  }
  return response;
}
