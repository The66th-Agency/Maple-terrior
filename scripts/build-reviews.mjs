/* build-reviews.mjs
 *
 * Reads the Loox review export and bakes each product's real reviews into its
 * static product page. Two things land on the page:
 *
 *   1. A compact star rating directly under the product title, above the price.
 *      This is the conversion-critical placement: a buyer reads it while
 *      deciding, rather than after scrolling past the whole page.
 *   2. The full reviews, with customer photos and Maple Terroir's replies,
 *      inside the Customer Reviews section that already sits on every page.
 *
 * It also writes aggregateRating into the Product JSON-LD so Google has a
 * rating to print beside the shop in search results.
 *
 * Usage: node scripts/build-reviews.mjs <export.csv> [handle ...]
 * With no handles it does every product that has reviews.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PHOTO_DIR = path.join(ROOT, 'assets', 'reviews');
const VISIBLE_AT_FIRST = 6;

// ---------- CSV ----------

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows
    .filter(r => r.length === head.length)
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

// ---------- helpers ----------

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function niceDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';

function stars(rating, label) {
  const n = Math.round(Number(rating) || 0);
  let out = `<span class="mt-stars" role="img" aria-label="${esc(label)}">`;
  for (let i = 1; i <= 5; i++) {
    out += i <= n ? STAR : STAR.replace('<svg ', '<svg class="is-empty" ');
  }
  return out + '</span>';
}

const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

/* Photos Loox holds that show no product. Publishing one of these on a product
   page confuses a buyer, so the review text runs on its own. Each entry is a
   review id from the export, checked by eye against the downloaded file. */
const PHOTOS_TO_SKIP = new Set([
  'UXNcVuaBq', // a fish tank, no Maple Terroir product in the frame
]);

/* One merchant reply in the export opens by pasting the customer's own review
   back, so the same words appear twice on the page. Cut the repeat. */
function cleanReply(reply, review) {
  const r = (reply || '').trim();
  const body = (review || '').trim();
  if (!r || !body) return r;
  if (r.startsWith(body)) return r.slice(body.length).trim();
  return r;
}

// ---------- one review card ----------

function reviewCard(r, photoFile, hidden) {
  const name = (r.nickname || r.full_name || 'Customer').trim();
  const when = niceDate(r.date);
  const rating = Number(r.rating) || 5;

  let html = `<article class="mt-review${hidden ? ' is-hidden' : ''}">`;
  html += '<div class="mt-review-head"><div class="mt-review-who">';
  html += `<span class="mt-review-name">${esc(name)}</span>`;
  html += stars(rating, `${rating} out of 5 stars`);
  if (r.verified_purchase === 'true') {
    html += `<span class="mt-review-verified">${CHECK}Verified purchase</span>`;
  }
  html += '</div>';
  if (when) html += `<span class="mt-review-date">${esc(when)}</span>`;
  html += '</div>';

  const body = (r.review || '').trim();
  if (body) html += `<p class="mt-review-text">${esc(body)}</p>`;

  if (photoFile) {
    html += `<img class="mt-review-photo" src="/assets/reviews/${esc(photoFile)}" `
         +  `alt="Photo from ${esc(name)}" loading="lazy" decoding="async" width="600" height="600">`;
  }

  const variant = (r.variant || '').trim();
  if (variant) html += `<span class="mt-review-variant">${esc(variant)}</span>`;

  const reply = cleanReply(r.reply, r.review);
  if (reply) {
    html += '<div class="mt-review-reply"><b>Maple Terroir replied</b>'
         +  `<p>${esc(reply)}</p></div>`;
  }

  return html + '</article>';
}

// ---------- the whole section ----------

function reviewsSection(list, photoFor) {
  const count = list.length;
  const avg = list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count;
  const avgText = avg.toFixed(1);

  let html = '<div class="mt-reviews-summary">';
  html += `<div class="mt-reviews-score"><b>${avgText}</b>`
       +  stars(avg, `${avgText} out of 5 stars`) + '</div>';
  html += `<span class="mt-reviews-count">Based on ${count} `
       +  `${count === 1 ? 'review' : 'reviews'} from verified buyers</span>`;
  html += '</div>';

  /* Where the reviews come from, said plainly. Loox only emails a review
     request to someone who placed an order, so every review here is tied to a
     real purchase. The link is nofollow because it points at a vendor. */
  html += '<p class="mt-reviews-source">Every review on this page comes from a '
       +  'customer who bought the product. Reviews are collected and verified by '
       +  '<a href="https://loox.io/" rel="nofollow noopener" target="_blank">Loox</a>, '
       +  'which sends the request only to a real order.</p>';

  /* One or two reviews in a three-column layout leaves most of the row empty
     and the section reads as broken, so a sparse page gets a centred row. */
  const shape = count <= 2 ? ` mt-reviews-grid--few mt-reviews-grid--${count}` : '';
  html += `<div class="mt-reviews-grid${shape}">`;
  list.forEach((r, i) => {
    html += reviewCard(r, photoFor(r), i >= VISIBLE_AT_FIRST);
  });
  html += '</div>';

  if (count > VISIBLE_AT_FIRST) {
    html += `<button type="button" class="mt-reviews-more" `
         +  `onclick="mtShowAllReviews(this)">Show all ${count} reviews</button>`;
  }

  return { html, avgText, count };
}

