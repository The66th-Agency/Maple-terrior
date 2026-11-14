// The caddy section: one shared block on the five stroopwafel caddy product pages
// (November 13, 2026, content map item 27; CRO Lite review of the same day, finding 4:
// the caddies were in 27 of 50 orders, and nothing near the button said a caddy is 35).
//
// It bakes the block between <!-- CADDY:START --> and <!-- CADDY:END --> on each caddy page,
// and adds the marker pair after the product detail section where it is missing. Prices come
// from the Storefront API at bake time, so re-run it when a caddy price changes:
//   node scripts/build-caddy.mjs
// The block's copy lives only here; never edit a page's baked copy. Sources for every fact:
// active/maple-terroir/agent/runs/specs/pure-maple-syrup-stroopwafels-caddy/RESEARCH.md.
// build-products.mjs updates product pages in place and leaves this block alone.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
const TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';
const PER_CADDY = 35;
const GRAMS = 34;

// Order: Pure Maple first, then the flavors. "made" is each Shopify description's own wording.
const FLAVORS = [
  { handle: 'pure-maple-syrup-stroopwafels-caddy', name: 'Pure Maple', made: 'Canadian flour, sweetened with pure maple syrup. The maple taste on its own.' },
  { handle: 'cocoa-chocolate-maple-stroopwafels-caddy', name: 'Chocolate Maple', made: 'Canadian-grown flour and pure cocoa, sweetened with maple syrup.' },
  { handle: 'wild-blueberry-maple-stroopwafels-caddy', name: 'Blueberry Maple', made: 'Canadian flour and real wild blueberry powder, with maple syrup.' },
  { handle: 'strawberry-cream-maple-stroopwafels-caddy', name: 'Strawberry Maple', made: 'Canadian-grown flour and pure strawberry powder, sweetened with maple syrup.' },
  { handle: 'matcha-green-tea-maple-stroopwafels-caddy', name: 'Matcha Maple', made: 'Canadian flour, sea salt and matcha powder from Kyoto, sweetened with pure maple syrup.' },
];

// Real Loox reviews of the Pure Maple caddy, quoted word for word (scripts/build-reviews.mjs bakes them on that page).
const USES = [
  { title: 'On long rides', text: 'Each one is sealed in its own wrapper, so a few go in a pocket or a pack.', quote: 'They are tasty and helpful fuel my adventures!', who: 'daniel s., Pure Maple caddy, March 2025' },
  { title: 'To share and give', text: 'Thirty-five wrapped stroopwafels go a long way, handed out one at a time at work or with family.', quote: 'They are great gifts for my family and friends in Japan.', who: 'Kaoru H., Pure Maple caddy, July 2025' },
  { title: 'In a lunch box', text: 'One wrapped 34 g stroopwafel is a snack that goes in a lunch box as it is.', quote: 'My kids favorite snack!', who: 'Yori N., Pure Maple caddy, March 2025' },
];

const money = (n) => '$' + n.toFixed(2);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const count = (title) => { const m = String(title).match(/x\s*(\d+)/i); return m ? parseInt(m[1], 10) : 1; };

async function load() {
  const q = FLAVORS.map((f, i) => `p${i}: product(handle: ${JSON.stringify(f.handle)}) { handle title availableForSale variants(first: 10) { edges { node { id title availableForSale priceV2 { amount } } } } }`).join(' ');
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN }, body: JSON.stringify({ query: `{ ${q} }` }) });
  const { data } = await r.json();
  return FLAVORS.map((f, i) => {
    const p = data && data[`p${i}`];
    if (!p) throw new Error(`${f.handle} not found in Shopify`);
    const vs = p.variants.edges.map((e) => ({ id: e.node.id, n: count(e.node.title), price: parseFloat(e.node.priceV2.amount), ok: e.node.availableForSale }));
    const one = vs.find((v) => v.n === 1);
    const eight = vs.find((v) => v.n === 8);
    if (!one) throw new Error(`${f.handle}: no single-caddy variant`);
    return { ...f, title: p.title, inStock: p.availableForSale && one.ok, one, eight };
  });
}

function dots() {
  let s = '';
  for (let i = 0; i < PER_CADDY; i++) s += `<span style="--i:${i}"></span>`;
  return s;
}

