/* build-homepage-social-proof.mjs
 *
 * Rewrites the "What People Say" section on the homepage so it carries:
 *   1. a rating bar naming where the ratings come from, and
 *   2. testimonial cards that are real reviews, each labelled with its source.
 *
 * The cards that shipped with the original build were placeholder copy. None of
 * the six names appear in the Loox export or on the Google listing, and Bing was
 * quoting one of them as the site's description. Everything below is a real
 * review, copied from its source and dated.
 *
 * Ratings are frozen at the numbers in SOURCES. Re-run this after each Loox
 * export and after checking the Google listing, or the counts go stale.
 *
 * Usage: node scripts/build-homepage-social-proof.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'index.html');

/* Checked 14 August 2026. Google: the Maple Terroir listing on Google Maps.
   Site reviews: the Loox export, 86 published reviews averaging 4.99.
   Amazon.ca is deliberately absent: the only rated Maple Terroir listing there
   carries 3 ratings, which reads as weak rather than reassuring. */
const SOURCES = [
  {
    mark: 'google',
    score: '4.9',
    line: '39 Google reviews',
    href: 'https://www.google.com/maps/search/Maple+Terroir+9291+Shaughnessy+St+Vancouver',
    external: true,
  },
  {
    mark: 'verified',
    score: '5.0',
    line: '86 verified reviews on Loox',
    href: '/products',
    external: false,
  },
];

/* Every quote below is copied word for word from its source. `midway: true`
   marks a quote that picks up part-way through a longer review, which gets a
   leading ellipsis. Nothing inside a quote is reworded. */
const CARDS = [
  {
    source: 'google',
    quote: 'Maple Terroir is the absolute best. Their maple syrups, Stroopwaffles, shortbread cookies, and popcorn make for amazing gifts for friends and family. Every time I bring them home or to work, they’re always gone immediately. On top of that, I love supporting a local and family business.',
    name: 'Kimberly Liu',
    meta: 'Google review',
      },
  {
    source: 'verified',
    quote: 'Simply the BEST! These Stroopwafels are the best that I have tried! Not only the blueberry, but the others as well! Great Canadian quality product! Everything is packed with care! Love that they are individually wrapped!',
    name: 'Sheryl V.',
    meta: 'Wild Blueberry Maple Stroopwafels',
      },
  {
    source: 'google',
    quote: 'The outside has a nice crunch and the inside is this soft, gooey maple cream that actually tastes like real maple syrup, not fake flavouring. I’ve been ordering them regularly for like two years now. My only complaint is that I can’t stop at just one.',
    name: 'macy mason',
    meta: 'Google review',
    midway: true,
  },
  {
    source: 'verified',
    quote: 'On weekends we have complementary hot apple cider along with a little treat, usually a mini donut for our customers. Last weekend for the first time, we had your delicious mini maple shortbread cookies. All of our customers, along with our staff, loved them. Thank you.',
    name: 'Christina S.',
    meta: 'Maple Leaf Mini Shortbread Cookies',
  },
  {
    source: 'google',
    quote: 'Later the company reached out to me themselves, explained what happened, and refunded the shipping cost without me even asking. Really appreciated the honesty and attention to detail.',
    name: 'Andrii Kramarenko',
    meta: 'Google review',
    midway: true,
  },
  {
    source: 'verified',
    quote: 'I first ordered this back in early November, I just put in my THIRD order! I keep handing it out to friends and family ( so much for waiting for Christmas) EVERYONE LOVES it!! Definitely BEST Popcorn ever!',
    name: 'Kim Martens',
    meta: 'Pure Maple Syrup Butter Popcorn',
  },
  {
    source: 'verified',
    quote: 'The waffles are fantastic! I am using them for a quick carb snack before a morning run. Easy and delicious. Loved the personal touch-the personal note and company history was appreciated and will make me order more from this proud Canadian company.',
    name: 'Heidi R.',
    meta: 'Wild Blueberry Maple Stroopwafels',
  },
  {
    source: 'verified',
    quote: 'Ordered from the UK for my friend in Vancouver, who was missing Amsterdam, he enjoyed the blueberry waffles. Efficient and helpful service in contacting my friend so that he could arrange to pickup the order.',
    name: 'David Broughton',
    meta: 'Wild Blueberry Maple Stroopwafels',
      },
];

const STAR = '<svg class="w-4 h-4 text-amber-warm" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';

