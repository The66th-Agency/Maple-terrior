// Cloudflare Pages Function at /blog/post.
// Old indexed URLs use ?handle=SLUG&blog=BLOG. The site has moved to
// clean /blog/SLUG URLs. This function 301 redirects the legacy form
// to the canonical clean URL so Google consolidates ranking signals.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const handle = url.searchParams.get('handle');

  if (handle) {
    const cleanUrl = new URL('/blog/' + encodeURIComponent(handle), url);
    return Response.redirect(cleanUrl.toString(), 301);
  }

  // No handle to redirect to. Send to the blog index.
  return Response.redirect(new URL('/blog/', url).toString(), 301);
}
