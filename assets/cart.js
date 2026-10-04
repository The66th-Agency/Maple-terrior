// The cart, one copy for every page (Liam, October 3, 2026: "we should use 1
// component and reuse it across all pages"). It used to be pasted into 82 pages
// in two spellings, and 33 pages had none, so their nav had no cart button.
// This file adds the drawer's styles and markup to the page, then defines
// MapleCart: toggle, addFromBtn (product card buttons), addLine and renderBadge
// (product pages), checkout. Every page loads it where the inline copy used to
// sit, before any page script that calls MapleCart.
(function () {
  if (!document.getElementById('mt-cart-css')) {
    var st = document.createElement('style');
    st.id = 'mt-cart-css';
    st.textContent = ".cart-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(26,23,20,0.35); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1); }\n.cart-overlay.open { opacity: 1; pointer-events: all; }\n.cart-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 90vw); background: #FDFBF7; z-index: 201; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1); display: flex; flex-direction: column; box-shadow: -16px 0 48px rgba(26,23,20,0.12); }\n.cart-drawer.open { transform: translateX(0); }\n.cart-header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 1.75rem; border-bottom: 1px solid rgba(217,209,196,0.4); }\n.cart-title { font-family: 'Fraunces', Georgia, serif; font-size: 1.4rem; font-weight: 500; color: #1A1714; }\n.cart-close { width: 2.2rem; height: 2.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s; color: #8C8175; background: none; border: none; cursor: pointer; }\n.cart-close:hover { background: rgba(26,23,20,0.06); color: #1A1714; }\n.cart-items { flex: 1; overflow-y: auto; padding: 1rem 1.75rem; }\n.cart-empty { text-align: center; padding: 4rem 1rem; color: #B8AD9E; font-size: 0.9rem; }\n.cart-item { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid rgba(217,209,196,0.3); }\n.cart-item:last-child { border-bottom: none; }\n.cart-item-img { width: 72px; height: 72px; border-radius: 0.75rem; object-fit: cover; background: #F5F0E8; flex-shrink: 0; }\n.cart-item-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }\n.cart-item-name { font-family: 'Fraunces', Georgia, serif; font-size: 1rem; font-weight: 500; color: #1A1714; line-height: 1.3; }\n.cart-item-variant { font-size: 0.72rem; color: #8C8175; letter-spacing: 0.02em; }\n.cart-item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }\n.cart-item-qty { display: flex; align-items: center; border: 1px solid rgba(217,209,196,0.5); border-radius: 100px; overflow: hidden; }\n.cart-item-qty button { width: 2.75rem; height: 2.75rem; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; color: #8C8175; background: none; border: none; cursor: pointer; transition: background 0.15s, color 0.15s; }\n.cart-item-qty button:hover { background: rgba(26,23,20,0.06); color: #1A1714; }\n.cart-item-qty span { min-width: 1.5rem; text-align: center; font-size: 0.78rem; font-weight: 500; color: #1A1714; }\n.cart-item-price { font-family: 'Fraunces', Georgia, serif; font-size: 1rem; font-weight: 500; color: #1A1714; }\n.cart-footer { padding: 1.25rem 1.75rem 1.75rem; border-top: 1px solid rgba(217,209,196,0.4); }\n.cart-subtotal { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }\n.cart-subtotal-label { font-size: 0.82rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: #8C8175; }\n.cart-subtotal-price { font-family: 'Fraunces', Georgia, serif; font-size: 1.4rem; font-weight: 500; color: #1A1714; }\n.cart-note { font-size: 0.72rem; color: #B8AD9E; margin-bottom: 1rem; }\n.cart-checkout-btn { display: flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%; padding: 1rem; border-radius: 100px; background: #1A1714; color: #FDFBF7; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 0.88rem; font-weight: 500; letter-spacing: 0.04em; border: none; cursor: pointer; transition: background 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.2s; }\n.cart-checkout-btn:hover { background: #C4841D; transform: translateY(-1px); }\n.cart-checkout-btn:active { transform: scale(0.98); }\n.nav-cart-count { position: absolute; top: -2px; right: -4px; min-width: 17px; height: 17px; border-radius: 100px; background: #C4841D; color: #fff; font-size: 0.6rem; font-weight: 600; display: flex; align-items: center; justify-content: center; padding: 0 4px; opacity: 0; transform: scale(0.5); transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1), transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); pointer-events: none; }\n.nav-cart-count.visible { opacity: 1; transform: scale(1); }";
    document.head.appendChild(st);
  }
  if (!document.getElementById('cart-drawer')) {
    var wrap = document.createElement('div');
    wrap.innerHTML = "<div class=\"cart-overlay\" id=\"cart-overlay\"></div><aside class=\"cart-drawer\" id=\"cart-drawer\" role=\"dialog\" aria-label=\"Shopping cart\"><div class=\"cart-header\"><h2 class=\"cart-title\">Your Cart</h2><button class=\"cart-close\" aria-label=\"Close cart\" onclick=\"MapleCart.toggle()\"><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg></button></div><div class=\"cart-items\" id=\"cart-items\"><div class=\"cart-empty\" id=\"cart-empty\"><p style=\"font-size:2rem;opacity:0.3;margin-bottom:1rem;\"></p><p>Your cart is empty</p></div></div><div class=\"cart-footer\" id=\"cart-footer\" style=\"display:none;\"><div class=\"cart-subtotal\"><span class=\"cart-subtotal-label\">Subtotal</span><span class=\"cart-subtotal-price\" id=\"cart-subtotal\">$0.00</span></div><p class=\"cart-note\">Shipping &amp; taxes calculated at checkout</p><button class=\"cart-checkout-btn\" id=\"cart-checkout\" onclick=\"MapleCart.checkout()\">Checkout<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></svg></button></div></aside>";
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
  function addLine(variantId, qty) { if (!cartId) return createCart(variantId, qty); return gql('mutation($cartId:ID!,$lines:[CartLineInput!]!){cartLinesAdd(cartId:$cartId,lines:$lines){cart{' + CART_FRAGMENT + '}userErrors{field message}}}', { cartId: cartId, lines: [{ merchandiseId: variantId, quantity: qty || 1 }] }).then(function (res) { if (res.data.cartLinesAdd.userErrors && res.data.cartLinesAdd.userErrors.length) { localStorage.removeItem('maple_cart_id'); cartId = null; return createCart(variantId, qty); } cartData = res.data.cartLinesAdd.cart; return cartData; }); }
  function updateLine(lineId, qty) { return gql('mutation($cartId:ID!,$lines:[CartLineUpdateInput!]!){cartLinesUpdate(cartId:$cartId,lines:$lines){cart{' + CART_FRAGMENT + '}}}', { cartId: cartId, lines: [{ id: lineId, quantity: qty }] }).then(function (res) { cartData = res.data.cartLinesUpdate.cart; return cartData; }); }
  function removeLine(lineId) { return gql('mutation($cartId:ID!,$lineIds:[ID!]!){cartLinesRemove(cartId:$cartId,lineIds:$lineIds){cart{' + CART_FRAGMENT + '}}}', { cartId: cartId, lineIds: [lineId] }).then(function (res) { cartData = res.data.cartLinesRemove.cart; return cartData; }); }
  function fetchCart() { if (!cartId) return Promise.resolve(null); return gql('query($id:ID!){cart(id:$id){' + CART_FRAGMENT + '}}', { id: cartId }).then(function (res) { if (!res.data.cart) { localStorage.removeItem('maple_cart_id'); cartId = null; cartData = null; return null; } cartData = res.data.cart; return cartData; }); }
  function getLines() { if (!cartData || !cartData.lines) return []; return cartData.lines.edges.map(function (e) { return e.node; }); }
  function getTotalQty() { return getLines().reduce(function (s, l) { return s + l.quantity; }, 0); }
  function renderBadge() { var el = document.getElementById('cart-count'); if (!el) return; var qty = getTotalQty(); el.textContent = qty; el.classList.toggle('visible', qty > 0); }
  function renderDrawer() {
    var itemsEl = document.getElementById('cart-items'); var emptyEl = document.getElementById('cart-empty'); var footerEl = document.getElementById('cart-footer'); var subtotalEl = document.getElementById('cart-subtotal'); var lines = getLines();
    itemsEl.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });
    if (!lines.length) { emptyEl.style.display = ''; footerEl.style.display = 'none'; return; }
    emptyEl.style.display = 'none'; footerEl.style.display = '';
    lines.forEach(function (line) {
      var v = line.merchandise; var price = parseFloat(v.priceV2.amount) * line.quantity; var imgUrl = v.image ? v.image.url + '&width=144' : ''; var div = document.createElement('div'); div.className = 'cart-item';
      div.innerHTML = (imgUrl ? '<img class="cart-item-img" src="' + imgUrl + '" alt="' + (window.MapleEsc||String)(v.image.altText || v.product.title) + '">' : '<div class="cart-item-img"></div>') + '<div class="cart-item-info"><div class="cart-item-name">' + v.product.title + '</div><div class="cart-item-variant">' + v.title + '</div><div class="cart-item-bottom"><div class="cart-item-qty"><button aria-label="Decrease" data-line="' + line.id + '" data-action="dec">&minus;</button><span>' + line.quantity + '</span><button aria-label="Increase" data-line="' + line.id + '" data-action="inc">+</button></div><span class="cart-item-price">$' + price.toFixed(2) + '</span></div></div>';
      itemsEl.appendChild(div);
    });
    if (cartData.cost && cartData.cost.subtotalAmount) { subtotalEl.textContent = '$' + parseFloat(cartData.cost.subtotalAmount.amount).toFixed(2) + ' CAD'; }
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
            if (finalQty <= 0 || !sl || sl.quantity !== finalQty) renderDrawer();
            renderBadge();
          }).catch(function () { renderDrawer(); renderBadge(); });
        }, 300);
      });
    });
  }
  function toggle() { var overlay = document.getElementById('cart-overlay'); var drawer = document.getElementById('cart-drawer'); var isOpen = drawer.classList.contains('open'); drawer.classList.toggle('open'); overlay.classList.toggle('open'); document.body.style.overflow = isOpen ? '' : 'hidden'; if (!isOpen) renderDrawer(); }
  function addFromBtn(btn) { var variantId = btn.dataset.variantId; if (!variantId) return; var origHTML = btn.innerHTML; btn.classList.add('added'); btn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg> Added'; addLine(variantId, 1).then(function () { renderBadge(); setTimeout(function () { btn.classList.remove('added'); btn.innerHTML = origHTML; }, 1400); }); }
  function checkout() { if (!cartData || !cartData.checkoutUrl) return; if (window.MapleSafeCheckout) { window.MapleSafeCheckout(cartData.checkoutUrl); } else { window.location.href = cartData.checkoutUrl; } }
  function init() { fetchCart().then(function () { renderBadge(); }); document.getElementById('cart-overlay').addEventListener('click', toggle); document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('cart-drawer').classList.contains('open')) toggle(); }); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
  return { toggle: toggle, addFromBtn: addFromBtn, addLine: addLine, renderBadge: renderBadge, checkout: checkout };
})();
var MapleCart = window.MapleCart;
