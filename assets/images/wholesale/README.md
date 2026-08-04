Images for maple-syrup-wholesale.html.

These were served from cdn.instant.so, a page builder CDN that the site's
Content-Security-Policy in _headers does not allow, so every one of them was
blocked and the page showed five gaps.

Self-hosted here rather than whitelisting the CDN, matching how the fonts and
the vendor libs were handled. See the comments in _headers.
