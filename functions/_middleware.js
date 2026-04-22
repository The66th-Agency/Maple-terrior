// Cloudflare Pages middleware. Runs for every request before the static asset handler.
// Purpose: hard-block indexing on preview hosts so Google never picks up the
// Workers/Pages preview URL while we're polishing. Auto-disables once the site
// is served from mapleterroir.com (which won't match the preview host pattern).

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();
  const isPreview = host.endsWith('.workers.dev') || host.endsWith('.pages.dev');
  if (isPreview) {
    const out = new Response(response.body, response);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  }
  return response;
}
