// The cart, one copy for every page (Liam, October 3, 2026: "we should use 1
// component and reuse it across all pages"). It used to be pasted into 82 pages
// in two spellings, and 33 pages had none, so their nav had no cart button.
// This file adds the drawer's styles and markup to the page, then defines
// MapleCart: toggle, addFromBtn (product card buttons), addLine and renderBadge
// (product pages), checkout. Every page loads it where the inline copy used to
// sit, before any page script that calls MapleCart. Under the cart lines it shows
// the free shipping top-up row, and after each add it stamps the visit on the cart.
(function () {
  if (!document.getElementById('mt-cart-css')) {
    var st = document.createElement('style');
    st.id = 'mt-cart-css';
    st.textContent = ".cart-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(26,23,20,0.35); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1); }\n.cart-overlay.open { opacity: 1; pointer-events: all; }\n.cart-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 90vw); background: #FDFBF7; z-index: 201; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1); display: flex; flex-direction: column; }\n.cart-drawer.open { transform: translateX(0); box-shadow: -16px 0 48px rgba(26,23,20,0.12); }\n.cart-header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 1.75rem; border-bottom: 1px solid rgba(217,209,196,0.4); }\n.cart-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.4rem; font-weight: 500; color: #1A1714; }\n.cart-close { width: 2.2rem; height: 2.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s; color: #8C8175; background: none; border: none; cursor: pointer; }\n.cart-close:hover { background: rgba(26,23,20,0.06); color: #1A1714; }\n.cart-items { flex: 1; overflow-y: auto; padding: 1rem 1.75rem; }\n.cart-empty { text-align: center; padding: 4rem 1rem; color: #B8AD9E; font-size: 0.9rem; }\n.cart-item { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid rgba(217,209,196,0.3); }\n.cart-item:last-child { border-bottom: none; }\n.cart-item-img { width: 72px; height: 72px; border-radius: 0.75rem; object-fit: cover; background: #F5F0E8; flex-shrink: 0; }\n.cart-item-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }\n.cart-item-name { font-family: 'Fraunces', Georgia, serif; font-size: 1rem; font-weight: 500; color: #1A1714; line-height: 1.3; }\n.cart-item-variant { font-size: 0.72rem; color: #8C8175; letter-spacing: 0.02em; }\n.cart-item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }\n.cart-item-qty { display: flex; align-items: center; border: 1px solid rgba(217,209,196,0.5); border-radius: 100px; overflow: hidden; }\n.cart-item-qty button { width: 2.75rem; height: 2.75rem; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; color: #8C8175; background: none; border: none; cursor: pointer; transition: background 0.15s, color 0.15s; }\n.cart-item-qty button:hover { background: rgba(26,23,20,0.06); color: #1A1714; }\n.cart-item-qty span { min-width: 1.5rem; text-align: center; font-size: 0.78rem; font-weight: 500; color: #1A1714; }\n.cart-item-price { font-family: 'Fraunces', Georgia, serif; font-size: 1rem; font-weight: 500; color: #1A1714; }\n.cart-footer { padding: 1.25rem 1.75rem 1.75rem; border-top: 1px solid rgba(217,209,196,0.4); }\n.cart-subtotal { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }\n.cart-subtotal-label { font-size: 0.82rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: #8C8175; }\n.cart-subtotal-price { font-family: 'Fraunces', Georgia, serif; font-size: 1.4rem; font-weight: 500; color: #1A1714; }\n.cart-note { font-size: 0.72rem; line-height: 1.45; color: #6B6158; margin-bottom: 1rem; }\n.cart-checkout-btn { display: flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%; padding: 1rem; border-radius: 100px; background: #1A1714; color: #FDFBF7; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 0.88rem; font-weight: 500; letter-spacing: 0.04em; border: none; cursor: pointer; transition: background 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.2s; }\n.cart-checkout-btn:hover { background: #C4841D; transform: translateY(-1px); }\n.cart-checkout-btn:active { transform: scale(0.98); }\n.nav-cart-count { position: absolute; top: -2px; right: -4px; min-width: 17px; height: 17px; border-radius: 100px; background: #C4841D; color: #fff; font-size: 0.6rem; font-weight: 600; display: flex; align-items: center; justify-content: center; padding: 0 4px; opacity: 0; transform: scale(0.5); transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1), transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); pointer-events: none; }\n.nav-cart-count.visible { opacity: 1; transform: scale(1); }\n.cart-topup { margin-top: 1rem; padding: 0.9rem 1rem; border-radius: 1rem; background: #F5F0E8; }\n.cart-topup-k { font-size: 0.82rem; font-weight: 600; color: #1A1714; margin-bottom: 0.35rem; }\n.cart-topup-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-top: 1px solid rgba(217,209,196,0.6); }\n.cart-topup-row img { width: 48px; height: 48px; border-radius: 0.6rem; object-fit: cover; background: #F1E9DC; flex-shrink: 0; }\n.cart-topup-name { flex: 1; font-size: 0.82rem; color: #1A1714; line-height: 1.3; }\n.cart-topup-name span { display: block; font-size: 0.75rem; color: #6B6158; }\n.cart-topup-add { min-height: 44px; padding: 0 1rem; border-radius: 100px; border: 1.5px solid #1A1714; background: transparent; font-size: 0.78rem; font-weight: 600; color: #1A1714; cursor: pointer; white-space: nowrap; }\n.cart-topup-add:hover { background: #1A1714; color: #FDFBF7; }\n.cart-topup-add:disabled { opacity: 0.6; cursor: default; }\n.mt-soldout, .mt-soldout:hover { opacity: 0.55; cursor: not-allowed; transform: none; }\n.mt-several { font-size: 0.8125rem; line-height: 1.45; color: #6B6158; margin: 0 0 0.85rem; }\n.mt-several-btn { border: 0; background: none; padding: 0; font: inherit; font-weight: 600; color: #1A1714; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }\n.mt-several-btn:hover { color: #C4841D; }\n.mt-multi-row, .mt-multi-hint, .mt-multi-msg { display: none; }\n.mt-multi-on .mt-multi-row { display: flex; justify-content: space-between; font-size: 0.82rem; color: #6B6158; margin-bottom: 0.35rem; font-variant-numeric: tabular-nums; }\n.mt-multi-on .mt-multi-hint { display: block; font-size: 0.72rem; line-height: 1.45; color: #6B6158; margin-bottom: 1rem; }\n.mt-multi-on .mt-multi-msg { display: block; font-size: 0.78rem; color: #A3361F; margin: 0.6rem 0 0; }\n.mt-multi-on .mt-several, .mt-multi-on .cart-note, .mt-multi-on #cart-ship-progress, .mt-multi-on #cart-topup, .mt-multi-on .cart-items > .cart-item { display: none !important; }\n.mtm-person { padding: 1.25rem 0; border-bottom: 1px solid rgba(26,23,20,0.5); }\n.mtm-person:first-child { padding-top: 0.25rem; }\n.mtm-person.is-active { box-shadow: inset 3px 0 0 #C4841D; padding-left: 0.9rem; }\n.mtm-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem; }\n.mtm-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.15rem; font-weight: 500; color: #1A1714; }\n.mtm-tag { font-size: 0.72rem; font-weight: 600; color: #A86A12; white-space: nowrap; }\n.mtm-form { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.6rem; margin-bottom: 0.5rem; }\n.mtm-field { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }\n.mtm-field--wide, .mtm-done { grid-column: 1 / -1; }\n.mtm-field label, .mtm-label { font-size: 0.72rem; font-weight: 600; color: #6B6158; }\n.mtm-field input, .mtm-field select, .mtm-person textarea { width: 100%; min-height: 44px; padding: 0.5rem 0.7rem; border: 1px solid rgba(26,23,20,0.18); border-radius: 0.75rem; background: #fff; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 16px; color: #1A1714; }\n.mtm-person textarea { min-height: 0; resize: vertical; margin-top: 0.25rem; display: block; }\n.mtm-btn { min-height: 44px; padding: 0 1.1rem; border-radius: 100px; border: 1.5px solid #1A1714; background: transparent; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 0.8rem; font-weight: 600; color: #1A1714; cursor: pointer; white-space: nowrap; }\n.mtm-btn:hover { background: #1A1714; color: #FDFBF7; }\n.mtm-done { justify-self: start; }\n.mtm-addr { font-size: 0.85rem; line-height: 1.5; color: #1A1714; margin: 0 0 0.2rem; }\n.mtm-link { border: 0; background: none; padding: 0.3rem 0; min-height: 32px; font-family: inherit; font-size: 0.78rem; color: #6B6158; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }\n.mtm-link:hover { color: #A86A12; }\n.mtm-item { border-bottom: 1px solid rgba(217,209,196,0.3); }\n.mtm-item .cart-item-info { min-width: 0; }\n.mtm-move { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem; font-size: 0.72rem; color: #6B6158; }\n.mtm-move select { flex: 1; min-width: 0; min-height: 36px; padding: 0.3rem 0.5rem; border: 1px solid rgba(26,23,20,0.18); border-radius: 0.6rem; background: #fff; font-family: inherit; font-size: 0.78rem; color: #1A1714; }\n.mtm-empty { font-size: 0.85rem; color: #6B6158; padding: 0.6rem 0; }\n.mtm-acts { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0 0.6rem; }\n.mtm-ship { font-size: 0.75rem; color: #6B6158; margin: 0 0 0.6rem; }\n.mtm-remove { display: block; margin-top: 0.4rem; }\n.mtm-tail { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; padding: 1.25rem 0 1.5rem; }";
    document.head.appendChild(st);
  }
  if (!document.getElementById('cart-drawer')) {
    var wrap = document.createElement('div');
    wrap.innerHTML = "<div class=\"cart-overlay\" id=\"cart-overlay\"></div><aside class=\"cart-drawer\" id=\"cart-drawer\" role=\"dialog\" aria-label=\"Shopping cart\"><div class=\"cart-header\"><h2 class=\"cart-title\">Your Cart</h2><button class=\"cart-close\" aria-label=\"Close cart\" onclick=\"MapleCart.toggle()\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg></button></div><div class=\"cart-items\" id=\"cart-items\"><div class=\"cart-empty\" id=\"cart-empty\"><p style=\"font-size:2rem;opacity:0.3;margin-bottom:1rem;\"></p><p>Your cart is empty</p></div></div><div class=\"cart-footer\" id=\"cart-footer\" style=\"display:none;\"><div class=\"cart-subtotal\"><span class=\"cart-subtotal-label\">Subtotal</span><span class=\"cart-subtotal-price\" id=\"cart-subtotal\">$0.00</span></div><p class=\"cart-note\">Ships to every Canadian province in 3 to 9 business days, $19.99 under $99. Canadian addresses only. Free pickup in Vancouver: choose it at checkout.</p><button class=\"cart-checkout-btn\" id=\"cart-checkout\" onclick=\"MapleCart.checkout()\">Checkout<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg></button></div></aside>";
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }
})();