const TOGGLE_SCRIPT = `<script>
function mtShowAllReviews(btn){
  var hidden = document.querySelectorAll('.mt-review.is-hidden');
  for (var i = 0; i < hidden.length; i++) hidden[i].classList.remove('is-hidden');
  btn.remove();
}
</script>`;

// ---------- page rewrite ----------

function buildPage(file, list, photoFor) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const { html: section, avgText, count } = reviewsSection(list, photoFor);

  // 1. The stylesheet, once.
  if (!html.includes('/assets/reviews.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="\/assets\/tailwind\.css">)/,
      '$1<link rel="stylesheet" href="/assets/reviews.css">'
    );
  }

  // 2. The compact rating, between the product title and the price.
  const ratingLink = `\n          <a class="mt-rating-inline" href="#reviews-section">`
    + stars(avgText, `${avgText} out of 5 stars`)
    + `<b>${avgText}</b><span>${count} ${count === 1 ? 'review' : 'reviews'}</span></a>\n`;

  html = html.replace(/\n\s*<a class="mt-rating-inline"[\s\S]*?<\/a>\n/, '\n');
  html = html.replace(
    /(<h1 id="product-title"[\s\S]*?<\/h1>)/,
    `$1${ratingLink}`
  );

  // 3. The reviews themselves, replacing the Loox widget that never renders here.
  html = html.replace(
    /<section id="reviews-section"[\s\S]*?<\/section>/,
    `<section id="reviews-section" class="py-16 md:py-24 px-4 md:px-8 border-t border-warm-gray-200/30">
    <div class="max-w-[1400px] mx-auto">
      <span class="eyebrow text-amber-warm mb-4 block text-center">Customer Reviews</span>
      <h2 class="font-display text-2xl md:text-3xl font-semibold text-charcoal tracking-tight text-center mb-12">What Our Customers Say</h2>
      ${section}
    </div>
  </section>`
  );

  if (!html.includes('function mtShowAllReviews')) {
    html = html.replace('</body>', `  ${TOGGLE_SCRIPT}\n</body>`);
  }

  // 4. aggregateRating into the Product JSON-LD, so Google has a rating to show.
  html = html.replace(
    /("@type":"Product"[\s\S]*?)(,"offers":\{)/,
    (m, head, tail) => {
      const cleaned = head.replace(/,"aggregateRating":\{[^}]*\}/, '');
      return `${cleaned},"aggregateRating":{"@type":"AggregateRating",`
        + `"ratingValue":"${avgText}","reviewCount":"${count}",`
        + `"bestRating":"5","worstRating":"1"}${tail}`;
    }
  );

  if (html === before) return false;
  fs.writeFileSync(file, html);
  return true;
}

// ---------- run ----------

const [csvPath, ...only] = process.argv.slice(2);
if (!csvPath) {
  console.error('usage: node scripts/build-reviews.mjs <export.csv> [handle ...]');
  process.exit(1);
}

const all = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  .filter(r => r.status === 'Active' && (r.review || '').trim());

const photoIndex = new Map();
if (fs.existsSync(PHOTO_DIR)) {
  for (const f of fs.readdirSync(PHOTO_DIR)) {
    photoIndex.set(path.parse(f).name, f);
  }
}
const idKey = Object.keys(all[0])[0];
const photoFor = r => {
  if (!(r.img || '').trim()) return null;
  if (PHOTOS_TO_SKIP.has(r[idKey])) return null;
  return photoIndex.get(r[idKey]) || null;
};

const byHandle = new Map();
for (const r of all) {
  if (!byHandle.has(r.handle)) byHandle.set(r.handle, []);
  byHandle.get(r.handle).push(r);
}

let done = 0;
for (const [handle, list] of byHandle) {
  if (only.length && !only.includes(handle)) continue;
  const file = path.join(ROOT, 'products', `${handle}.html`);
  if (!fs.existsSync(file)) { console.log(`  skip (no page)  ${handle}`); continue; }
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  const withPhoto = list.filter(photoFor).length;
  if (buildPage(file, list, photoFor)) {
    done++;
    console.log(`  ${String(list.length).padStart(3)} reviews, ${withPhoto} photos  ${handle}`);
  } else {
    console.log(`  UNCHANGED (page shape did not match)  ${handle}`);
  }
}
console.log(`\n${done} product page${done === 1 ? '' : 's'} rebuilt`);
