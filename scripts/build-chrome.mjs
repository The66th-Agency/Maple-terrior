#!/usr/bin/env node
// One nav, one footer and one cart on every page (Liam, October 3, 2026: "we
// should use 1 component and reuse it across all pages"). Before this the site
// carried two navs (33 pages had no cart button), 20 footers and five cart
// drawers, because each page held its own pasted copy.
//
//   partials/nav.html     the nav bar and the mobile menu
//   partials/footer.html  the footer
//   assets/cart.js        the cart drawer, its styles and MapleCart
//
// Those three files are the only copies anyone edits. This script bakes the two
// partials into every page in place of whatever nav, mobile menu and footer the
// page had, takes out the cart code, drawer markup and drawer styles each page
// used to carry inline, and loads /assets/cart.js instead. The links stay in the
// HTML, so Google reads them on every page. ship.mjs runs it on every publish,
// and the QA bot fails any page whose nav or footer differs from the partials.
//
// It also stamps /assets/cart.js, assets/shared.js and /assets/pdp.js with a fingerprint of
// their contents (?v=...). Browsers keep both files for a day, so a page that
// changes with its script needs a new address for the script: on October 3,
// 2026 Liam saw two search buttons because his browser paired the new nav with
// a cached shared.js under the same ?v= date that still added its own button.
//
// Usage: node scripts/build-chrome.mjs [--check]
//   --check changes nothing and exits 1 if any page is out of step.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const strip = (s) => s.replace(/^<!--[^\n]*-->\n/, "").trim();
const NAV = strip(readFileSync(join(ROOT, "partials/nav.html"), "utf8"));
const FOOTER = strip(readFileSync(join(ROOT, "partials/footer.html"), "utf8"));
const stamp = (f) => createHash("sha1").update(readFileSync(join(ROOT, f))).digest("hex").slice(0, 8);
const CART_V = stamp("assets/cart.js"), SHARED_V = stamp("assets/shared.js");
const PDP_V = existsSync(join(ROOT, "assets/pdp.js")) ? stamp("assets/pdp.js") : null; // product pages only
const CART_TAG = `<script src="/assets/cart.js?v=${CART_V}"></script>`;
const SKIP = new Set([".git", "node_modules", "_scripts", "scripts", "assets", "partials", "functions", "runs"]);

function pages(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { if (!SKIP.has(name) && !name.startsWith(".")) pages(full, out); }
    else if (name.endsWith(".html") && !name.includes(".bak")) out.push(full);
  }
  return out;
}

// The span of an element from its opening tag to its matching close.
function span(html, openRe, tag) {
  const m = html.match(openRe);
  if (!m) return null;
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  re.lastIndex = m.index;
  let depth = 0, t;
  while ((t = re.exec(html))) {
    depth += t[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return [m.index, re.lastIndex];
  }
  return null;
}

const CART_IIFE = /(?:window\.)?var MapleCart = \(function \(\) \{[\s\S]*?return \{[^}]*\};\s*\}\)\(\);|var MapleCart = \(function \(\) \{[\s\S]*?return \{[^}]*\}\s*\}\)\(\);/;
const CART_CSS = /^\s*[^{}@]*\.(?:cart-|nav-cart-count)[^{}]*\{[^{}]*\}[ \t]*\n?/gm;

// One breadcrumb on every page but the homepage (Liam, November 9, 2026: Web build
// baseline 12, "doesnt each page hav e abread crumb???"). The trail is read from the
// page's own BreadcrumbList schema, so the visible trail and the schema can never
// disagree: change a trail in the schema and the next bake redraws it. The look is
// the collections pages' breadcrumb (small warm-grey text, slashes between steps),
// in an <ol>, with the current page as plain text. On a photo hero with a cream
// headline it takes the cream tone; nothing else changes.
// Placement: a page that already carries the block (CRUMBS markers) or an older
// breadcrumb nav is redrawn in place; otherwise it goes straight above the h1,
// replacing a "Back to the blog" style link that sat there. A page with no
// BreadcrumbList (the homepage, the product.html and collection.html templates)
// is left alone.
const ORIGIN_URL = "https://mapleterroir.com";
const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unEsc = (s) => String(s).replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function schemaTrail(h) {
  for (const m of h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let d;
    try { d = JSON.parse(m[1]); } catch { continue; }
    const stack = [d];
    while (stack.length) {
      const x = stack.pop();
      if (Array.isArray(x)) { stack.push(...x); continue; }
      if (!x || typeof x !== "object") continue;
      if (x["@type"] === "BreadcrumbList" && Array.isArray(x.itemListElement)) {
        return [...x.itemListElement]
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((i) => {
            const item = typeof i.item === "string" ? i.item : i.item && (i.item["@id"] || i.item.url);
            return { name: unEsc(i.name || (i.item && i.item.name) || ""), href: String(item || "").replace(ORIGIN_URL, "") || "/" };
          });
      }
      stack.push(...Object.values(x).filter((v) => v && typeof v === "object"));
    }
  }
  return null;
}