/* Google's own four-colour G, used to attribute a review to Google. */
const G_MARK = '<svg class="mt-src-mark" viewBox="0 0 48 48" aria-hidden="true">'
  + '<path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15.6z"/>'
  + '<path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8 41.1 15.4 46 24 46z"/>'
  + '<path fill="#FBBC05" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.6C2.9 17 2 20.4 2 24s.9 7 2.4 10z"/>'
  + '<path fill="#EA4335" d="M24 10.7c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.5 29.9 2 24 2 15.4 2 8 6.9 4.4 14l7.1 5.6c1.8-5.3 6.7-8.9 12.5-8.9z"/>'
  + '</svg>';

/* The same check already used on the product pages, paired with the word Loox
   so a shopper sees which app collected the review. */
const CHECK_MARK = '<svg class="mt-src-mark mt-src-mark--check" viewBox="0 0 24 24" aria-hidden="true">'
  + '<path d="M20 6L9 17l-5-5"/></svg>';

const mark = (kind) => (kind === 'google' ? G_MARK : CHECK_MARK);

function sourceCell(s) {
  const rel = s.external ? ' target="_blank" rel="noopener"' : '';
  return `        <a class="mt-src" href="${s.href}"${rel}>
          ${mark(s.mark)}
          <span class="mt-src-score">${s.score}</span>
          <span class="mt-src-stars">${STAR.repeat(5)}</span>
          <span class="mt-src-line">${s.line}</span>
        </a>`;
}

function card(c) {
  const initials = c.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  /* A leading ellipsis only where the quote picks up part-way through the
     review. Quotes always stop at a full stop, so nothing trails. */
  const open = c.midway ? '&hellip;' : '';
  const label = c.source === 'google' ? 'Google' : 'Loox verified';
  return `        <div class="flex-shrink-0 w-[min(340px,85vw)] md:w-[400px] mx-3">
          <div class="bg-white ring-1 ring-warm-gray-200/40 rounded-[2rem] p-7 md:p-8 h-full flex flex-col">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-1">${STAR.repeat(5)}</div>
              <span class="mt-card-src">${mark(c.source)}${label}</span>
            </div>
            <p class="text-sm text-warm-gray-600 leading-relaxed mb-5 flex-1">&ldquo;${open}${c.quote}&rdquo;</p>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-amber-warm/10 flex items-center justify-center text-xs font-semibold text-amber-deep">${initials}</div>
              <div><div class="text-sm font-semibold text-charcoal">${c.name}</div><div class="text-xs text-warm-gray-400">${c.meta}</div></div>
            </div>
          </div>
        </div>`;
}

const cards = [...CARDS, ...CARDS.slice(0, 4)].map(card).join('\n');

const SECTION = `  <section class="py-24 md:py-40 overflow-hidden">
    <div class="max-w-[1400px] mx-auto px-4 md:px-8 mb-12 md:mb-16">
      <div class="text-center">
        <span class="reveal eyebrow inline-flex items-center gap-2 text-amber-warm mb-6 mx-auto justify-center">
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="3"/></svg>
          What People Say
        </span>
        <h2 class="reveal reveal-delay-1 font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-charcoal tracking-tight leading-[1.1]">
          Loved by families<br><span class="text-amber-warm italic font-medium">from around the world.</span>
        </h2>
      </div>

      <!-- Where the ratings come from. Numbers checked 14 August 2026. -->
      <div class="reveal reveal-delay-2 mt-srcbar">
${SOURCES.map(sourceCell).join('\n        <span class="mt-src-rule" aria-hidden="true"></span>\n')}
      </div>
    </div>

    <!-- Scrolling testimonial cards. Every quote is a real review. -->
    <div class="relative max-w-[1400px] mx-auto px-4 md:px-8 overflow-hidden">
      <div class="flex testimonial-track" style="width: max-content;">
${cards}
      </div>
      <!-- Fade edges -->
      <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cream to-transparent pointer-events-none z-10"></div>
      <div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-cream to-transparent pointer-events-none z-10"></div>
    </div>
  </section>`;

let html = fs.readFileSync(FILE, 'utf8');

if (!html.includes('/assets/reviews.css')) {
  html = html.replace('<link rel="stylesheet" href="/assets/tailwind.css">',
    '<link rel="stylesheet" href="/assets/tailwind.css">\n  <link rel="stylesheet" href="/assets/reviews.css">');
}

const startAt = html.indexOf('<!-- TESTIMONIALS');
if (startAt === -1) { console.error('could not find the testimonials heading comment'); process.exit(1); }
const openAt = html.indexOf('  <section', startAt);
const closeAt = html.indexOf('\n  </section>', openAt);
if (openAt === -1 || closeAt === -1) { console.error('could not find the testimonials section'); process.exit(1); }

const before = html.slice(0, openAt);
const after = html.slice(closeAt + '\n  </section>'.length);
fs.writeFileSync(FILE, before + SECTION + after);

console.log(`homepage rewritten: ${SOURCES.length} rating sources, ${CARDS.length} real reviews`);
