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
    st.textContent = ".cart-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(26,23,20,0.35); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1); }\n.cart-overlay.open { opacity: 1; pointer-events: all; }\n.cart-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 90vw); background: #FDFBF7; z-index: 201; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1); display: flex; flex-direction: column; box-shadow: -16px 0 48px rgba(26,23,20,0.12); }\n.cart-drawer.open { transform: translateX(0); }\n.cart-header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 1.75rem; border-bottom: 1px solid rgba(217,209,196,0.4); }\n.cart-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.4rem; font-weight: 500; color: #1A1714; }\n.cart-close { width: 2.2rem; height: 2.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s; color: #8C8175; background: none; border: none; cursor: pointer; }\n.cart-close:hover { background: rgba(26,23,20,0.06); color: #1A1714; }\n.cart-items { flex: 1; overflow-y: auto; padding: 1rem 1.75rem; }\n.cart-empty { text-align: center; padding: 4rem 1rem; color: #B8AD9E; font-size: 0.9rem; }\n.cart-item { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid rgba(217,209,196,0.3); }\n.cart-item:last-child { border-bottom: none; }\n.cart-item-img { width: 72px; height: 72px; border-radius: 0.75rem; object-fit: cover; background: #F5F0E8; flex-shrink: 0; }\n.cart-item-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }\n.cart-item-name { font-family: 'Fraunces', Georgia, serif; font-size: 1rem; font-weight: 500; color: #1A1714; line-height: 1.3; }\n.cart-item-variant { font-size: 0.72rem; color: #8C8175; letter-spacing: 0.02em; }\n.cart-item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }\n.cart-item-qty { display: flex; align-items: center; border: 1px solid rgba(217,209,196,0.5); border-radius: 100px; overflow: hidden; }\n.cart-item-qty button { width: 2.75rem; height: 2.75rem; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; color: #8C8175; background: none; border: none; cursor: pointer; transition: background 0.15s, color 0.15s; }\n.cart-item-qty button:hover { background: rgba(26,23,20,0.06); color: #1A1714; }\n.cart-item-qty span { min-width: 1.5rem; text-align: center; font-size: 0.78rem; font-weight: 500; color: #1A1714; }\n.cart-item-price { font-family: 'Fraunces', Georgia, serif; font-size: 1rem; font-weight: 500; color: #1A1714; }\n.cart-footer { padding: 1.25rem 1.75rem 1.75rem; border-top: 1px solid rgba(217,209,196,0.4); }\n.cart-subtotal { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }\n.cart-subtotal-label { font-size: 0.82rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: #8C8175; }\n.cart-subtotal-price { font-family: 'Fraunces', Georgia, serif; font-size: 1.4rem; font-weight: 500; color: #1A1714; }\n.cart-note { font-size: 0.72rem; line-height: 1.45; color: #6B6158; margin-bottom: 1rem; }\n.cart-checkout-btn { display: flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%; padding: 1rem; border-radius: 100px; background: #1A1714; color: #FDFBF7; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 0.88rem; font-weight: 500; letter-spacing: 0.04em; border: none; cursor: pointer; transition: background 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.2s; }\n.cart-checkout-btn:hover { background: #C4841D; transform: translateY(-1px); }\n.cart-checkout-btn:active { transform: scale(0.98); }\n.nav-cart-count { position: absolute; top: -2px; right: -4px; min-width: 17px; height: 17px; border-radius: 100px; background: #C4841D; color: #fff; font-size: 0.6rem; font-weight: 600; display: flex; align-items: center; justify-content: center; padding: 0 4px; opacity: 0; transform: scale(0.5); transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1), transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); pointer-events: none; }\n.nav-cart-count.visible { opacity: 1; transform: scale(1); }\n.cart-topup { margin-top: 1rem; padding: 0.9rem 1rem; border-radius: 1rem; background: #F5F0E8; }\n.cart-topup-k { font-size: 0.82rem; font-weight: 600; color: #1A1714; margin-bottom: 0.35rem; }\n.cart-topup-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-top: 1px solid rgba(217,209,196,0.6); }\n.cart-topup-row img { width: 48px; height: 48px; border-radius: 0.6rem; object-fit: cover; background: #F1E9DC; flex-shrink: 0; }\n.cart-topup-name { flex: 1; font-size: 0.82rem; color: #1A1714; line-height: 1.3; }\n.cart-topup-name span { display: block; font-size: 0.75rem; color: #6B6158; }\n.cart-topup-add { min-height: 44px; padding: 0 1rem; border-radius: 100px; border: 1.5px solid #1A1714; background: transparent; font-size: 0.78rem; font-weight: 600; color: #1A1714; cursor: pointer; white-space: nowrap; }\n.cart-topup-add:hover { background: #1A1714; color: #FDFBF7; }\n.cart-topup-add:disabled { opacity: 0.6; cursor: default; }";
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
  function getLines() { if (!cartData || !cartData.lines) return []; return cartData.lines.edges.map(function (e) { return e.node; }); }
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
    if (!lines.length) { emptyEl.style.display = ''; footerEl.style.display = 'none'; renderTopup(); return; }
    emptyEl.style.display = 'none'; footerEl.style.display = '';
    lines.forEach(function (line) {
      var v = line.merchandise; var price = parseFloat(v.priceV2.amount) * line.quantity; var imgUrl = v.image ? v.image.url + '&width=144' : ''; var div = document.createElement('div'); div.className = 'cart-item';
      div.innerHTML = (imgUrl ? '<img class="cart-item-img" src="' + imgUrl + '" alt="' + (window.MapleEsc||String)(v.image.altText || v.product.title) + '">' : '<div class="cart-item-img"></div>') + '<div class="cart-item-info"><div class="cart-item-name">' + v.product.title + '</div><div class="cart-item-variant">' + v.title + '</div><div class="cart-item-bottom"><div class="cart-item-qty"><button aria-label="Decrease" data-line="' + line.id + '" data-action="dec">&minus;</button><span>' + line.quantity + '</span><button aria-label="Increase" data-line="' + line.id + '" data-action="inc">+</button></div><span class="cart-item-price">$' + price.toFixed(2) + '</span></div></div>';
      itemsEl.appendChild(div);
    });
    if (cartData.cost && cartData.cost.subtotalAmount) { subtotalEl.textContent = '$' + parseFloat(cartData.cost.subtotalAmount.amount).toFixed(2) + ' CAD'; }
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
        subtotalEl.textContent = '$' + optSubtotal.toFixed(2) + ' CAD';
        var badgeEl = document.getElementById('cart-count');
        if (badgeEl) { badgeEl.textContent = optBadge; badgeEl.classList.toggle('visible', optBadge > 0); }
        clearTimeout(pendingTimers[lineId]);
        pendingTimers[lineId] = setTimeout(function () {
          delete pendingTimers[lineId];
          var finalQty = parseInt(qtyEl.textContent, 10);
          var op = finalQty <= 0 ? removeLine(lineId) : updateLine(lineId, finalQty);
          op.then(function () {
            var sl = getLines().find(function (l) { return l.id === lineId; });
            if (finalQty <= 0 || !sl || sl.quantity !== finalQty) renderDrawer(); else renderTopup();
            renderBadge();
          }).catch(function () { renderDrawer(); renderBadge(); });
        }, 300);
      });
    });
  }
  function toggle() { var overlay = document.getElementById('cart-overlay'); var drawer = document.getElementById('cart-drawer'); var isOpen = drawer.classList.contains('open'); drawer.classList.toggle('open'); overlay.classList.toggle('open'); document.body.style.overflow = isOpen ? '' : 'hidden'; if (!isOpen) renderDrawer(); }
  // An add button that sits inside a product card's link (the older city and shop
  // pages build their cards that way) must not follow the link: stopPropagation in
  // the button's onclick stops the card's own handler but not the browser opening
  // the product page, which cancelled the add before the cart was saved (found
  // October 3, 2026). Cancelling the click's default here covers every page.
  function addFromBtn(btn) { var ev = window.event; if (ev && ev.type === 'click' && btn.closest && btn.closest('a[href]') && ev.preventDefault) ev.preventDefault(); var variantId = btn.dataset.variantId; if (!variantId) return; var origHTML = btn.innerHTML; btn.classList.add('added'); btn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg> Added'; addLine(variantId, 1).then(function () { renderBadge(); setTimeout(function () { btn.classList.remove('added'); btn.innerHTML = origHTML; }, 1400); }); }
  function checkout() { if (!cartData || !cartData.checkoutUrl) return; if (window.MapleSafeCheckout) { window.MapleSafeCheckout(cartData.checkoutUrl); } else { window.location.href = cartData.checkoutUrl; } }
  function init() { fetchCart().then(function () { renderBadge(); }); document.getElementById('cart-overlay').addEventListener('click', toggle); document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('cart-drawer').classList.contains('open')) toggle(); }); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
  return { toggle: toggle, addFromBtn: addFromBtn, addLine: addLine, renderBadge: renderBadge, checkout: checkout };
})();
var MapleCart = window.MapleCart;