const KEEP_LAYOUT = /^(m[tblrxy]?-|p[tblrxy]-|relative$|max-w-|mx-auto$|w-full$)/;
function crumbsHtml(trail, { dark, layout = [], currentId = "", indent = "" }) {
  const tone = dark ? "text-cream/75" : "text-warm-gray-400";
  const hover = dark ? "hover:text-cream" : "hover:text-charcoal";
  const current = dark ? "text-cream" : "text-warm-gray-600";
  const steps = trail.map((c, i) =>
    i === trail.length - 1
      ? `<li aria-current="page" class="${current}"${currentId ? ` id="${currentId}"` : ""}>${escHtml(c.name)}</li>`
      : `<li><a href="${escHtml(c.href)}" class="${hover} transition-colors">${escHtml(c.name)}</a></li>\n${indent}    <li aria-hidden="true">/</li>`
  );
  return [
    `<!-- CRUMBS:START (baked by scripts/build-chrome.mjs from this page's BreadcrumbList; edit the schema, never this copy) -->`,
    `${indent}<nav class="crumbs flex text-xs ${tone}${layout.length ? " " + layout.join(" ") : ""}" aria-label="Breadcrumb">`,
    `${indent}  <ol class="flex flex-wrap items-center gap-x-2 gap-y-1">`,
    ...steps.map((s) => `${indent}    ${s}`),
    `${indent}  </ol>`,
    `${indent}</nav>`,
    `${indent}<!-- CRUMBS:END -->`,
  ].join("\n");
}

