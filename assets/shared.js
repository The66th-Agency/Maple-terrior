// ═══════════════════════════════════════════════════════
// MAPLE TERROIR — Shared Site Features
// Search, Announcement Bar, Back to Top, Recently Viewed
// ═══════════════════════════════════════════════════════

// ── Security helpers (exposed globally for per-page cart code) ─────
// Why exposed: each page has its own inline cart IIFE that needs to
// validate the Shopify checkout URL and the cached cart id.
window.MapleEsc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

// Allowlist redirect for Shopify-issued checkout URLs. Returns true on redirect.
window.MapleSafeCheckout = function (url) {
  if (!url) return false;
  var u;
  try { u = new URL(url, window.location.origin); } catch (e) { return false; }
  if (u.protocol !== 'https:') return false;
  var allowed = /(^|\.)myshopify\.com$|(^|\.)shopify\.com$|^checkout\.mapleterroir\.com$|^mapleterroir\.com$/i;
  if (!allowed.test(u.hostname)) return false;
  window.location.href = u.href;
  return true;
};

// Shopify Cart IDs are GIDs ("gid://shopify/Cart/...") or short opaque strings.
// Drop anything with HTML chars, whitespace, or wrong shape — likely tampered.
window.MapleValidCartId = function (id) {
  if (!id || typeof id !== 'string') return false;
  if (id.length > 512) return false;
  return /^[A-Za-z0-9:/?=\-_.%]+$/.test(id);
};

// Sanitize the persisted cart id at page load. If invalid, drop it so the
// per-page cart IIFEs see a clean slate.
(function () {
  var raw = localStorage.getItem('maple_cart_id');
  if (raw && !window.MapleValidCartId(raw)) {
    localStorage.removeItem('maple_cart_id');
  }
})();

// ── PostHog Analytics (delayed until after page load) ─────
function loadPostHog() {
  if (window.__posthogLoaded) return;
  window.__posthogLoaded = true;
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageviewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init('phc_gYBcDQXNpM98bOjJiiiuuXVr0FtNw0amImvXGdsl93C', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only'
  });
}
// Load PostHog after page is ready or after 3s, whichever first
if (document.readyState === 'complete') { setTimeout(loadPostHog, 100); }
else { window.addEventListener('load', function () { setTimeout(loadPostHog, 100); }); }
setTimeout(loadPostHog, 3000);

