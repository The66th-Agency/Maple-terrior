/* build-card-ratings.mjs
 *
 * Puts the star average and review count on every product card in the shop
 * and the category pages, reading the same Loox export the product pages use.
 *
 * Each grid is drawn TWICE: once as static HTML baked in by build-grids.mjs so
 * Google can read it, and again by the page's own JavaScript once Shopify
 * answers. The rating has to go into both, or it shows for a moment and then
 * disappears when the live grid replaces it.
 *
 * Placement: its own line between the product name and the price row. The
 * right side of the price row already holds the Add to Cart button.
 *
 * Usage: node scripts/build-card-ratings.mjs <export.csv>
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length === head.length)
             .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';

const csvPath = process.argv[2];
if (!csvPath) { console.error('usage: node scripts/build-card-ratings.mjs <export.csv>'); process.exit(1); }

const reviews = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  .filter(r => r.status === 'Active' && (r.review || '').trim());

const stats = new Map();
for (const r of reviews) {
  const s = stats.get(r.handle) || { n: 0, sum: 0 };
  s.n++; s.sum += Number(r.rating) || 0;
  stats.set(r.handle, s);
}

const lookup = {};
for (const [h, s] of stats) lookup[h] = [Number((s.sum / s.n).toFixed(1)), s.n];

function badge(handle) {
  const s = stats.get(handle);
  if (!s) return '';
  const avg = (s.sum / s.n).toFixed(1);
  const word = s.n === 1 ? 'review' : 'reviews';
  return `<span class="card-rating" aria-label="${avg} out of 5 stars from ${s.n} ${word}">`
       + `${STAR}${avg}<i>(${s.n})</i></span>`;
}

/* The block the page's own JavaScript uses to draw the same rating. Kept as a
   named global so the card template stays one readable line. */
const RUNTIME = `<script>
window.__MT_RATINGS__ = ${JSON.stringify(lookup)};
window.MapleCardRating = function (handle) {
  var r = window.__MT_RATINGS__[handle];
  if (!r) return '';
  var word = r[1] === 1 ? 'review' : 'reviews';
  return '<span class="card-rating" aria-label="' + r[0].toFixed(1) + ' out of 5 stars from ' + r[1] + ' ' + word + '">'
    + '${STAR.replace(/'/g, "\\'")}' + r[0].toFixed(1) + '<i>(' + r[1] + ')</i></span>';
};
</script>`;

function addRatings(html) {
  let added = 0;

  // 1. The baked cards: a rating line between the product name and the price row.
  let out = html.replace(
    /(<div class="product-card[^"]*">[\s\S]*?<a href="\/products\/([a-z0-9-]+)"[\s\S]*?<\/a>)(<div class="flex items-center justify-between">)/g,
    (whole, head, handle, tail) => {
      if (head.includes('card-rating')) return whole;
      const b = badge(handle);
      if (!b) return whole;
      added++;
      return head + b + tail;
    }
  );

  /* 2. The card the page's own JavaScript builds after Shopify answers. The
        two grids write their cards differently: a category page closes the
        link before the price row, and the shop page keeps the whole card
        inside one link. Both end the product name the same way, so anchor on
        that. */
  const CALL = "(window.MapleCardRating ? window.MapleCardRating(p.handle) : '') +\n        ";
  out = out.replace(
    /((?:'<\/a>'|'<\/h3>')\s*\+\s*\n?\s*)('<div class="flex items-center justify-between">')/g,
    (m, head, tail) => m.includes('MapleCardRating') ? m : head + CALL + tail
  );

  if (!out.includes('window.MapleCardRating') === false && !out.includes('__MT_RATINGS__')) {
    out = out.replace('</body>', `  ${RUNTIME}\n</body>`);
  }

  return { out, added };
}

const files = [
  'products.html',
  ...fs.readdirSync(path.join(ROOT, 'collections'))
       .filter(f => f.endsWith('.html'))
       .map(f => path.join('collections', f)),
].filter(f => fs.existsSync(path.join(ROOT, f)));

let total = 0, patched = 0;
for (const rel of files) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');

  if (!html.includes('/assets/reviews.css')) {
    html = html.replace(/(<link rel="stylesheet" href="\/assets\/tailwind\.css">)/,
                        '$1<link rel="stylesheet" href="/assets/reviews.css">');
  }

  const { out, added } = addRatings(html);
  const jsWired = out.includes('MapleCardRating(p.handle)');
  if (out !== html) {
    fs.writeFileSync(file, out);
    total += added;
    if (jsWired) patched++;
    console.log(`  ${String(added).padStart(3)} baked cards rated, live grid ${jsWired ? 'wired' : 'NOT wired'}  ${rel}`);
  }
}
console.log(`\n${total} baked product cards rated, ${patched} live grids wired`);