function bakeCrumbs(h, rel) {
  if (rel === "index.html") return h;
  const trail = schemaTrail(h);
  if (!trail || trail.length < 2) return h;
  const lineIndent = (at) => h.slice(h.lastIndexOf("\n", at - 1) + 1, at).match(/^[ \t]*/)[0];
  const classesOf = (tag) => ((tag.match(/class="([^"]*)"/) || [])[1] || "").split(/\s+/).filter(Boolean);

  // a. the block is already there: redraw it with the same layout and tone
  const blk = h.match(/<!-- CRUMBS:START[^>]*-->[\s\S]*?<!-- CRUMBS:END -->/);
  // b. an older breadcrumb nav
  const old = blk ? null : span(h, /<nav\b[^>]*aria-label="Breadcrumb"[^>]*>/, "nav");
  if (blk || old) {
    const [s, e] = blk ? [blk.index, blk.index + blk[0].length] : old;
    const seg = h.slice(s, e);
    const navTag = (seg.match(/<nav\b[^>]*>/) || [""])[0];
    const cls = classesOf(navTag);
    const dark = /\btext-cream\b|text-cream\//.test(seg);
    const layout = cls.filter((c) => KEEP_LAYOUT.test(c));
    const currentId = /id="breadcrumb-title"/.test(seg) ? "breadcrumb-title" : "";
    return h.slice(0, s) + crumbsHtml(trail, { dark, layout, currentId, indent: lineIndent(s) }) + h.slice(e);
  }

  // c. none yet: straight above the h1, in the h1's own column
  const h1 = h.search(/<h1\b/);
  if (h1 < 0) return h;
  const h1Tag = h.slice(h1).match(/<h1\b[^>]*>/)[0];
  const dark = /\btext-cream\b/.test(h1Tag);
  let start = h.lastIndexOf("\n", h1 - 1) + 1;
  let layout = ["mb-8"];
  // a lone "Back to ..." link right above the h1 is the breadcrumb's job now
  const pre = h.slice(0, start);
  const back = pre.match(/([ \t]*)(<a\b[^>]*>)(?:(?!<\/a>)[\s\S])*<\/a>\s*$/);
  if (back) {
    const m = classesOf(back[2]).filter((c) => /^mb-/.test(c));
    if (m.length) layout = m;
    start = back.index;
  }
  const indent = lineIndent(h1);
  return h.slice(0, start) + indent + crumbsHtml(trail, { dark, layout, indent }) + "\n" + h.slice(h.lastIndexOf("\n", h1 - 1) + 1);
}

let changed = 0, drift = [];
for (const file of pages(ROOT)) {
  const rel = relative(ROOT, file);
  let h = readFileSync(file, "utf8");
  const before = h;
  if (!/<nav id="navbar"/.test(h)) continue; // 404.html and the templates without a nav keep their own shape

  // 1. nav and mobile menu
  const nav = span(h, /<nav id="navbar"/, "nav");
  let mm = span(h, /<div id="mobile-menu"/, "div");
  if (nav) {
    const end = mm && mm[0] > nav[1] && h.slice(nav[1], mm[0]).trim() === "" ? mm[1] : nav[1];
    h = h.slice(0, nav[0]) + NAV + h.slice(end);
    mm = span(h, /<div id="mobile-menu"/, "div");
  }

  // 1b. any second mobile menu. On 81 pages the old one sat behind a comment
  // line, so the first bake (61a4aee) added the shared menu and left the old one
  // in place: invisible, but every menu link twice and two ids alike.
  const keep = h.indexOf('<div id="mobile-menu"');
  for (let at; keep >= 0 && (at = h.indexOf('<div id="mobile-menu"', keep + 1)) > 0; ) {
    const sp = span(h.slice(at), /<div id="mobile-menu"/, "div");
    if (!sp) break;
    const before = h.slice(0, at);
    const cm = before.match(/[ \t]*<!--[^\n]*-->[ \t]*\n[ \t]*$/);
    const start = cm && /mobile/i.test(cm[0]) ? at - cm[0].length : before.lastIndexOf("\n") + 1;
    const end = at + sp[1];
    h = h.slice(0, start) + h.slice(h[end] === "\n" ? end + 1 : end);
  }

  // 2. footer
  const ft = span(h, /<footer\b/, "footer");
  if (ft) h = h.slice(0, ft[0]) + FOOTER + h.slice(ft[1]);
  else drift.push(`${rel}: no footer`);

  // 3. the inline cart: script, drawer markup, drawer styles
  let at = -1;
  h = h.replace(/<script>([\s\S]*?)<\/script>/g, (whole, body, idx) => {
    if (!CART_IIFE.test(body)) return whole;
    const rest = body.replace(CART_IIFE, "").trim();
    at = idx;
    return rest ? `${CART_TAG}\n  <script>\n${rest}\n  </script>` : CART_TAG;
  });
  h = h.replace(/[ \t]*<div class="cart-overlay" id="cart-overlay"><\/div>\s*<aside class="cart-drawer"[\s\S]*?<\/aside>\n?/, "");
  h = h.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (whole, attrs, css) => `<style${attrs}>${css.replace(CART_CSS, "")}</style>`);
  h = h.replace(/<script src="\/assets\/cart\.js(?:\?v=[^"]*)?"><\/script>/g, CART_TAG);
  h = h.replace(/(src="[^"]*assets\/shared\.js)(?:\?v=[^"]*)?"/g, `$1?v=${SHARED_V}"`);
  if (PDP_V) h = h.replace(/(src="\/assets\/pdp\.js)(?:\?v=[^"]*)?"/g, `$1?v=${PDP_V}"`);
  if (!h.includes(CART_TAG)) {
    const shared = h.search(/<script[^>]*src="[^"]*shared\.js(?:\?v=[^"]*)?"/);
    h = shared >= 0 ? h.slice(0, shared) + CART_TAG + "\n  " + h.slice(shared) : h.replace(/<\/body>/i, `  ${CART_TAG}\n</body>`);
  }

  // 4. the breadcrumb
  h = bakeCrumbs(h, rel);

  if (h !== before) {
    changed++;
    if (CHECK) drift.push(rel);
    else writeFileSync(file, h);
  }
}

if (CHECK) {
  if (drift.length) { console.log(`chrome out of step on ${drift.length} page(s): ${drift.slice(0, 12).join(", ")}${drift.length > 12 ? ", ..." : ""}`); process.exit(1); }
  console.log("chrome: every page carries the one nav, footer and cart");
} else {
  console.log(`chrome: ${changed} page(s) rebaked from partials/nav.html, partials/footer.html and assets/cart.js${drift.length ? `; ${drift.join(", ")}` : ""}`);
}