(function () {
  var SU = 'https://maple-terroir.myshopify.com/api/2026-01/graphql.json';
  var ST = '59618e3b6f5e626df6c5f527b4972d3d';
  var esc = window.MapleEsc;

  // Detect if we're in a subdirectory
  var pathPrefix = (window.location.pathname.includes('/blog/') || window.location.pathname.includes('/collections/')) ? '../' : '';

  // ── Inject HTML on DOM ready ─────────────────────────────
  function injectFeatures() {
    // 1. ANNOUNCEMENT BAR (rotating slider)
    if (!localStorage.getItem('mt_announce_dismissed')) {
      var announceMessages = [
        '<svg style="width:14px;height:14px;flex-shrink:0;color:#C4841D" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M16 16H20L22 12H7M16 16C16 17.1 15.1 18 14 18C12.9 18 12 17.1 12 16M7 16H12M7 16C7 17.1 6.1 18 5 18C3.9 18 3 17.1 3 16C3 14.9 3.9 14 5 14C6.1 14 7 14.9 7 16Z"/></svg><span>Free shipping on Canadian orders over <strong style="color:#F4C77D">$99 CAD</strong></span>',
        '<svg style="width:14px;height:14px;flex-shrink:0;color:#C4841D" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Our store is open for online orders with <strong style="color:#F4C77D">local pickup</strong> only. Select "local pickup" at checkout.</span>'
      ];
      var announceIndex = 0;
      var bar = document.createElement('div');
      bar.id = 'announce-bar';
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:45;background:#1A1714;color:#FDFBF7;display:flex;align-items:center;justify-content:center;gap:0.75rem;padding:0.5rem 1rem;font-size:0.72rem;font-weight:500;letter-spacing:0.04em;transition:transform 0.4s cubic-bezier(0.32,0.72,0,1);overflow:hidden;';
      var slideWrap = document.createElement('div');
      slideWrap.id = 'announce-slides';
      slideWrap.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:0.75rem;transition:opacity 0.4s ease,transform 0.4s ease;';
      slideWrap.innerHTML = announceMessages[0];
      bar.appendChild(slideWrap);
      bar.insertAdjacentHTML('beforeend', '<button onclick="dismissAnnounce()" style="position:absolute;right:0.5rem;background:none;border:none;color:rgba(253,251,247,0.4);cursor:pointer;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;line-height:1" aria-label="Dismiss">&times;</button>');
      document.body.prepend(bar);
      // Rotate messages every 5s
      setInterval(function () {
        slideWrap.style.opacity = '0';
        slideWrap.style.transform = 'translateY(-8px)';
        setTimeout(function () {
          announceIndex = (announceIndex + 1) % announceMessages.length;
          slideWrap.innerHTML = announceMessages[announceIndex];
          slideWrap.style.transform = 'translateY(8px)';
          requestAnimationFrame(function () {
            slideWrap.style.opacity = '1';
            slideWrap.style.transform = 'translateY(0)';
          });
        }, 400);
      }, 5000);
      // Push nav down
      var nav = document.getElementById('navbar');
      if (nav) nav.style.transition = 'top 0.4s cubic-bezier(0.32,0.72,0,1)';
      setTimeout(function () {
        if (nav) nav.style.top = '1.75rem';
      }, 50);
    }

    // 2. SEARCH MODAL
    var searchHTML = '<div id="search-overlay" style="position:fixed;inset:0;background:rgba(26,23,20,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:300;opacity:0;pointer-events:none;transition:opacity 0.3s cubic-bezier(0.32,0.72,0,1)"></div>' +
      '<div id="search-modal" style="position:fixed;top:0;left:50%;transform:translateX(-50%) translateY(-20px);z-index:301;width:min(600px,92vw);margin-top:6rem;opacity:0;pointer-events:none;transition:opacity 0.3s cubic-bezier(0.32,0.72,0,1),transform 0.3s cubic-bezier(0.32,0.72,0,1)">' +
        '<div style="background:#FDFBF7;border-radius:2rem;box-shadow:0 32px 80px -20px rgba(26,23,20,0.2);overflow:hidden;border:1px solid rgba(217,209,196,0.3)">' +
          '<div style="display:flex;align-items:center;gap:0.75rem;padding:1.25rem 1.5rem;border-bottom:1px solid rgba(217,209,196,0.3)">' +
            '<svg style="width:20px;height:20px;color:#B8AD9E;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
            '<input id="search-input" type="text" placeholder="Search products..." style="flex:1;border:none;outline:none;background:none;font-family:Plus Jakarta Sans,system-ui,sans-serif;font-size:1rem;color:#1A1714" autocomplete="off" maxlength="100">' +
            '<kbd style="font-size:0.65rem;padding:0.2rem 0.5rem;border-radius:0.375rem;background:rgba(217,209,196,0.3);color:#8C8175;font-family:system-ui">ESC</kbd>' +
          '</div>' +
          '<div id="search-results" style="max-height:400px;overflow-y:auto;padding:0.5rem"></div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', searchHTML);

    // 3. BACK TO TOP BUTTON
    var btt = document.createElement('button');
    btt.id = 'back-to-top';
    btt.setAttribute('aria-label', 'Back to top');
    btt.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:90;width:44px;height:44px;border-radius:50%;background:#1A1714;color:#FDFBF7;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(1rem);transition:opacity 0.3s cubic-bezier(0.32,0.72,0,1),transform 0.3s cubic-bezier(0.32,0.72,0,1),background 0.2s;pointer-events:none;box-shadow:0 8px 24px rgba(26,23,20,0.15);';
    btt.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    btt.addEventListener('mouseenter', function () { btt.style.background = '#C4841D'; });
    btt.addEventListener('mouseleave', function () { btt.style.background = '#1A1714'; });
    btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(btt);

    // 4. CART LINK IN MOBILE MENU
    var mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      var menuInner = mobileMenu.querySelector('.flex.flex-col');
      if (menuInner && !menuInner.querySelector('.mobile-cart-link')) {
        var cartLink = document.createElement('button');
        cartLink.className = 'mobile-cart-link text-3xl font-display font-semibold text-charcoal';
        cartLink.style.cssText = 'background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:0.5rem;';
        cartLink.innerHTML = 'Cart <span id="mobile-cart-badge" style="font-size:0.75rem;background:#C4841D;color:#fff;border-radius:100px;padding:0.15rem 0.6rem;font-family:Plus Jakarta Sans,system-ui,sans-serif;font-weight:600;display:none"></span>';
        cartLink.addEventListener('click', function () {
          if (typeof MapleCart !== 'undefined') MapleCart.toggle();
        });
        // Insert before the "Shop Now" button
        var shopBtn = menuInner.querySelector('a[href*="products"]');
        if (shopBtn && shopBtn.classList.contains('btn-premium')) {
          menuInner.insertBefore(cartLink, shopBtn);
        } else {
          menuInner.appendChild(cartLink);
        }
      }
    }

    // Update mobile cart badge when cart renders
    var origRenderBadge = window.MapleCart && window.MapleCart.renderBadge;
    if (origRenderBadge) {
      var _origRB = origRenderBadge;
      // We'll just poll it since MapleCart may not be loaded yet
    }
    setInterval(function () {
      var badge = document.getElementById('cart-count');
      var mobileBadge = document.getElementById('mobile-cart-badge');
      if (badge && mobileBadge) {
        var qty = badge.textContent;
        if (qty && qty !== '0') {
          mobileBadge.textContent = qty;
          mobileBadge.style.display = 'inline';
        } else {
          mobileBadge.style.display = 'none';
        }
      }
    }, 1000);

    // 5. SEARCH ICON IN NAV
    var cartBtn = document.getElementById('cart-toggle');
    if (cartBtn) {
      var searchBtn = document.createElement('button');
      searchBtn.setAttribute('aria-label', 'Search products');
      searchBtn.className = cartBtn.className.replace('ml-2', '');
      searchBtn.style.marginLeft = '0.25rem';
      searchBtn.innerHTML = '<svg class="w-5 h-5 text-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
      searchBtn.addEventListener('click', toggleSearch);
      cartBtn.parentNode.insertBefore(searchBtn, cartBtn);
    }

    // 6. NEWSLETTER SIGNUP IN FOOTER — DISABLED
    // No email service is wired. Set window.MT_NEWSLETTER_ENABLED = true
    // ONLY after wiring `handleNewsletter` to a real endpoint (Klaviyo /
    // Shopify Customer API). Until then this stays off — submitting to a
    // stub silently drops emails into the void and lies to users.
    if (window.MT_NEWSLETTER_ENABLED === true) {
      console.warn('[MT] Newsletter is enabled but handleNewsletter is still a stub. Wire it before launch.');
    }

    // Wire up events
    document.getElementById('search-overlay').addEventListener('click', toggleSearch);
    document.getElementById('search-input').addEventListener('input', debounce(onSearchInput, 300));
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toggleSearch(); }
      if (e.key === 'Escape') {
        var modal = document.getElementById('search-modal');
        if (modal && modal.style.opacity === '1') toggleSearch();
      }
    });

    // Back to top visibility
    window.addEventListener('scroll', function () {
      var show = window.scrollY > 500;
      btt.style.opacity = show ? '1' : '0';
      btt.style.transform = show ? 'translateY(0)' : 'translateY(1rem)';
      btt.style.pointerEvents = show ? 'auto' : 'none';
    }, { passive: true });
  }

  // ── Newsletter (stub — see note above) ─────────────────────
  window.handleNewsletter = function (e) {
    e.preventDefault();
    var msg = document.getElementById('newsletter-msg');
    if (msg) {
      msg.textContent = 'Newsletter signup is not yet available. Please email info@mapleterroir.com.';
      msg.style.display = 'block';
      msg.style.color = '#8C8175';
    }
    return false;
  };

  // ── Announcement Bar ──────────────────────────────────────
  window.dismissAnnounce = function () {
    localStorage.setItem('mt_announce_dismissed', '1');
    var bar = document.getElementById('announce-bar');
    if (bar) { bar.style.transform = 'translateY(-100%)'; }
    var nav = document.getElementById('navbar');
    if (nav) nav.style.top = '';
    setTimeout(function () { if (bar) bar.remove(); }, 400);
  };

  // ── Search ────────────────────────────────────────────────
  var searchOpen = false;
  function toggleSearch() {
    searchOpen = !searchOpen;
    var overlay = document.getElementById('search-overlay');
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('search-input');
    if (searchOpen) {
      overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto';
      modal.style.opacity = '1'; modal.style.pointerEvents = 'auto'; modal.style.transform = 'translateX(-50%) translateY(0)';
      document.body.style.overflow = 'hidden';
      setTimeout(function () { input.focus(); }, 100);
    } else {
      overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none';
      modal.style.opacity = '0'; modal.style.pointerEvents = 'none'; modal.style.transform = 'translateX(-50%) translateY(-20px)';
      document.body.style.overflow = '';
      input.value = '';
      document.getElementById('search-results').innerHTML = '';
    }
  }
  window.toggleSearch = toggleSearch;

  function debounce(fn, ms) {
    var timer; return function () { clearTimeout(timer); var args = arguments; timer = setTimeout(function () { fn.apply(null, args); }, ms); };
  }

  function onSearchInput() {
    var q = document.getElementById('search-input').value.trim().slice(0, 100);
    var results = document.getElementById('search-results');
    if (q.length < 2) { results.innerHTML = '<div style="padding:2rem;text-align:center;color:#B8AD9E;font-size:0.85rem">Type at least 2 characters to search</div>'; return; }
    results.innerHTML = '<div style="padding:2rem;text-align:center;color:#B8AD9E;font-size:0.85rem">Searching...</div>';

    fetch(SU, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': ST },
      body: JSON.stringify({
        query: 'query($q:String!){products(first:8,query:$q){edges{node{title handle images(first:1){edges{node{url altText}}}variants(first:1){edges{node{priceV2{amount currencyCode}}}}}}}}',
        variables: { q: q }
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      var products = res.data.products.edges.map(function (e) { return e.node; });
      if (!products.length) {
        // Build text node so q is never interpreted as HTML.
        results.innerHTML = '';
        var empty = document.createElement('div');
        empty.style.cssText = 'padding:2rem;text-align:center;color:#B8AD9E;font-size:0.85rem';
        empty.textContent = 'No products found for \u201C' + q + '\u201D';
        results.appendChild(empty);
        return;
      }
      results.innerHTML = '';
      products.forEach(function (p) {
        var img = p.images.edges.length ? p.images.edges[0].node : null;
        var price = p.variants.edges.length ? parseFloat(p.variants.edges[0].node.priceV2.amount).toFixed(2) : '';
        var a = document.createElement('a');
        a.href = pathPrefix + 'product.html?handle=' + encodeURIComponent(p.handle);
        a.style.cssText = 'display:flex;align-items:center;gap:1rem;padding:0.75rem 1rem;border-radius:1rem;text-decoration:none;color:inherit;transition:background 0.15s;';
        a.addEventListener('mouseenter', function () { a.style.background = 'rgba(217,209,196,0.2)'; });
        a.addEventListener('mouseleave', function () { a.style.background = 'none'; });
        a.innerHTML = (img ? '<img src="' + esc(img.url) + '&width=80" alt="' + esc(img.altText || p.title) + '" style="width:48px;height:48px;border-radius:0.75rem;object-fit:cover;background:#F5F0E8;flex-shrink:0">' : '<div style="width:48px;height:48px;border-radius:0.75rem;background:#F5F0E8;flex-shrink:0"></div>') +
          '<div style="flex:1;min-width:0"><div style="font-weight:500;font-size:0.88rem;color:#1A1714;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.title) + '</div><div style="font-size:0.75rem;color:#8C8175">$' + esc(price) + ' CAD</div></div>' +
          '<svg style="width:16px;height:16px;color:#D9D1C4;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>';
        a.addEventListener('click', function () { toggleSearch(); });
        results.appendChild(a);
      });
    })
    .catch(function () {
      results.innerHTML = '<div style="padding:2rem;text-align:center;color:#B8AD9E;font-size:0.85rem">Search unavailable. Please try again.</div>';
    });
  }

  // ── Recently Viewed (localStorage) ────────────────────────
  // Note: any future "Recently Viewed" rail MUST render title/img via
  // textContent or window.MapleEsc. Treat localStorage values as untrusted —
  // they could be tampered with via a future XSS or a sibling site.
  window.MapleSiteRecent = {
    KEY: 'mt_recently_viewed',
    MAX: 8,
    track: function (handle, title, imgUrl, price) {
      var items;
      try { items = JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (e) { items = []; }
      if (!Array.isArray(items)) items = [];
      items = items.filter(function (i) { return i && i.handle !== handle; });
      items.unshift({ handle: String(handle || ''), title: String(title || ''), img: String(imgUrl || ''), price: String(price || ''), ts: Date.now() });
      if (items.length > this.MAX) items = items.slice(0, this.MAX);
      try { localStorage.setItem(this.KEY, JSON.stringify(items)); } catch (e) {}
    },
    get: function (excludeHandle) {
      var items;
      try { items = JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (e) { return []; }
      if (!Array.isArray(items)) return [];
      if (excludeHandle) items = items.filter(function (i) { return i && i.handle !== excludeHandle; });
      return items;
    }
  };

  // ── Init ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFeatures);
  } else {
    injectFeatures();
  }
})();