window.MapleCart = (function () {
  var STOREFRONT_URL = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
  var STOREFRONT_TOKEN = '59618e3b6f5e626df6c5f527b4972d3d';
  var cartId = localStorage.getItem('maple_cart_id') || null;
  var cartData = null;
  var pendingTimers = {}; // per-line debounce so rapid +/- clicks coalesce into one API call
  var pendingRuns = {}; // the waiting update per line, so Checkout can send it first
  var CART_FRAGMENT = 'id checkoutUrl lines(first:50){edges{node{id quantity merchandise{...on ProductVariant{id title priceV2{amount currencyCode}image{url altText}product{title}}}}}}cost{subtotalAmount{amount currencyCode}}';
  function gql(query, variables) { return fetch(STOREFRONT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN }, body: JSON.stringify({ query: query, variables: variables || {} }) }).then(function (r) { return r.json(); }); }
  function createCart(variantId, qty) { return gql('mutation($lines:[CartLineInput!]!){cartCreate(input:{lines:$lines}){cart{' + CART_FRAGMENT + '}userErrors{field message}}}', { lines: [{ merchandiseId: variantId, quantity: qty || 1 }] }).then(function (res) { cartData = res.data.cartCreate.cart; cartId = cartData.id; localStorage.setItem('maple_cart_id', cartId); return cartData; }); }
  // Where this visit began, kept for the order (October 23, 2026). The purchase reaches PostHog
  // and GA4 from the Shopify checkout with nothing linking it to the visit, so no sale could be
  // tied to a page or a source. The cart now carries the visit's first page, its referring site
  // and the PostHog ids as hidden attributes (keys starting with "_"), which Shopify keeps on the
  // order under Additional details. Last visit wins. Written after an add succeeds, never inside
  // it, so a failure here can never stop a cart.
  try { if (!sessionStorage.getItem('mt_landing')) { sessionStorage.setItem('mt_landing', (location.pathname + location.search).slice(0, 250)); sessionStorage.setItem('mt_ref', (document.referrer || '(direct)').slice(0, 250)); } } catch (e) {}
  function stampVisit() {
    try {
      if (!cartId || sessionStorage.getItem('mt_stamped') === cartId) return;
      var ph = window.posthog, attrs = [{ key: '_landing_page', value: sessionStorage.getItem('mt_landing') || '' }, { key: '_referrer', value: sessionStorage.getItem('mt_ref') || '' }];
      if (ph && typeof ph.get_distinct_id === 'function') attrs.push({ key: '_ph_distinct_id', value: String(ph.get_distinct_id() || '') });
      if (ph && typeof ph.get_session_id === 'function') attrs.push({ key: '_ph_session_id', value: String(ph.get_session_id() || '') });
      var id = cartId;
      gql('mutation($cartId:ID!,$attributes:[AttributeInput!]!){cartAttributesUpdate(cartId:$cartId,attributes:$attributes){userErrors{message}}}', { cartId: id, attributes: attrs.filter(function (a) { return a.value; }) })
        .then(function (res) { if (res && res.data && res.data.cartAttributesUpdate && !res.data.cartAttributesUpdate.userErrors.length) sessionStorage.setItem('mt_stamped', id); }).catch(function () {});
    } catch (e) {}
  }
  function addLine(variantId, qty) { return addLineRaw(variantId, qty).then(function (c) { stampVisit(); return c; }); }
  function addLineRaw(variantId, qty) { if (!cartId) return createCart(variantId, qty); return gql('mutation($cartId:ID!,$lines:[CartLineInput!]!){cartLinesAdd(cartId:$cartId,lines:$lines){cart{' + CART_FRAGMENT + '}userErrors{field message}}}', { cartId: cartId, lines: [{ merchandiseId: variantId, quantity: qty || 1 }] }).then(function (res) { if (res.data.cartLinesAdd.userErrors && res.data.cartLinesAdd.userErrors.length) { localStorage.removeItem('maple_cart_id'); cartId = null; return createCart(variantId, qty); } cartData = res.data.cartLinesAdd.cart; return cartData; }); }
  function updateLine(lineId, qty) { return gql('mutation($cartId:ID!,$lines:[CartLineUpdateInput!]!){cartLinesUpdate(cartId:$cartId,lines:$lines){cart{' + CART_FRAGMENT + '}}}', { cartId: cartId, lines: [{ id: lineId, quantity: qty }] }).then(function (res) { cartData = res.data.cartLinesUpdate.cart; return cartData; }); }
  function removeLine(lineId) { return gql('mutation($cartId:ID!,$lineIds:[ID!]!){cartLinesRemove(cartId:$cartId,lineIds:$lineIds){cart{' + CART_FRAGMENT + '}}}', { cartId: cartId, lineIds: [lineId] }).then(function (res) { cartData = res.data.cartLinesRemove.cart; return cartData; }); }
  function fetchCart() { if (!cartId) return Promise.resolve(null); return gql('query($id:ID!){cart(id:$id){' + CART_FRAGMENT + '}}', { id: cartId }).then(function (res) { if (!res.data.cart) { localStorage.removeItem('maple_cart_id'); cartId = null; cartData = null; return null; } cartData = res.data.cart; return cartData; }); }
  function allLines() { if (!cartData || !cartData.lines) return []; return cartData.lines.edges.map(function (e) { return e.node; }); }
  // A sold-out variant comes back from Shopify as a line at quantity 0 for $0.00, so the
  // drawer never shows a line with nothing in it (Site Audit 2.0, November 13, 2026).
  function getLines() { return allLines().filter(function (l) { return l.quantity > 0; }); }
  function getTotalQty() { return getLines().reduce(function (s, l) { return s + l.quantity; }, 0); }
  // Ships free with one more (October 23, 2026). A cart under the free shipping line shows two of
  // the most-ordered products, in stock, not already in the cart: the cheapest one that clears the
  // line first, when one does. From PostHog, May to October 2026: 61% of Canadian cart adders stayed
  // under $99 while 68% of orders are $99 or more, and the original caddy is in 54% of orders.
  var FREE_SHIPPING_CAD = 99; // the same line as assets/shared.js, assets/pdp.js and the banner; change all together
  var TOPUP = ['pure-maple-syrup-stroopwafels-caddy', 'cocoa-chocolate-maple-stroopwafels-caddy', 'maple-leaf-mini-shortbread-cookies', 'handcrafted-pure-maple-syrup-butter-popcorn'];
  var topupData = null, topupLoading = false;
  function loadTopup() {
    if (topupData || topupLoading) return; topupLoading = true;
    var q = TOPUP.map(function (h, i) { return 'p' + i + ': product(handle: ' + JSON.stringify(h) + ') { handle title availableForSale variants(first: 1) { edges { node { id availableForSale priceV2 { amount } } } } }'; }).join(' ');
    gql('{ ' + q + ' }').then(function (res) {
      var d = (res && res.data) || {};
      topupData = TOPUP.map(function (h, i) { var p = d['p' + i]; var v = p && p.availableForSale && p.variants.edges[0] && p.variants.edges[0].node; return v && v.availableForSale ? { handle: p.handle, title: p.title, id: v.id, price: parseFloat(v.priceV2.amount) } : null; }).filter(Boolean);
      renderTopup();
    }).catch(function () { topupLoading = false; });
  }
  function renderTopup() {
    var itemsEl = document.getElementById('cart-items'); if (!itemsEl) return;
    var old = document.getElementById('cart-topup'); if (old) old.remove();
    var lines = getLines(); if (!lines.length || !cartData || !cartData.cost || !cartData.cost.subtotalAmount) return;
    var gap = FREE_SHIPPING_CAD - parseFloat(cartData.cost.subtotalAmount.amount); if (gap <= 0) return;
    if (!topupData) { loadTopup(); return; }
    var inCart = {}; lines.forEach(function (l) { inCart[l.merchandise.product.title] = 1; });
    var picks = topupData.filter(function (p) { return !inCart[p.title]; }); if (!picks.length) return;
    var clears = picks.filter(function (p) { return p.price >= gap; }).sort(function (a, b) { return a.price - b.price; })[0];
    var shown = (clears ? [clears].concat(picks.filter(function (p) { return p !== clears; })) : picks).slice(0, 2);
    var esc = window.MapleEsc || String, div = document.createElement('div'); div.id = 'cart-topup'; div.className = 'cart-topup';
    div.innerHTML = '<p class="cart-topup-k">' + (clears ? 'Ships free with one more' : 'Our most-ordered') + '</p>' + shown.map(function (p) {
      return '<div class="cart-topup-row"><img src="/assets/images/cards/' + p.handle + '.webp" alt="" width="48" height="48"><div class="cart-topup-name">' + esc(p.title) + '<span>$' + p.price.toFixed(2) + (p.price >= gap ? ', and the order ships free' : '') + '</span></div><button type="button" class="cart-topup-add" data-variant-id="' + p.id + '" data-handle="' + p.handle + '">+ Add</button></div>';
    }).join('');
    itemsEl.appendChild(div);
    div.querySelectorAll('.cart-topup-add').forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true; b.textContent = 'Adding';
        try { if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture('cart_topup_add', { handle: b.dataset.handle, gap: Math.round(gap * 100) / 100, page: location.pathname }); } catch (e) {}
        addLine(b.dataset.variantId, 1).then(function () { renderDrawer(); renderBadge(); }, function () { b.disabled = false; b.textContent = '+ Add'; });
      });
    });
  }
  function renderBadge() { var el = document.getElementById('cart-count'); if (!el) return; var qty = getTotalQty(); el.textContent = qty; el.classList.toggle('visible', qty > 0); }
  function renderDrawer() {
    var itemsEl = document.getElementById('cart-items'); var emptyEl = document.getElementById('cart-empty'); var footerEl = document.getElementById('cart-footer'); var subtotalEl = document.getElementById('cart-subtotal'); var lines = getLines();
    itemsEl.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });
    footerBits();
    if (!lines.length && ms.on) { ms.on = false; saveMulti(); }
    modeChrome();
    if (!lines.length) { emptyEl.style.display = ''; footerEl.style.display = 'none'; renderTopup(); return; }
    emptyEl.style.display = 'none'; footerEl.style.display = '';
    if (multiOn()) { renderMulti(); return; }
    lines.forEach(function (line) {
      var v = line.merchandise; var price = parseFloat(v.priceV2.amount) * line.quantity; var imgUrl = v.image ? v.image.url + '&width=144' : ''; var div = document.createElement('div'); div.className = 'cart-item';
      div.innerHTML = (imgUrl ? '<img class="cart-item-img" src="' + imgUrl + '" alt="' + (window.MapleEsc||String)(v.image.altText || v.product.title) + '">' : '<div class="cart-item-img"></div>') + '<div class="cart-item-info"><div class="cart-item-name">' + v.product.title + '</div><div class="cart-item-variant">' + v.title + '</div><div class="cart-item-bottom"><div class="cart-item-qty"><button aria-label="Decrease" data-line="' + line.id + '" data-action="dec">&minus;</button><span>' + line.quantity + '</span><button aria-label="Increase" data-line="' + line.id + '" data-action="inc">+</button></div><span class="cart-item-price">$' + price.toFixed(2) + '</span></div></div>';
      itemsEl.appendChild(div);
    });
    if (cartData.cost && cartData.cost.subtotalAmount) { subtotalEl.textContent = '$' + parseFloat(cartData.cost.subtotalAmount.amount).toFixed(2); }
    renderTopup();
    // Optimistic +/-: update DOM immediately, debounce the Shopify roundtrip 300ms so
    // rapid clicks coalesce. PostHog rage-click cluster on this control (May 2026) was
    // the previous "wait for API → renderDrawer" pattern feeling broken.
    itemsEl.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lineId = btn.dataset.line;
        var action = btn.dataset.action;
        var qtyEl = btn.parentNode.querySelector('span');
        var current = parseInt(qtyEl.textContent, 10) || 0;
        var newQty = action === 'inc' ? current + 1 : current - 1;
        if (newQty < 0) return;
        qtyEl.textContent = newQty;
        var serverLine = lines.find(function (l) { return l.id === lineId; });
        var unitPrice = serverLine ? parseFloat(serverLine.merchandise.priceV2.amount) : 0;
        var priceEl = btn.closest('.cart-item-bottom').querySelector('.cart-item-price');
        if (priceEl) priceEl.textContent = '$' + (unitPrice * newQty).toFixed(2);
        // Recompute subtotal + badge from current DOM state
        var optBadge = 0, optSubtotal = 0;
        itemsEl.querySelectorAll('.cart-item-qty span').forEach(function (s) { optBadge += parseInt(s.textContent, 10) || 0; });
        itemsEl.querySelectorAll('.cart-item-price').forEach(function (p) { optSubtotal += parseFloat(p.textContent.replace(/[^0-9.]/g, '')) || 0; });
        subtotalEl.textContent = '$' + optSubtotal.toFixed(2);
        var badgeEl = document.getElementById('cart-count');
        if (badgeEl) { badgeEl.textContent = optBadge; badgeEl.classList.toggle('visible', optBadge > 0); }
        clearTimeout(pendingTimers[lineId]);
        var run = function () {
          delete pendingTimers[lineId]; delete pendingRuns[lineId];
          var finalQty = parseInt(qtyEl.textContent, 10);
          var op = finalQty <= 0 ? removeLine(lineId) : updateLine(lineId, finalQty);
          return op.then(function () {
            var sl = getLines().find(function (l) { return l.id === lineId; });
            if (finalQty <= 0 || !sl || sl.quantity !== finalQty) renderDrawer(); else renderTopup();
            renderBadge();
          }).catch(function () { renderDrawer(); renderBadge(); });
        };
        pendingRuns[lineId] = run;
        pendingTimers[lineId] = setTimeout(run, 300);
      });
    });
  }
  // ── Several addresses in one order (Liam, November 18, 2026: "send to multiple people and not
  // do customer a and go back customer b"). Built like cheenashop.com's recipient cart. "Send to
  // several addresses" turns the drawer into one block per person, each with a Canadian address,
  // their share of the cart and a gift message, and the buyer pays once. The Shopify cart keeps
  // the totals (so the badge, adds and stock checks work as before); who gets how many of each
  // item lives in this browser (mt_multi_v1). Checkout builds a fresh Shopify cart: every line
  // carries a visible "Send to: 2. Name" property, every person travels as a "Recipient n" cart
  // attribute (Additional details on the order), each gift message goes in the order note, and
  // person 1's address is filled in as the checkout's delivery address.
  // Delivery is what separate orders would cost: $19.99 a person, free when that person's items
  // reach $99 (the store's own Standard rate). Each extra person's delivery is a line of the
  // unlisted, Headless-only product "Delivery to another address". Person 1's is Shopify's own
  // shipping, unless the order already clears $99 without it; then person 1 gets a line too.
  var MULTI_KEY = 'mt_multi_v1';
  var DELIVERY = { variant: 'gid://shopify/ProductVariant/67755380244729', price: 19.99, free: 99 };
  var PROVINCES = [['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'], ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'], ['NS', 'Nova Scotia'], ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan']];
  var REQUIRED = { name: 'full name', street: 'street address', city: 'city', prov: 'province', zip: 'postal code' };
  function loadMulti() { try { return JSON.parse(localStorage.getItem(MULTI_KEY)) || {}; } catch (e) { return {}; } }
  var ms = loadMulti(); ms.people = ms.people || []; ms.alloc = ms.alloc || {};
  function saveMulti() { try { localStorage.setItem(MULTI_KEY, JSON.stringify(ms)); } catch (e) {} }
  function multiOn() { return !!(ms.on && ms.people.length); }
  function blankPerson() { return { name: '', street: '', apt: '', city: '', prov: '', zip: '', phone: '', note: '', open: true }; }
  function postal(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function zipOk(s) { return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postal(s)); }
  function zipShow(s) { return postal(s).replace(/^(.{3})(.+)$/, '$1 $2'); }
  function ready(p) { return Object.keys(REQUIRED).every(function (f) { return String(p[f] || '').trim(); }) && zipOk(p.zip); }
  function label(i) { return 'Recipient ' + (i + 1); }
  function who(i) { var n = (ms.people[i] && ms.people[i].name || '').trim(); return label(i) + (n ? ' (' + n + ')' : ''); }
  function clean(s) { return String(s == null ? '' : s).replace(/[|\r\n]+/g, ' ').trim(); }
  function money2(n) { return '$' + n.toFixed(2); }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(cls, text, on) { var b = mk('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; }
  function msg(text) { var m = document.getElementById('mt-multi-msg'); if (m) m.textContent = text || ''; }

  // The Shopify cart is the total; the split follows it. A unit added while several addresses are
  // on goes to the person the buyer last picked "Add items" for; a unit taken away comes off the
  // last person who has one.
  function reconcile() {
    var n = ms.people.length, seen = {};
    getLines().forEach(function (l) {
      var v = l.merchandise.id; if (v === DELIVERY.variant) return; seen[v] = 1;
      if (syncing[v] && ms.alloc[v]) return;
      var a = ms.alloc[v] || []; while (a.length < n) a.push(0); a.length = n;
      var sum = a.reduce(function (s, q) { return s + q; }, 0);
      if (l.quantity > sum) a[Math.min(ms.active || 0, n - 1)] += l.quantity - sum;
      for (var i = n - 1; i >= 0 && sum > l.quantity; i--) { var cut = Math.min(a[i], sum - l.quantity); a[i] -= cut; sum -= cut; }
      ms.alloc[v] = a;
    });
    Object.keys(ms.alloc).forEach(function (v) { if (!seen[v] && !syncing[v]) delete ms.alloc[v]; });
    saveMulti();
  }
  function lineFor(v) { return getLines().filter(function (l) { return l.merchandise.id === v; })[0]; }
  // Moves the Shopify cart's quantity for one item to the sum of everyone's share.
  // While an item's new quantity is on its way to Shopify, the split is not read back from it.
  var syncTimers = {}, syncing = {};
  function syncQty(v) {
    syncing[v] = 1;
    clearTimeout(syncTimers[v]);
    syncTimers[v] = setTimeout(function () {
      delete syncTimers[v];
      var want = (ms.alloc[v] || []).reduce(function (s, q) { return s + q; }, 0), l = lineFor(v);
      var op = !l ? (want ? addLineRaw(v, want) : null) : want ? (l.quantity !== want ? updateLine(l.id, want) : null) : removeLine(l.id);
      var after = function () { if (!syncTimers[v]) delete syncing[v]; renderBadge(); renderDrawer(); };
      if (op) op.then(after, after); else after();
    }, 300);
  }
  function syncsWaiting() { return Object.keys(syncing).length > 0; }
  function delivery() {
    var items = ms.people.map(function (_, i) {
      return getLines().reduce(function (s, l) { var q = (ms.alloc[l.merchandise.id] || [])[i] || 0; return s + q * parseFloat(l.merchandise.priceV2.amount); }, 0);
    });
    var each = items.map(function (t) { return t > 0 && t < DELIVERY.free ? DELIVERY.price : 0; });
    var charged = each.map(function (c, i) { return i > 0 ? c : 0; });
    var before = items.concat(charged).reduce(function (a, b) { return a + b; }, 0);
    if (each[0] && before >= DELIVERY.free) charged[0] = each[0]; // Shopify ships the order free from $99
    return { items: items, each: each, charged: charged };
  }

  var uid = 0;
  function personForm(p, i) {
    var form = mk('div', 'mtm-form');
    function field(key, text, o) {
      o = o || {};
      var id = 'mtm-' + i + '-' + key + '-' + (uid++), wrap = mk('div', 'mtm-field' + (o.wide ? ' mtm-field--wide' : '')), lab = mk('label', null, text), input;
      lab.htmlFor = id;
      if (key === 'prov') { input = document.createElement('select'); input.add(new Option('Choose', '')); PROVINCES.forEach(function (x) { input.add(new Option(x[1], x[0])); }); }
      else { input = document.createElement('input'); input.type = o.type || 'text'; if (o.auto) input.autocomplete = o.auto; if (o.mode) input.inputMode = o.mode; }
      input.id = id; input.value = p[key] || ''; if (REQUIRED[key]) input.required = true;
      input.addEventListener(key === 'prov' ? 'change' : 'input', function () { p[key] = input.value; saveMulti(); msg(''); });
      wrap.appendChild(lab); wrap.appendChild(input); form.appendChild(wrap);
    }
    field('name', 'Full name', { wide: true, auto: 'section-r name' });
    field('street', 'Street address', { wide: true, auto: 'section-r address-line1' });
    field('apt', 'Apartment or suite (optional)', { wide: true, auto: 'section-r address-line2' });
    field('city', 'City', { auto: 'section-r address-level2' });
    field('prov', 'Province');
    field('zip', 'Postal code', { auto: 'section-r postal-code' });
    field('phone', 'Phone (optional)', { type: 'tel', auto: 'section-r tel', mode: 'tel' });
    form.appendChild(btn('mtm-btn mtm-done', 'Save address', function () {
      if (ready(p)) { p.open = false; saveMulti(); renderDrawer(); }
      else msg(who(i) + ': please fill in the ' + (Object.keys(REQUIRED).filter(function (f) { return !String(p[f] || '').trim(); }).map(function (f) { return REQUIRED[f]; })[0] || 'postal code, like V6P 6P4') + '.');
    }));
    return form;
  }
  function itemRow(l, i) {
    var v = l.merchandise, q = ms.alloc[v.id][i], unit = parseFloat(v.priceV2.amount), esc = window.MapleEsc || String;
    var row = mk('div', 'cart-item mtm-item');
    row.innerHTML = (v.image ? '<img class="cart-item-img" src="' + v.image.url + '&width=144" alt="">' : '<div class="cart-item-img"></div>') +
      '<div class="cart-item-info"><div class="cart-item-name">' + esc(v.product.title) + '</div><div class="cart-item-variant">' + esc(v.title) + '</div>' +
      '<div class="cart-item-bottom"><div class="cart-item-qty"><button type="button" aria-label="One fewer">&minus;</button><span>' + q + '</span><button type="button" aria-label="One more">+</button></div>' +
      '<span class="cart-item-price">' + money2(unit * q) + '</span></div></div>';
    var b = row.querySelectorAll('.cart-item-qty button');
    function step(d) { var a = ms.alloc[v.id]; a[i] = Math.max(0, a[i] + d); saveMulti(); syncQty(v.id); renderMulti(); }
    b[0].addEventListener('click', function () { step(-1); });
    b[1].addEventListener('click', function () { step(1); });
    if (ms.people.length > 1) {
      var move = mk('label', 'mtm-move'); move.appendChild(mk('span', null, 'Send to'));
      var sel = document.createElement('select');
      ms.people.forEach(function (x, j) { sel.add(new Option((j + 1) + '. ' + (x.name.trim() || label(j)), String(j), false, j === i)); });
      sel.addEventListener('change', function () { var a = ms.alloc[v.id], j = Number(sel.value); a[j] += a[i]; a[i] = 0; saveMulti(); renderMulti(); });
      move.appendChild(sel); row.querySelector('.cart-item-info').appendChild(move);
    }
    return row;
  }
  function renderMulti() {
    var itemsEl = document.getElementById('cart-items'), drawer = document.getElementById('cart-drawer');
    reconcile();
    var cost = delivery(), lines = getLines().filter(function (l) { return l.merchandise.id !== DELIVERY.variant; });
    var box = document.getElementById('mt-multi'); if (box) box.remove();
    box = mk('div', 'mtm'); box.id = 'mt-multi';
    ms.people.forEach(function (p, i) {
      var block = mk('section', 'mtm-person' + (ms.people.length > 1 && (ms.active || 0) === i ? ' is-active' : ''));
      var head = mk('div', 'mtm-head'); head.appendChild(mk('h3', 'mtm-title', label(i)));
      if (ms.people.length > 1 && (ms.active || 0) === i) head.appendChild(mk('span', 'mtm-tag', 'Adding here'));
      block.appendChild(head);
      if (p.open || !ready(p)) block.appendChild(personForm(p, i));
      else {
        var addr = mk('p', 'mtm-addr');
        [p.name, [p.street, p.apt].filter(function (x) { return x.trim(); }).join(', '), p.city + ', ' + p.prov + ' ' + zipShow(p.zip), p.phone]
          .filter(function (t) { return String(t || '').trim(); }).forEach(function (t, n) { if (n) addr.appendChild(document.createElement('br')); addr.appendChild(document.createTextNode(t)); });
        block.appendChild(addr);
        block.appendChild(btn('mtm-link', 'Change address', function () { p.open = true; saveMulti(); renderMulti(); }));
      }
      var mine = lines.filter(function (l) { return (ms.alloc[l.merchandise.id] || [])[i] > 0; });
      mine.forEach(function (l) { block.appendChild(itemRow(l, i)); });
      if (!mine.length) block.appendChild(mk('p', 'mtm-empty', 'Nothing for this person yet.'));
      var acts = mk('div', 'mtm-acts');
      acts.appendChild(btn('mtm-btn', 'Add items', function () { ms.active = i; saveMulti(); toggle(); }));
      if (i > 0 && !mine.length && lines.some(function (l) { return (ms.alloc[l.merchandise.id] || [])[0] > 0; })) {
        acts.appendChild(btn('mtm-btn', 'Same items as recipient 1', function () {
          lines.forEach(function (l) { var a = ms.alloc[l.merchandise.id]; if (a && a[0]) { a[i] += a[0]; syncQty(l.merchandise.id); } });
          saveMulti(); renderMulti();
        }));
      }
      block.appendChild(acts);
      if (mine.length) block.appendChild(mk('p', 'mtm-ship', cost.each[i] ? 'Delivery ' + money2(cost.each[i]) + '. Free when this person’s items reach $' + DELIVERY.free + '.' : 'Free delivery.'));
      var nid = 'mtm-note-' + i, nl = mk('label', 'mtm-label', 'Gift message (optional)'); nl.htmlFor = nid;
      var note = document.createElement('textarea'); note.id = nid; note.rows = 2; note.maxLength = 250; note.value = p.note || '';
      note.addEventListener('input', function () { p.note = note.value; saveMulti(); });
      block.appendChild(nl); block.appendChild(note);
      if (ms.people.length > 1) block.appendChild(btn('mtm-link mtm-remove', 'Remove this recipient', function () {
        Object.keys(ms.alloc).forEach(function (v) { var a = ms.alloc[v]; a[0] += a[i]; a.splice(i, 1); }); // their items go back to recipient 1
        ms.people.splice(i, 1); ms.active = Math.min(ms.active || 0, ms.people.length - 1); saveMulti(); renderMulti();
      }));
      box.appendChild(block);
    });
    var tail = mk('div', 'mtm-tail');
    tail.appendChild(btn('mtm-btn', 'Add another recipient', function () {
      ms.people.push(blankPerson()); ms.active = ms.people.length - 1;
      Object.keys(ms.alloc).forEach(function (v) { ms.alloc[v].push(0); }); saveMulti(); renderMulti();
    }));
    tail.appendChild(btn('mtm-link', 'Send everything to one address', function () { ms.on = false; saveMulti(); renderDrawer(); }));
    box.appendChild(tail);
    itemsEl.insertBefore(box, itemsEl.firstChild);
    var fee = cost.each.reduce(function (a, b) { return a + b; }, 0), items = cost.items.reduce(function (a, b) { return a + b; }, 0);
    document.getElementById('mt-multi-ship').textContent = fee ? money2(fee) : 'Free';
    document.getElementById('cart-subtotal').textContent = money2(items + fee);
    drawer.classList.add('mt-multi-on');
  }
  function startMulti() {
    ms.on = true; ms.active = 0; ms.alloc = {};
    if (!ms.people.length) ms.people.push(blankPerson());
    getLines().forEach(function (l) { var a = [l.quantity]; while (a.length < ms.people.length) a.push(0); ms.alloc[l.merchandise.id] = a; });
    saveMulti(); renderDrawer();
    document.getElementById('cart-items').scrollTop = 0;
  }
  // The footer pieces several-address mode needs: the offer (single mode), the delivery row, the
  // hint and a message line (multi mode). Added once; CSS shows the right ones for the mode.
  function footerBits() {
    var f = document.getElementById('cart-footer'); if (!f || document.getElementById('mt-several')) return;
    var offer = mk('p', 'mt-several'); offer.id = 'mt-several';
    offer.appendChild(document.createTextNode('Sending to more than one person? '));
    offer.appendChild(btn('mt-several-btn', 'Send to several addresses', startMulti));
    var row = mk('div', 'mt-multi-row'); row.appendChild(mk('span', null, 'Delivery')); var s = mk('span'); s.id = 'mt-multi-ship'; row.appendChild(s);
    var hint = mk('p', 'mt-multi-hint', 'One payment for everyone. Recipient 1’s address is filled in at checkout, where taxes are added.');
    var m = mk('p', 'mt-multi-msg'); m.id = 'mt-multi-msg'; m.setAttribute('role', 'status');
    var sub = f.querySelector('.cart-subtotal'), checkoutBtn = document.getElementById('cart-checkout');
    f.insertBefore(row, sub); f.insertBefore(offer, checkoutBtn); f.insertBefore(hint, checkoutBtn); f.appendChild(m);
    sub.querySelector('.cart-subtotal-label').setAttribute('data-single-label', 'Subtotal');
  }
  function modeChrome() {
    var on = multiOn(), d = document.getElementById('cart-drawer'), lab = d && d.querySelector('.cart-subtotal-label');
    if (d) d.classList.toggle('mt-multi-on', on);
    if (lab) lab.textContent = on ? 'Total before tax' : 'Subtotal';
    var box = document.getElementById('mt-multi'); if (!on && box) box.remove();
  }
  function multiProblem() {
    for (var i = 0; i < ms.people.length; i++) {
      var p = ms.people[i];
      var gap = Object.keys(REQUIRED).filter(function (f) { return !String(p[f] || '').trim(); })[0];
      if (gap) { p.open = true; return { i: i, text: who(i) + ': please add the ' + REQUIRED[gap] + '.' }; }
      if (!zipOk(p.zip)) { p.open = true; return { i: i, text: who(i) + ': the postal code should look like V6P 6P4.' }; }
      if (!getLines().some(function (l) { return (ms.alloc[l.merchandise.id] || [])[i] > 0; })) return { i: i, text: who(i) + ': please add at least one item.' };
    }
    return null;
  }
  function multiCheckout() {
    var problem = multiProblem();
    if (problem) { saveMulti(); renderMulti(); msg(problem.text); var el = document.querySelectorAll('.mtm-person')[problem.i]; if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    var b = document.getElementById('cart-checkout'); if (b) b.disabled = true;
    var cost = delivery(), lines = [], sendTo = function (i) { return { key: 'Send to', value: (i + 1) + '. ' + clean(ms.people[i].name) }; };
    var items = ms.people.map(function () { return []; });
    getLines().forEach(function (l) {
      (ms.alloc[l.merchandise.id] || []).forEach(function (q, i) {
        if (!q) return;
        lines.push({ merchandiseId: l.merchandise.id, quantity: q, attributes: [sendTo(i)] });
        items[i].push(l.merchandise.product.title + (l.merchandise.title !== 'Default Title' ? ' (' + l.merchandise.title + ')' : '') + ' x ' + q);
      });
    });
    cost.charged.forEach(function (c, i) { if (c) lines.push({ merchandiseId: DELIVERY.variant, quantity: 1, attributes: [sendTo(i)] }); });
    var attrs = [{ key: 'Recipients', value: String(ms.people.length) }];
    ms.people.forEach(function (p, i) {
      var fee = cost.charged[i] ? ' | Delivery charged: ' + money2(cost.charged[i]) : '';
      attrs.push({ key: 'Recipient ' + (i + 1), value: i === 0 ? 'Shipping address at checkout' + fee + ' | Items: ' + items[0].join('; ')
        : ['Name: ' + clean(p.name)].concat(p.phone.trim() ? ['Phone: ' + clean(p.phone)] : [], ['Address: ' + clean(p.street)], p.apt.trim() ? ['Apartment: ' + clean(p.apt)] : [],
          ['City: ' + clean(p.city), 'Province: ' + p.prov, 'Postal code: ' + zipShow(p.zip)]).join(' | ') + fee + ' | Items: ' + items[i].join('; ') });
    });
    try { attrs.push({ key: '_landing_page', value: sessionStorage.getItem('mt_landing') || '' }, { key: '_referrer', value: sessionStorage.getItem('mt_ref') || '' }); } catch (e) {}
    var ph = window.posthog;
    if (ph && typeof ph.get_distinct_id === 'function') attrs.push({ key: '_ph_distinct_id', value: String(ph.get_distinct_id() || '') });
    if (ph && typeof ph.get_session_id === 'function') attrs.push({ key: '_ph_session_id', value: String(ph.get_session_id() || '') });
    var first = ms.people[0], parts = first.name.trim().split(/\s+/);
    var input = {
      lines: lines, buyerIdentity: { countryCode: 'CA' },
      attributes: attrs.filter(function (a) { return a.value; }),
      note: ms.people.map(function (p, i) { return p.note.trim() ? 'Recipient ' + (i + 1) + ' (' + clean(p.name) + '): ' + p.note.trim() : ''; }).filter(Boolean).join('\n\n'),
      delivery: { addresses: [{ selected: true, oneTimeUse: true, address: { deliveryAddress: {} } }] }
    };
    var da = { firstName: parts.length > 1 ? parts.slice(0, -1).join(' ') : '', lastName: parts[parts.length - 1], address1: first.street.trim(), address2: first.apt.trim(),
      city: first.city.trim(), provinceCode: first.prov, countryCode: 'CA', zip: zipShow(first.zip), phone: first.phone.trim() };
    Object.keys(da).forEach(function (k) { if (da[k]) input.delivery.addresses[0].address.deliveryAddress[k] = da[k]; });
    function create(inp) { return gql('mutation($input:CartInput!){cartCreate(input:$input){cart{id checkoutUrl}userErrors{field message}}}', { input: inp }); }
    function done(url, id) { ms.pending = id; saveMulti(); if (b) b.disabled = false; if (window.MapleSafeCheckout) window.MapleSafeCheckout(url); else window.location.href = url; }
    create(input).then(function (res) {
      var c = res && res.data && res.data.cartCreate && res.data.cartCreate.cart;
      if (c && c.checkoutUrl) return done(c.checkoutUrl, c.id);
      // If Shopify refuses the filled-in address, open checkout without it: the buyer types it there.
      delete input.delivery;
      return create(input).then(function (r2) {
        var c2 = r2 && r2.data && r2.data.cartCreate && r2.data.cartCreate.cart;
        if (c2 && c2.checkoutUrl) return done(c2.checkoutUrl, c2.id);
        throw new Error((r2 && r2.data && r2.data.cartCreate && r2.data.cartCreate.userErrors[0] || {}).message || 'no checkout');
      });
    }).catch(function (e) { if (b) b.disabled = false; msg('Checkout did not open. Please try again.'); try { console.error('multi checkout', e); } catch (x) {} });
  }
  // A several-address checkout that went through leaves its Shopify cart gone: then the cart here
  // is emptied too, as a normal checkout does. A buyer who came back without paying keeps it all.
  function settlePending() {
    if (!ms.pending) return Promise.resolve();
    return gql('query($id:ID!){cart(id:$id){id}}', { id: ms.pending }).then(function (res) {
      if (res && res.data && res.data.cart) return;
      localStorage.removeItem('maple_cart_id'); cartId = null; cartData = null; ms = { people: [], alloc: {} }; saveMulti();
    }).catch(function () {});
  }

  function toggle() { var overlay = document.getElementById('cart-overlay'); var drawer = document.getElementById('cart-drawer'); var isOpen = drawer.classList.contains('open'); drawer.classList.toggle('open'); overlay.classList.toggle('open'); document.body.style.overflow = isOpen ? '' : 'hidden'; if (!isOpen) renderDrawer(); }
  // An add button that sits inside a product card's link (the older city and shop
  // pages build their cards that way) must not follow the link: stopPropagation in
  // the button's onclick stops the card's own handler but not the browser opening
  // the product page, which cancelled the add before the cart was saved (found
  // October 3, 2026). Cancelling the click's default here covers every page.
  function addFromBtn(btn) { var ev = window.event; if (ev && ev.type === 'click' && btn.closest && btn.closest('a[href]') && ev.preventDefault) ev.preventDefault(); var variantId = btn.dataset.variantId; if (!variantId) return; var origHTML = btn.innerHTML; btn.classList.add('added'); btn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg> Added'; addLine(variantId, 1).then(function () {
      var line = allLines().filter(function (l) { return l.merchandise && l.merchandise.id === variantId; })[0];
      if (!line || line.quantity < 1) { btn.classList.remove('added'); markSoldOut(btn); if (line) removeLine(line.id).then(renderBadge, renderBadge); else renderBadge(); return; }
      renderBadge(); setTimeout(function () { btn.classList.remove('added'); btn.innerHTML = origHTML; }, 1400);
    }); }
  // Sold-out guard (Site Audit 2.0, November 13, 2026: sold-out chocolates kept a working Add
  // button on five pages, said "Added" and put nothing in the cart). On load, and once more for
  // grids drawn after it, every add button's variant is checked with Shopify in one query; a
  // variant that cannot be bought turns its button into a disabled "Sold out".
  function markSoldOut(btn) { btn.disabled = true; btn.classList.add('mt-soldout'); btn.removeAttribute('onclick'); btn.setAttribute('aria-disabled', 'true'); btn.setAttribute('aria-label', 'Sold out'); btn.textContent = 'Sold out'; }
  var stockChecked = {}, soldOut = {};
  function checkStock() {
    var btns = [].slice.call(document.querySelectorAll('button[data-variant-id]:not(.cart-topup-add):not(.mt-soldout)'));
    var ids = [];
    btns.forEach(function (b) { var id = b.dataset.variantId; if (id && id.indexOf('gid://shopify/ProductVariant/') === 0 && !stockChecked[id]) { stockChecked[id] = 1; ids.push(id); } });
    btns.forEach(function (b) { if (soldOut[b.dataset.variantId]) markSoldOut(b); });
    if (!ids.length) return;
    gql('query($ids:[ID!]!){nodes(ids:$ids){...on ProductVariant{id availableForSale}}}', { ids: ids.slice(0, 250) }).then(function (res) {
      if (!res || !res.data || !res.data.nodes) return;
      res.data.nodes.forEach(function (n, i) { if (!n || n.availableForSale === false) soldOut[ids[i]] = 1; });
      btns.forEach(function (b) { if (soldOut[b.dataset.variantId]) markSoldOut(b); });
    }).catch(function () {});
  }
  // A + or - tap still inside its 300 ms wait is sent before checkout opens (CRO Lite,
  // November 13, 2026: a tap within about 0.3 s of Checkout was lost, so the cart showed 5
  // and checkout opened with 4).
  function checkout() {
    if (multiOn()) { if (syncsWaiting()) { setTimeout(checkout, 400); return; } multiCheckout(); return; }
    var waiting = Object.keys(pendingRuns);
    if (waiting.length) {
      var b = document.getElementById('cart-checkout'); if (b) b.disabled = true;
      Promise.all(waiting.map(function (id) { clearTimeout(pendingTimers[id]); var r = pendingRuns[id]; return r ? r() : null; })).then(go, go);
      return;
    }
    go();
    function go() { var b = document.getElementById('cart-checkout'); if (b) b.disabled = false; if (!cartData || !cartData.checkoutUrl) return; if (window.MapleSafeCheckout) { window.MapleSafeCheckout(cartData.checkoutUrl); } else { window.location.href = cartData.checkoutUrl; } }
  }
  function init() { settlePending().then(fetchCart).then(function () { renderBadge(); }); checkStock(); setTimeout(checkStock, 2500); document.getElementById('cart-overlay').addEventListener('click', toggle); document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('cart-drawer').classList.contains('open')) toggle(); }); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
  return { toggle: toggle, addFromBtn: addFromBtn, addLine: addLine, renderBadge: renderBadge, checkout: checkout };
})();
var MapleCart = window.MapleCart;