function block(list, self) {
  const ref = list.find((f) => f.handle === 'pure-maple-syrup-stroopwafels-caddy');
  const one = ref.one.price, each = one / PER_CADDY;
  const eight = ref.eight ? ref.eight.price : null, eightEach = eight ? eight / 8 / PER_CADDY : null;
  const save = eight ? Math.round((1 - eight / 8 / one) * 100) : 0;
  const me = list.find((f) => f.handle === self);
  const btn = (v, label) => v && v.ok ? `<button type="button" class="cd-row-act" data-variant-id="${esc(v.id)}" data-label="${esc(label)}">${label}</button>` : '';
  const rows = [
    { k: 'One caddy', who: 'One flavor for a home or a desk. One a day lasts five weeks.', n: PER_CADDY, price: one, each, act: btn(me.one, `Add 1 ${me.name} caddy`) },
    { k: 'Three caddies, three flavors', who: 'Add two more flavors from the list below.', n: PER_CADDY * 3, price: one * 3, each, act: `<a class="cd-row-act" href="#caddy-flavors">Choose two more flavors</a>` },
  ];
  if (eight) rows.push({ k: 'Eight caddies, one flavor', who: 'For an office, a team or a club.', n: PER_CADDY * 8, price: eight, each: eightEach, save, best: true, act: btn(me.eight, `Add 8 ${me.name} caddies`) });
  const max = rows[rows.length - 1].n;

  const ladder = rows.map((r) => `
            <div class="cd-row${r.best ? ' is-best' : ''}">
              <div class="cd-row-top"><b>${r.k}</b>${r.save ? `<span class="cd-save">Save ${r.save}%</span>` : ''}</div>
              <div class="cd-bar" aria-hidden="true"><span style="width:${Math.max(6, Math.round(r.n / max * 100))}%"></span></div>
              <div class="cd-row-num"><span>${r.n} stroopwafels</span><span><b>${money(r.price)}</b> &middot; ${money(r.each)} each</span></div>
              <p>${r.who}</p>
              ${r.act}
            </div>`).join('');

  const cards = list.map((f) => {
    const here = f.handle === self;
    const action = here
      ? `<span class="cd-here">You are on this flavor</span>`
      : f.inStock
        ? `<button type="button" class="cd-add" data-variant-id="${esc(f.one.id)}" aria-label="Add one caddy of ${esc(f.title)} to the cart">+ Add a caddy</button>`
        : `<span class="cd-here">Sold out for now</span>`;
    return `
          <article class="cd-flavor${here ? ' is-here' : ''}">
            <a href="/products/${f.handle}" class="cd-flavor-img"${here ? ' aria-current="page"' : ''}><img src="/assets/images/cards/${f.handle}.webp" alt="A caddy of Maple Terroir ${esc(f.title)}" width="400" height="400" loading="lazy"></a>
            <h4><a href="/products/${f.handle}">${f.name}</a></h4>
            <p>${f.made}</p>
            <p class="cd-flavor-price">${money(f.one.price)} for ${PER_CADDY}</p>
            ${action}
          </article>`;
  }).join('');

  const uses = USES.map((u) => `
          <figure class="cd-use">
            <h4>${u.title}</h4>
            <p>${u.text}</p>
            <blockquote>&ldquo;${esc(u.quote)}&rdquo;</blockquote>
            <figcaption>${u.who}, verified purchase</figcaption>
          </figure>`).join('');

  return `<!-- CADDY:START baked by scripts/build-caddy.mjs, ${new Date().toISOString().slice(0, 10)}; edit the script, never this copy -->
  <style>
    .cd a:not(.cd-flavor-img):not(.cd-row-act) { color: #8B5E14; font-weight: 600; text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 3px; }
    .cd a:not(.cd-flavor-img):not(.cd-row-act):hover { color: #1A1714; }
    .cd-top { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
    @media (min-width: 1024px) { .cd-top { grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); gap: 72px; } }
    .cd-lede { color: #5A5249; line-height: 1.7; font-size: 17px; max-width: 40rem; }
    .cd-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 28px; max-width: 40rem; }
    .cd-fact { border-top: 2px solid #1A1714; padding-top: 12px; }
    .cd-fact b { display: block; font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: clamp(28px, 4vw, 40px); line-height: 1; color: #1A1714; letter-spacing: -0.02em; }
    .cd-fact span { display: block; margin-top: 8px; font-size: 13px; line-height: 1.45; color: #6B6158; }
    .cd-box { border-radius: 2rem; background: #F3EADF; padding: 28px; box-shadow: 0 40px 80px -48px rgba(26,23,20,.35); }
    .cd-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
    .cd-grid span { position: relative; aspect-ratio: 1; border-radius: 9px; background: rgba(255,255,255,.55); border-top: 2px dashed rgba(26,23,20,.10); border-bottom: 2px dashed rgba(26,23,20,.10); padding: 9%; }
    .cd-grid span::before { content: ''; position: absolute; inset: 11%; border-radius: 50%; background: repeating-linear-gradient(45deg, rgba(110,62,8,.38) 0 1.5px, transparent 1.5px 6px), repeating-linear-gradient(-45deg, rgba(110,62,8,.38) 0 1.5px, transparent 1.5px 6px), #C98A2E; box-shadow: inset 0 0 0 2px rgba(110,62,8,.35), 0 3px 6px -3px rgba(26,23,20,.4); }
    .cd-box-cap { display: flex; justify-content: space-between; gap: 12px; margin-top: 18px; font-size: 13px; color: #5A5249; }
    .cd-box-cap b { color: #1A1714; }
    .cd-h3 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: clamp(24px, 2.6vw, 32px); line-height: 1.15; color: #1A1714; letter-spacing: -0.01em; margin-bottom: 12px; }
    .cd-ladder { display: grid; gap: 12px; }
    .cd-row { border-radius: 1.5rem; padding: 20px 22px; background: #FDFBF7; box-shadow: inset 0 0 0 1px #EDE8DF; }
    .cd-row.is-best { background: #1A1714; box-shadow: none; }
    .cd-row-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 16px; color: #1A1714; }
    .cd-row.is-best .cd-row-top, .cd-row.is-best .cd-row-num b { color: #FDFBF7; }
    .cd-save { font-size: 12px; font-weight: 600; color: #1A1714; background: #F4C77D; border-radius: 999px; padding: 3px 10px; white-space: nowrap; }
    .cd-bar { height: 8px; border-radius: 999px; background: #EDE5D8; margin: 14px 0 10px; overflow: hidden; }
    .cd-bar span { display: block; height: 100%; border-radius: 999px; background: #C4841D; }
    .cd-row.is-best .cd-bar { background: rgba(253,251,247,.14); }
    .cd-row-num { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 16px; font-size: 14px; color: #6B6158; }
    .cd-row-num b { color: #1A1714; font-weight: 600; }
    .cd-row p { margin-top: 8px; font-size: 14px; line-height: 1.55; color: #6B6158; }
    .cd-row.is-best .cd-row-num, .cd-row.is-best p { color: #CFC6BA; }
    .cd-flavors { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
    @media (max-width: 1023px) { .cd-flavors { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 639px) {
      .cd-flavors { grid-template-columns: 1fr; gap: 10px; }
      .cd-flavors .cd-flavor { display: grid; grid-template-columns: 120px 1fr; column-gap: 14px; align-items: start; padding: 10px; border-radius: 1.5rem; }
      .cd-flavors .cd-flavor-img { grid-row: 1 / span 4; border-radius: 1rem; }
      .cd-flavors .cd-flavor h4 { margin: 4px 0 4px; font-size: 18px; }
      .cd-flavors .cd-flavor p { margin: 0; }
      .cd-flavors .cd-flavor .cd-flavor-price { margin: 6px 0 8px; display: block; }
      .cd-flavors .cd-add, .cd-flavors .cd-here { margin: 0; justify-content: flex-start; }
      .cd-flavors .cd-add { justify-self: start; padding: 0 18px; }
    }
    .cd-flavor { display: flex; flex-direction: column; border-radius: 2rem; padding: 12px 12px 18px; background: #F5F0E8; }
    .cd-flavor.is-here { background: #FDFBF7; box-shadow: inset 0 0 0 2px #C4841D; }
    .cd-flavor-img { display: block; border-radius: 1.4rem; overflow: hidden; background: #F1E9DC; aspect-ratio: 1; }
    .cd-flavor-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .7s cubic-bezier(.32,.72,0,1); }
    .cd-flavor:hover .cd-flavor-img img { transform: scale(1.04); }
    .cd-flavor h4 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 19px; line-height: 1.2; margin: 14px 6px 6px; }
    .cd .cd-flavor h4 a { color: #1A1714; text-decoration: none; font-weight: 600; }
    .cd-flavor p { margin: 0 6px; font-size: 13.5px; line-height: 1.5; color: #6B6158; }
    .cd-flavor .cd-flavor-price { margin-top: 10px; margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #1A1714; flex: 1; display: flex; align-items: flex-end; }
    .cd-add { min-height: 44px; margin: 0 6px; border-radius: 999px; border: 1.5px solid #1A1714; background: transparent; font-size: 13px; font-weight: 600; color: #1A1714; cursor: pointer; transition: background .25s, color .25s; }
    .cd-add:hover { background: #1A1714; color: #FDFBF7; }
    .cd-add:disabled { opacity: .6; cursor: default; }
    .cd-here { min-height: 44px; margin: 0 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #8B5E14; }
    .cd-uses { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 768px) { .cd-uses { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; } }
    .cd-use { border-top: 2px solid #1A1714; padding-top: 18px; }
    .cd-use h4 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 21px; color: #1A1714; margin-bottom: 8px; }
    .cd-use p { font-size: 15px; line-height: 1.65; color: #5A5249; }
    .cd-use blockquote { margin-top: 14px; font-family: 'Fraunces', Georgia, serif; font-size: clamp(20px, 1.8vw, 23px); line-height: 1.45; color: #1A1714; }
    .cd-use figcaption { margin-top: 8px; font-size: 12.5px; color: #8C8175; }
    .cd-note { margin-top: 20px; font-size: 13.5px; line-height: 1.6; color: #6B6158; max-width: 46rem; }
    .cd-row-act { margin-top: 14px; min-height: 44px; padding: 0 20px; border-radius: 999px; border: 1.5px solid #1A1714; background: transparent; font-size: 13px; font-weight: 600; color: #1A1714; cursor: pointer; display: inline-flex; align-items: center; text-decoration: none; transition: background .25s, color .25s; }
    .cd .cd-row-act { color: #1A1714; text-decoration: none; }
    .cd-row-act:hover, .cd .cd-row-act:hover { background: #1A1714; color: #FDFBF7; }
    .cd-row.is-best .cd-row-act { background: #C4841D; border-color: #C4841D; color: #1A1714; }
    .cd-row.is-best .cd-row-act:hover { background: #F4C77D; border-color: #F4C77D; }
    .cd-row-act:disabled { opacity: .6; cursor: default; }
    @media (max-width: 639px) { .cd-box { padding: 16px; max-width: 360px; } .cd-grid { gap: 4px; } .cd-grid span { border-radius: 6px; } .cd-row { padding: 18px; } }
    @media (prefers-reduced-motion: reduce) { .cd-flavor-img img { transition: none; } }
  </style>
  <section id="caddy" class="cd scroll-mt-28 py-16 md:py-24 px-4 md:px-8">
    <div class="max-w-[1400px] mx-auto">
      <div class="cd-top mb-16 md:mb-24">
        <div>
          <h2 class="reveal font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-charcoal tracking-tight leading-tight mb-5">35 Stroopwafels in Every Caddy</h2>
          <p class="reveal reveal-delay-1 cd-lede">Each caddy holds ${PER_CADDY} stroopwafels, and each ${GRAMS} g stroopwafel is sealed in its own wrapper, ${(PER_CADDY * GRAMS).toLocaleString('en-CA')} g in all. At ${money(one)} a caddy, that is about ${money(each)} a stroopwafel. All five flavors are made in Canada with Canadian flour and maple syrup.</p>
          <div class="cd-facts reveal reveal-delay-2">
            <div class="cd-fact"><b>${PER_CADDY}</b><span>stroopwafels, each wrapped</span></div>
            <div class="cd-fact"><b>${GRAMS} g</b><span>each, ${(PER_CADDY * GRAMS).toLocaleString('en-CA')} g a caddy</span></div>
            <div class="cd-fact"><b>${money(each)}</b><span>each, ${money(eightEach || each)} by eight caddies</span></div>
          </div>
        </div>
        <figure class="cd-box reveal" aria-label="Diagram counting the 35 individually wrapped stroopwafels in one caddy">
          <div class="cd-grid" aria-hidden="true">${dots()}</div>
          <figcaption class="cd-box-cap"><span>One caddy, counted out</span><b>${PER_CADDY} &times; ${GRAMS} g</b></figcaption>
        </figure>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-16 md:mb-24">
        <div class="lg:col-span-5">
          <h3 class="reveal cd-h3">How Many to Buy</h3>
          <p class="reveal text-warm-gray-600 leading-relaxed mb-3">Every flavor costs the same, so a caddy is ${money(each)} a stroopwafel however you mix them. Eight caddies of one flavor take ${save} percent off each caddy, ${money(eight / 8)} instead of ${money(one)}.</p>
          <p class="reveal text-warm-gray-600 leading-relaxed">To try them first, a <a href="/products/maple-syrup-stroopwafel">box of four full-size stroopwafels</a> is $8.99. For gifts to clients or staff, see our <a href="/shop/maple-syrup-corporate-gift">corporate gifts</a>, and for every stroopwafel we sell, the <a href="/collections/maple-stroopwafels">stroopwafel collection</a>.</p>
        </div>
        <div class="lg:col-span-7 cd-ladder reveal">${ladder}
        </div>
      </div>

      <div id="caddy-flavors" class="scroll-mt-28 mb-16 md:mb-24">
        <h3 class="reveal cd-h3">Five Flavors, Side by Side</h3>
        <p class="reveal text-warm-gray-600 leading-relaxed mb-8 max-w-2xl">Same caddy, same ${PER_CADDY} wrapped stroopwafels, same price. All five are Kosher and non-GMO. Check the label on the caddy for allergens.</p>
        <div class="cd-flavors">${cards}
        </div>
      </div>

      <div>
        <h3 class="reveal cd-h3">Who Buys a Caddy</h3>
        <p class="reveal text-warm-gray-600 leading-relaxed mb-8 max-w-2xl">Three ways buyers use them, each beside what a buyer wrote in a review of the Pure Maple caddy.</p>
        <div class="cd-uses">${uses}
        </div>
      </div>
    </div>
    <script>
      (function () {
        var btns = Array.prototype.slice.call(document.querySelectorAll('#caddy .cd-add, #caddy button.cd-row-act'));
        // Stock is checked live, so a flavor that sells out after the bake shows Sold out instead of failing on a tap.
        var ids = btns.map(function (b) { return b.getAttribute('data-variant-id'); });
        fetch('https://maple-terroir.myshopify.com/api/2026-01/graphql.json', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': '59618e3b6f5e626df6c5f527b4972d3d' }, body: JSON.stringify({ query: 'query($ids:[ID!]!){ nodes(ids:$ids){ ... on ProductVariant { id availableForSale } } }', variables: { ids: ids } }) })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            ((res.data && res.data.nodes) || []).forEach(function (n) {
              if (!n || n.availableForSale) return;
              btns.forEach(function (b) { if (b.getAttribute('data-variant-id') === n.id) { b.disabled = true; b.textContent = 'Sold out for now'; } });
            });
          }).catch(function () {});
        btns.forEach(function (b) {
          var label = b.textContent;
          b.addEventListener('click', function () {
            if (!window.MapleCart) { location.href = b.closest('.cd-flavor') ? b.closest('.cd-flavor').querySelector('h4 a').href : '#pdp-atc'; return; }
            b.disabled = true; b.textContent = 'Adding';
            Promise.resolve(window.MapleCart.addLine(b.getAttribute('data-variant-id'), 1)).then(function () { b.textContent = 'Added'; }, function () { b.disabled = false; b.textContent = label; });
          });
        });
      })();
    </script>
  </section>
  <!-- CADDY:END -->`;
}

const list = await load();
for (const f of list) {
  const file = join(ROOT, 'products', f.handle + '.html');
  let html = readFileSync(file, 'utf8');
  const out = block(list, f.handle);
  const s = html.indexOf('<!-- CADDY:START'), e = html.indexOf('<!-- CADDY:END -->');
  if (s >= 0 && e > s) {
    html = html.slice(0, s) + out + html.slice(e + '<!-- CADDY:END -->'.length);
  } else {
    const anchor = '<!-- BEFORE / AFTER SLIDER';
    const at = html.indexOf(anchor);
    if (at < 0) throw new Error(`${f.handle}: no place for the caddy block`);
    html = html.slice(0, at) + out + '\n\n\n  ' + html.slice(at);
  }
  writeFileSync(file, html);
  console.log(`caddy block: products/${f.handle}.html${f.inStock ? '' : ' (sold out)'}`);
}
