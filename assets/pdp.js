// Product page helpers, one copy for all 40 /products/<handle> pages (October 4, 2026).
// Each product page still carries its own inline script from scripts/build-products.mjs;
// that script calls into this file for the parts below, so a change here reaches every
// product page at once. Built from the product page audit of October 4, 2026:
//
//   chip(v, variants, handle)   the pack buttons, in plain numbers. Shopify's variant names
//                               ("250ml x 12 ($13.50 ea./10% Off!)") are written for a
//                               spreadsheet, and some state the wrong saving: the 48-box
//                               stroopwafel pack says 25% off where its price saves 33%. So
//                               the count comes from the name and every price, per-item
//                               price and saving is worked out from Shopify's own prices.
//   select(v, variants, handle) the price line under the title and the shipping note,
//                               each time a pack is picked.
//   related(handle)             suggestions that fit the product, sold-out ones left out,
//                               in place of the same four products on every page.
//   soldOut(handle)             on a product with nothing in stock, the nearest product
//                               that is in stock, under the button.
(function () {
  var FREE_SHIPPING_CAD = 99; // the same line as assets/shared.js and the banner; change all together
  var API = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
  var TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';
  var esc = function (s) { return (window.MapleEsc || String)(s); };

  // The pack buttons carry two lines now, so they sit in a grid instead of a row of pills.
  // Styles live here with the code that draws the buttons; the page's own CSS still sets
  // the colors and the active and sold-out states.
  var st = document.createElement('style');
  st.textContent =
    '#variant-picker{display:grid;grid-template-columns:repeat(auto-fill,minmax(9.75rem,1fr));gap:0.5rem}' +
    '.variant-btn{display:flex;flex-direction:column;align-items:flex-start;gap:0.15rem;border-radius:0.9rem;padding:0.65rem 0.9rem;white-space:normal;text-align:left;min-height:44px}' +
    '.variant-btn.sold-out{text-decoration:none}' +
    '.vb-qty{display:flex;align-items:center;justify-content:space-between;gap:0.5rem;width:100%;font-size:0.85rem;font-weight:600;color:#1A1714}' +
    '.vb-save{font-size:0.66rem;font-weight:600;letter-spacing:0.02em;color:#8A5A12;background:rgba(196,132,29,0.12);border-radius:100px;padding:0.1rem 0.45rem;white-space:nowrap}' +
    '.vb-sub{font-size:0.72rem;font-weight:400;color:#6B6158;line-height:1.35}' +
    '.pdp-nearest{display:flex;gap:0.9rem;align-items:center;margin:0 0 1.5rem;padding:0.75rem;border:1px solid #EDE8DF;border-radius:1rem;text-decoration:none;transition:border-color .25s}' +
    '.pdp-nearest:hover{border-color:#C4841D}' +
    '.pdp-nearest img{width:64px;height:64px;border-radius:0.75rem;object-fit:cover;background:#F1E9DC;flex-shrink:0}' +
    '.pdp-nearest-k{display:block;font-size:0.72rem;color:#6B6158}' +
    '.pdp-nearest b{display:block;font-size:0.88rem;color:#1A1714;font-weight:600}' +
    '.pdp-nearest-p{font-size:0.75rem;color:#6B6158}' +
    '#pdp-mix{margin:0 0 2rem;padding:1rem 1.1rem;border-radius:1rem;background:#F5F0E8}' +
    '.pdp-mix-k{font-size:0.88rem;font-weight:600;color:#1A1714}' +
    '.pdp-mix-t{font-size:0.8rem;color:#6B6158;margin:0.15rem 0 0.6rem}' +
    '.pdp-mix-row{display:flex;align-items:center;gap:0.75rem;padding:0.45rem 0;border-top:1px solid rgba(217,209,196,0.6)}' +
    '.pdp-mix-row img{width:48px;height:48px;border-radius:0.6rem;object-fit:cover;background:#F1E9DC;display:block}' +
    '.pdp-mix-name{flex:1;font-size:0.82rem;color:#1A1714;text-decoration:none;line-height:1.3}' +
    '.pdp-mix-name span{display:block;font-size:0.75rem;color:#6B6158}' +
    '.pdp-mix-add{min-height:44px;padding:0 1rem;border-radius:100px;border:1.5px solid #1A1714;background:transparent;font-size:0.78rem;font-weight:600;color:#1A1714;cursor:pointer;white-space:nowrap}' +
    '.pdp-mix-add:hover{background:#1A1714;color:#FDFBF7}' +
    '.pdp-mix-add:disabled{opacity:0.6;cursor:default}';
  document.head.appendChild(st);
  var money = function (n) { return '$' + n.toFixed(2); };

  // ---------------------------------------------------------------- packs
  function count(title) {
    var m = String(title).match(/x\s*(\d+)/i) || String(title).match(/^(\d+)\s*bags?\b/i);
    return m ? parseInt(m[1], 10) : 1;
  }
  function noun(handle, n) {
    var u = /jug/.test(handle) ? ['jug', 'jugs']
      : /caddy/.test(handle) ? ['caddy', 'caddies']
      : /jar/.test(handle) ? ['jar', 'jars']
      : /coffee|popcorn/.test(handle) ? ['bag', 'bags']
      : /\d+ml|first-tap|bottle/.test(handle) ? ['bottle', 'bottles']
      : ['box', 'boxes'];
    return n === 1 ? u[0] : u[1];
  }
  // The per-item price of the smallest pack is what every bigger pack is measured against.
  function base(variants) {
    var b = null;
    variants.forEach(function (v) {
      var c = count(v.title), each = parseFloat(v.priceV2.amount) / c;
      if (!b || c < b.c) b = { c: c, each: each };
    });
    return b;
  }
  function pack(v, variants, handle) {
    var c = count(v.title), price = parseFloat(v.priceV2.amount), each = price / c, b = base(variants);
    var save = b && c > b.c ? Math.round((1 - each / b.each) * 100) : 0;
    return { count: c, price: price, each: each, save: save, unit: noun(handle, 1), label: c + ' ' + noun(handle, c) };
  }
  function packed(variants) { return !(variants.length === 1 && variants[0].title === 'Default Title'); }

  function chip(v, variants, handle) {
    var p = pack(v, variants, handle);
    var sub = !v.availableForSale ? 'Sold out'
      : p.count === 1 ? money(p.price)
      : money(p.price) + ' · ' + money(p.each) + ' each';
    var tag = v.availableForSale && p.save > 0 ? '<span class="vb-save">Save ' + p.save + '%</span>' : '';
    return '<span class="vb-qty">' + esc(p.label) + tag + '</span><span class="vb-sub">' + sub + '</span>';
  }

  // ---------------------------------------------------------------- price line and shipping note
  function cartSubtotal() {
    var footer = document.getElementById('cart-footer');
    var el = document.getElementById('cart-subtotal');
    if (!el || (footer && footer.style.display === 'none')) return 0;
    var n = parseFloat(String(el.textContent).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  var current = null;
  function shipNote() {
    var el = document.getElementById('pdp-ship-note');
    if (!el || !current) return;
    var cart = cartSubtotal(), text = '';
    if (current.price >= FREE_SHIPPING_CAD) text = 'This pack ships free.';
    else if (cart >= FREE_SHIPPING_CAD) text = 'Your cart already ships free.';
    else if (cart > 0) text = 'Your cart is at ' + money(cart) + '. Add ' + money(FREE_SHIPPING_CAD - cart) + ' more and it ships free.';
    if (el.textContent !== text) el.textContent = text;
    el.style.display = text ? '' : 'none';
  }
  function select(v, variants, handle) {
    current = pack(v, variants, handle);
    var priceEl = document.getElementById('product-price');
    var unitEl = document.getElementById('product-unit');
    if (priceEl && !unitEl) {
      unitEl = document.createElement('span');
      unitEl.id = 'product-unit';
      unitEl.className = 'text-sm text-warm-gray-500';
      priceEl.parentNode.appendChild(unitEl);
    }
    if (unitEl) unitEl.textContent = packed(variants) && current.count > 1
      ? money(current.each) + ' per ' + current.unit + (current.save > 0 ? ', save ' + current.save + '%' : '')
      : '';
    shipNote();
  }
  // Keep the note right as the cart changes. It writes to its own element, never to the
  // cart, so it cannot set itself off (the loop shared.js once fell into).
  function watchCart() {
    var el = document.getElementById('cart-subtotal');
    if (!el) return setTimeout(watchCart, 400);
    new MutationObserver(shipNote).observe(el, { childList: true, characterData: true, subtree: true });
    var footer = document.getElementById('cart-footer');
    if (footer) new MutationObserver(shipNote).observe(footer, { attributes: true, attributeFilter: ['style'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchCart); else watchCart();

  // ---------------------------------------------------------------- related products
  var SYRUPS = ['organic-pure-maple-syrup-250ml', 'pure-maple-syrup-maple-leaf-bottle-250ml', 'organic-first-tap-nouveau-limited-edition-pure-maple-syrup-limited-edition', 'pure-maple-syrup-maple-leaf-bottle-100ml', 'pure-maple-syrup-maple-leaf-bottle-50ml', 'pure-maple-syrup-jug-100ml'];
  var CADDIES = ['pure-maple-syrup-stroopwafels-caddy', 'cocoa-chocolate-maple-stroopwafels-caddy', 'wild-blueberry-maple-stroopwafels-caddy', 'strawberry-cream-maple-stroopwafels-caddy', 'matcha-green-tea-maple-stroopwafels-caddy'];
  var STROOP = ['maple-syrup-stroopwafel', 'maple-syrup-mini-stroopwafel'].concat(CADDIES);
  var COOKIES = ['maple-leaf-mini-shortbread-cookies', 'maple-sugar-sea-salt-cookies', 'maple-syrup-blueberry-cookies', 'maple-syrup-cream-cookies-350g', 'hello-kitty-maple-cream-cookies'];
  var SNACKS = ['cocoa-dark-chocolate-covered-maple-roasted-almonds', 'maple-syrup-milk-chocolate-covered-almonds', 'dark-chocolate-covered-cranberry-pure-maple-syrup', 'dark-chocolate-covered-cherry-pure-maple-syrup', 'dark-chocolate-covered-blueberry-pure-maple-syrup', 'handcrafted-pure-maple-syrup-butter-popcorn', 'maple-syrup-sea-salt-roasted-peanuts'];
  var DRINKS = ['maple-ceylon-tea', 'maple-syrup-medium-dark-roast-ground-coffee', 'blueberry-ceylon-tea'];
  var PANTRY = ['organic-maple-cream-butter-jar', 'organic-pure-maple-sugar', 'pure-maple-syrup-candy', 'pure-maple-syrup-caramel'];
  var SETS = ['maple-extravaganza-gift-set', 'maple-treat-home-set', 'maple-tea-party-home-set', 'maple-organic-heaven-home-set', 'maple-enthusiast-home-set', 'maple-frenzy-home-set', 'maple-indulge-home-set', 'maple-mega-combo-gift-set'];
  // For each kind of product: things that go with it, and the alternatives a shopper
  // might want instead. Each row shows its first four products that are in stock.
  function groups(h) {
    var inn = function (list) { return list.indexOf(h) !== -1; };
    if (inn(SYRUPS)) return [
      { title: 'Goes well with it', list: ['pure-maple-syrup-stroopwafels-caddy', 'organic-maple-cream-butter-jar', 'maple-syrup-medium-dark-roast-ground-coffee', 'maple-leaf-mini-shortbread-cookies', 'maple-syrup-stroopwafel'] },
      { title: 'Our other maple syrups', list: SYRUPS }];
    if (inn(STROOP)) return [
      { title: 'Goes well with it', list: ['maple-syrup-medium-dark-roast-ground-coffee', 'maple-ceylon-tea', 'organic-pure-maple-syrup-250ml', 'pure-maple-syrup-maple-leaf-bottle-250ml'] },
      { title: 'More stroopwafels', list: STROOP }];
    if (inn(COOKIES)) return [
      { title: 'Goes well with it', list: ['maple-ceylon-tea', 'maple-syrup-medium-dark-roast-ground-coffee', 'organic-maple-cream-butter-jar', 'maple-syrup-stroopwafel'] },
      { title: 'More cookies', list: COOKIES.concat(['maple-syrup-mini-stroopwafel']) }];
    if (inn(SNACKS)) return [{ title: 'More maple snacks', list: SNACKS.concat(['maple-syrup-stroopwafel', 'pure-maple-syrup-caramel']) }];
    if (inn(DRINKS)) return [
      { title: 'Goes well with it', list: ['pure-maple-syrup-stroopwafels-caddy', 'maple-leaf-mini-shortbread-cookies', 'maple-sugar-sea-salt-cookies', 'maple-syrup-mini-stroopwafel', 'organic-pure-maple-syrup-250ml'] },
      { title: 'Our other teas and coffee', list: DRINKS }];
    if (inn(PANTRY)) return [
      { title: 'Goes well with it', list: ['organic-pure-maple-syrup-250ml', 'maple-syrup-stroopwafel', 'maple-leaf-mini-shortbread-cookies', 'maple-syrup-medium-dark-roast-ground-coffee'] },
      { title: 'More maple treats', list: PANTRY.concat(['pure-maple-syrup-maple-leaf-bottle-250ml']) }];
    if (inn(SETS)) return [{ title: 'Our other gift and home sets', list: SETS }];
    return [{ title: 'You may also like', list: ['organic-pure-maple-syrup-250ml', 'pure-maple-syrup-stroopwafels-caddy', 'organic-maple-cream-butter-jar', 'maple-leaf-mini-shortbread-cookies'] }];
  }
  function fetchProducts(handles) {
    var q = handles.map(function (h, i) {
      return 'p' + i + ': product(handle: ' + JSON.stringify(h) + ') { handle title availableForSale variants(first: 1) { edges { node { priceV2 { amount } } } } }';
    }).join(' ');
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN }, body: JSON.stringify({ query: '{ ' + q + ' }' }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var by = {};
        Object.keys(res.data || {}).forEach(function (k) { var p = res.data[k]; if (p) by[p.handle] = p; });
        return by;
      });
  }
  function cardImg(h) {
    var v = (window.MT_CARD_V || {})[h];
    return '/assets/images/cards/' + h + '.webp' + (v ? '?v=' + v : '');
  }
  function card(p) {
    var price = p.variants.edges.length ? parseFloat(p.variants.edges[0].node.priceV2.amount) : null;
    return '<a href="/products/' + p.handle + '" class="rec-card group block">' +
      '<div class="aspect-square rounded-2xl overflow-hidden mb-3 bg-cream-dark ring-1 ring-warm-gray-200/30">' +
      '<img src="' + cardImg(p.handle) + '" alt="' + esc(p.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width="400" height="400"></div>' +
      '<h3 class="font-medium text-sm text-charcoal mb-1">' + esc(p.title) + '</h3>' +
      (price !== null ? '<p class="text-xs text-warm-gray-500">' + money(price) + ' CAD</p>' : '') + '</a>';
  }
  function related(handle) {
    var rec = document.getElementById('recommendations');
    if (!rec) return;
    var gs = groups(handle), all = [];
    gs.forEach(function (g) { g.list.forEach(function (h) { if (h !== handle && all.indexOf(h) === -1) all.push(h); }); });
    fetchProducts(all).then(function (by) {
      var used = {}, first = true;
      var heading = rec.parentNode.querySelector('h2');
      gs.forEach(function (g) {
        var picks = g.list.filter(function (h) { return h !== handle && !used[h] && by[h] && by[h].availableForSale; }).slice(0, 4);
        if (!picks.length) return;
        picks.forEach(function (h) { used[h] = 1; });
        var html = picks.map(function (h) { return card(by[h]); }).join('');
        if (first) {
          if (heading) heading.textContent = g.title;
          rec.innerHTML = html;
          first = false;
        } else {
          var h2 = document.createElement('h2');
          h2.className = heading ? heading.className + ' mt-16' : 'font-display text-2xl md:text-3xl font-semibold text-charcoal tracking-tight mb-10 mt-16';
          h2.textContent = g.title;
          var grid = document.createElement('div');
          grid.className = rec.className;
          grid.innerHTML = html;
          rec.parentNode.appendChild(h2);
          rec.parentNode.appendChild(grid);
        }
      });
      if (first) rec.closest('section').style.display = 'none';
    }).catch(function () { rec.innerHTML = ''; });
  }

  // ---------------------------------------------------------------- sold out
  var NEAREST = {
    'pure-maple-syrup-maple-leaf-bottle-50ml': 'pure-maple-syrup-maple-leaf-bottle-250ml',
    'pure-maple-syrup-maple-leaf-bottle-100ml': 'pure-maple-syrup-maple-leaf-bottle-250ml',
    'pure-maple-syrup-jug-100ml': 'pure-maple-syrup-maple-leaf-bottle-250ml',
    'maple-syrup-milk-chocolate-covered-almonds': 'cocoa-dark-chocolate-covered-maple-roasted-almonds',
    'pure-maple-syrup-candy': 'organic-pure-maple-sugar',
    'pure-maple-syrup-caramel': 'organic-maple-cream-butter-jar',
    'maple-syrup-cream-cookies-350g': 'maple-leaf-mini-shortbread-cookies',
    'hello-kitty-maple-cream-cookies': 'maple-leaf-mini-shortbread-cookies',
    'matcha-green-tea-maple-stroopwafels-caddy': 'pure-maple-syrup-stroopwafels-caddy'
  };
  function soldOut(handle) {
    var alt = NEAREST[handle], atc = document.getElementById('pdp-atc');
    if (!alt || !atc || document.getElementById('pdp-nearest')) return;
    fetchProducts([alt]).then(function (by) {
      var p = by[alt];
      if (!p || !p.availableForSale) return;
      var price = parseFloat(p.variants.edges[0].node.priceV2.amount);
      var box = document.createElement('a');
      box.id = 'pdp-nearest';
      box.href = '/products/' + p.handle;
      box.className = 'pdp-nearest';
      box.innerHTML = '<img src="' + cardImg(p.handle) + '" alt="" width="64" height="64">' +
        '<span><span class="pdp-nearest-k">Sold out for now. The closest one in stock:</span>' +
        '<b>' + esc(p.title) + '</b><span class="pdp-nearest-p">' + money(price) + ' CAD</span></span>';
      atc.parentNode.insertBefore(box, atc.nextSibling);
    }).catch(function () {});
  }

  // ---------------------------------------------------------------- mix three caddies, top up a set
  // From the who-buys read of October 4, 2026: 10 of the 50 orders in 90 days were exactly three
  // caddies at $119.97, just over the free shipping line, and most caddy orders mixed flavors.
  // So each caddy page offers the other flavors one tap away, and a set under $99 offers the one
  // caddy that takes the order past it. Baked placeholder: <div id="pdp-mix" data-mode="caddy|topup">.
  function addVariant(btn, id) {
    if (!window.MapleCart || !id) return;
    btn.disabled = true; btn.textContent = 'Adding';
    Promise.resolve(window.MapleCart.addLine(id, 1)).then(function () { btn.textContent = 'Added'; }, function () { btn.disabled = false; btn.textContent = '+ Add'; });
  }
  function mixRow(p, v) {
    return '<div class="pdp-mix-row"><a href="/products/' + p.handle + '"><img src="' + cardImg(p.handle) + '" alt="" width="48" height="48"></a>' +
      '<a class="pdp-mix-name" href="/products/' + p.handle + '">' + esc(p.title) + '<span>' + money(parseFloat(v.priceV2.amount)) + '</span></a>' +
      '<button type="button" class="pdp-mix-add" data-variant-id="' + v.id + '">+ Add</button></div>';
  }
  function mix() {
    var el = document.getElementById('pdp-mix');
    if (!el) return;
    var handle = window.__PRODUCT_HANDLE__ || '', mode = el.getAttribute('data-mode');
    var list = mode === 'caddy' ? CADDIES.filter(function (h) { return h !== handle; }) : ['pure-maple-syrup-stroopwafels-caddy'];
    var q = list.map(function (h, i) {
      return 'p' + i + ': product(handle: ' + JSON.stringify(h) + ') { handle title availableForSale variants(first: 1) { edges { node { id availableForSale priceV2 { amount } } } } }';
    }).join(' ') + (mode === 'topup' ? ' self: product(handle: ' + JSON.stringify(handle) + ') { variants(first: 1) { edges { node { priceV2 { amount } } } } }' : '');
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN }, body: JSON.stringify({ query: '{ ' + q + ' }' }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var d = res.data || {}, rows = [], first = null;
        Object.keys(d).forEach(function (k) {
          if (k === 'self' || !d[k] || !d[k].availableForSale) return;
          var v = d[k].variants.edges[0] && d[k].variants.edges[0].node;
          if (!v || !v.availableForSale) return;
          if (!first) first = v;
          rows.push(mixRow(d[k], v));
        });
        if (!rows.length) return;
        var head;
        if (mode === 'caddy') {
          var three = first ? money(parseFloat(first.priceV2.amount) * 3) : '';
          head = '<p class="pdp-mix-k">Mix three flavors</p><p class="pdp-mix-t">Three caddies come to ' + three + ' and ship free. Add another flavor:</p>';
        } else {
          var self = d.self && d.self.variants.edges[0] ? parseFloat(d.self.variants.edges[0].node.priceV2.amount) : 0;
          if (!self || self >= FREE_SHIPPING_CAD) return;
          head = '<p class="pdp-mix-k">Ship it free</p><p class="pdp-mix-t">This set is ' + money(self) + '. Add one caddy of stroopwafels and the order passes $' + FREE_SHIPPING_CAD + ' and ships free.</p>';
        }
        el.innerHTML = head + rows.slice(0, 4).join('');
        el.style.display = '';
        el.querySelectorAll('.pdp-mix-add').forEach(function (b) { b.addEventListener('click', function () { addVariant(b, b.getAttribute('data-variant-id')); }); });
      }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mix); else mix();

  window.MTPdp = { chip: chip, select: select, related: related, soldOut: soldOut, packed: packed };
})();
