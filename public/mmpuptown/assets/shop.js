/* ==================================================================
   MMP STORE — catalog, pricing engine, cart, and page rendering.

   One file, no dependencies. Browsing, configuring and the cart work
   with no backend at all; only checkout talks to the server.

   THE CATALOG BELOW IS SEED DATA. Product names and specs are real
   print-shop items, but every price is illustrative and must be
   replaced with the shop's live price list before launch. Swap the
   numbers in TIERS and the whole store reprices itself.

   Three routes, matching how the shop actually works:
     store  — set prices, buy online
     pod    — print-on-demand vendor fulfils
     custom — needs an estimate, goes to customer service
   ================================================================== */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://qcikhcnclduakriextsz.supabase.co';
  var SUPABASE_ANON = 'sb_publishable_GifRjDSjTWuHSiN-y7b7ZQ_AFOMvkkh';
  var CART_KEY = 'mmp_cart_v1';

  // Product photos from Frank's current site (mpuptown.com, hosted by Firespring).
  // Hotlinked for now. Copy them into our own storage before that site is retired,
  // and confirm reuse rights: some Firespring images are platform-licensed stock.
  var FRANK_IMG = 'https://cdn.firespring.com/images/';

  /* ---------------- catalog ---------------- */

  var CATEGORIES = [
    { id: 'business-essentials', name: 'Business essentials', blurb: 'The things every business reorders.' },
    { id: 'marketing',           name: 'Marketing print',     blurb: 'Get the word out on paper.' },
    { id: 'large-format',        name: 'Signs & large format', blurb: 'Banners, posters and signage.' },
    { id: 'labels',              name: 'Labels & stickers',   blurb: 'Rolls, sheets and die-cuts.' },
    { id: 'apparel',            name: 'Apparel & merch',      blurb: 'Branded wearables, printed on demand.' },
    { id: 'union-political',     name: 'Union & political',   blurb: 'Union-printed, bug applied.' }
  ];

  var SIDES = { id: 'sides', label: 'Printed sides', choices: [
    { value: '1', label: 'Single-sided', mult: 1 },
    { value: '2', label: 'Double-sided', mult: 1.18 }
  ]};

  var PRODUCTS = [
    { id: 'business-cards', image: FRANK_IMG + '467c6edc-19dc-467e-9c97-6058c06fd704.png', cat: 'business-essentials', route: 'store',
      name: 'Business cards', blurb: 'Standard 3.5 × 2, full colour, cut and boxed.',
      unit: 'cards',
      tiers: [ {q:250,p:45}, {q:500,p:65}, {q:1000,p:89}, {q:2500,p:175} ],
      options: [
        { id:'stock', label:'Card stock', choices:[
          {value:'14pt', label:'14pt gloss', mult:1},
          {value:'16pt', label:'16pt matte', mult:1.15},
          {value:'linen', label:'32pt linen', mult:1.75} ]},
        SIDES,
        { id:'finish', label:'Finish', choices:[
          {value:'none', label:'None', mult:1},
          {value:'uv', label:'UV coating', mult:1.12},
          {value:'soft', label:'Soft-touch laminate', mult:1.35} ]}
      ]},

    { id: 'letterhead', image: FRANK_IMG + '29829f14-fb3d-4985-abe8-dd2798852a0a.jpg', cat: 'business-essentials', route: 'store',
      name: 'Letterhead', blurb: '8.5 × 11 on premium text stock.', unit: 'sheets',
      tiers: [ {q:250,p:78}, {q:500,p:112}, {q:1000,p:165} ],
      options: [
        { id:'stock', label:'Paper', choices:[
          {value:'70t', label:'70lb text', mult:1},
          {value:'linen', label:'24lb linen', mult:1.22} ]},
        SIDES
      ]},

    { id: 'envelopes', image: FRANK_IMG + 'dc6d4450-699c-4822-a287-521df293bc1c.jpg', cat: 'business-essentials', route: 'store',
      name: 'Envelopes', blurb: '#10 business envelopes, printed one colour or full.', unit: 'envelopes',
      tiers: [ {q:250,p:92}, {q:500,p:138}, {q:1000,p:198} ],
      options: [
        { id:'window', label:'Window', choices:[
          {value:'no', label:'No window', mult:1},
          {value:'yes', label:'Left window', mult:1.09} ]}
      ]},

    { id: 'ncr-forms', image: FRANK_IMG + '34d8a4f7-df62-4668-889b-cbc57ec8a90e.jpg', cat: 'business-essentials', route: 'custom',
      name: 'NCR carbonless forms', blurb: 'Multi-part forms, sequential numbering available.', unit: 'sets',
      tiers: [], options: [] },

    { id: 'flyers', image: FRANK_IMG + '18300f85-1d0a-4981-b74d-efd5d82b8071.jpg', cat: 'marketing', route: 'store',
      name: 'Flyers', blurb: 'Full colour, your choice of size and stock.', unit: 'flyers',
      tiers: [ {q:100,p:52}, {q:250,p:78}, {q:500,p:118}, {q:1000,p:189} ],
      options: [
        { id:'size', label:'Size', choices:[
          {value:'85x11', label:'8.5 × 11', mult:1},
          {value:'55x85', label:'5.5 × 8.5', mult:0.72},
          {value:'11x17', label:'11 × 17', mult:1.85} ]},
        { id:'stock', label:'Paper', choices:[
          {value:'100g', label:'100lb gloss text', mult:1},
          {value:'100c', label:'100lb gloss cover', mult:1.3} ]},
        SIDES
      ]},

    { id: 'brochures', image: FRANK_IMG + '76850388-24e8-4286-b67c-8c1324c0a0d3.png', cat: 'marketing', route: 'store',
      name: 'Brochures', blurb: 'Folded, full colour, scored so they fold clean.', unit: 'brochures',
      tiers: [ {q:100,p:118}, {q:250,p:189}, {q:500,p:295}, {q:1000,p:465} ],
      options: [
        { id:'fold', label:'Fold', choices:[
          {value:'tri', label:'Tri-fold', mult:1},
          {value:'half', label:'Half fold', mult:0.94},
          {value:'z', label:'Z-fold', mult:1.06} ]},
        { id:'stock', label:'Paper', choices:[
          {value:'100g', label:'100lb gloss text', mult:1},
          {value:'80c', label:'80lb matte cover', mult:1.28} ]}
      ]},

    { id: 'postcards', image: FRANK_IMG + 'b426c1bb-957f-4464-967b-286beeddf667.jpg', cat: 'marketing', route: 'store',
      name: 'Postcards', blurb: 'Mailable sizes, USPS-compliant. We can mail them for you.', unit: 'postcards',
      tiers: [ {q:250,p:68}, {q:500,p:98}, {q:1000,p:152}, {q:2500,p:298} ],
      options: [
        { id:'size', label:'Size', choices:[
          {value:'46', label:'4 × 6', mult:1},
          {value:'59', label:'5 × 9', mult:1.24},
          {value:'611', label:'6 × 11', mult:1.55} ]},
        SIDES
      ]},

    { id: 'door-hangers', image: FRANK_IMG + '0e16ce41-c3c4-41f5-bd78-e9f8d39f3db6.jpg', cat: 'marketing', route: 'store',
      name: 'Door hangers', blurb: '4.25 × 11 with a die-cut hook.', unit: 'hangers',
      tiers: [ {q:250,p:96}, {q:500,p:142}, {q:1000,p:218} ],
      options: [ SIDES ]},

    { id: 'banners', image: FRANK_IMG + 'a2b3efeb-8903-4167-8974-fff8e3c5fb7e.png', cat: 'large-format', route: 'store',
      name: 'Vinyl banners', blurb: '13oz scrim vinyl, hemmed with grommets.', unit: 'banners',
      tiers: [ {q:1,p:78}, {q:2,p:148}, {q:5,p:340}, {q:10,p:640} ],
      options: [
        { id:'size', label:'Size', choices:[
          {value:'2x4', label:"2ft × 4ft", mult:1},
          {value:'3x6', label:"3ft × 6ft", mult:2.1},
          {value:'4x8', label:"4ft × 8ft", mult:3.6} ]},
        { id:'finish', label:'Finishing', choices:[
          {value:'grommets', label:'Hem + grommets', mult:1},
          {value:'pole', label:'Pole pockets', mult:1.15} ]}
      ]},

    { id: 'posters', image: FRANK_IMG + '86254019-f9e6-43bb-be6b-8d513848a918.jpg', cat: 'large-format', route: 'store',
      name: 'Posters', blurb: 'Indoor posters on satin or matte photo stock.', unit: 'posters',
      tiers: [ {q:1,p:22}, {q:5,p:88}, {q:10,p:158}, {q:25,p:340} ],
      options: [
        { id:'size', label:'Size', choices:[
          {value:'1824', label:'18 × 24', mult:1},
          {value:'2436', label:'24 × 36', mult:1.7} ]}
      ]},

    { id: 'yard-signs', image: FRANK_IMG + '731fad43-31f7-4f22-837d-d0d96e2823e2.jpg', cat: 'large-format', route: 'store',
      name: 'Yard signs', blurb: '4mm corrugated plastic with wire stakes.', unit: 'signs',
      tiers: [ {q:10,p:145}, {q:25,p:298}, {q:50,p:520}, {q:100,p:890} ],
      options: [ SIDES ]},

    { id: 'labels', image: FRANK_IMG + '7a2b8d0e-2007-4336-8990-32f16e7dad53.jpg', cat: 'labels', route: 'store',
      name: 'Labels & stickers', blurb: 'Sheets, rolls or die-cut to your shape.', unit: 'labels',
      tiers: [ {q:250,p:64}, {q:500,p:92}, {q:1000,p:138}, {q:2500,p:265} ],
      options: [
        { id:'material', label:'Material', choices:[
          {value:'paper', label:'Gloss paper', mult:1},
          {value:'vinyl', label:'White vinyl', mult:1.4},
          {value:'clear', label:'Clear vinyl', mult:1.55} ]},
        { id:'shape', label:'Cut', choices:[
          {value:'rect', label:'Square or rectangle', mult:1},
          {value:'round', label:'Circle or oval', mult:1.08},
          {value:'custom', label:'Custom die-cut', mult:1.3} ]}
      ]},

    { id: 'tshirts', image: FRANK_IMG + '0a64fb49-e8ce-47c6-a30c-a8f5a4d35b05.png', cat: 'apparel', route: 'pod',
      name: 'T-shirts', blurb: 'Printed and shipped by our print-on-demand partner.', unit: 'shirts',
      tiers: [ {q:1,p:24}, {q:10,p:210}, {q:25,p:475}, {q:50,p:880} ],
      options: [
        { id:'placement', label:'Print placement', choices:[
          {value:'front', label:'Front only', mult:1},
          {value:'both', label:'Front and back', mult:1.3} ]}
      ]},

    { id: 'hoodies', image: FRANK_IMG + '7a42fe1e-b621-49a6-b9a2-b24d38c46efe.jpg', cat: 'apparel', route: 'pod',
      name: 'Hoodies', blurb: 'Printed and shipped by our print-on-demand partner.', unit: 'hoodies',
      tiers: [ {q:1,p:46}, {q:10,p:420}, {q:25,p:975} ],
      options: [] },

    { id: 'union-flyers', image: FRANK_IMG + '7fa7b398-d285-4a91-b267-ed977564be93.png', cat: 'union-political', route: 'store',
      name: 'Union-printed flyers', blurb: 'Full colour with the union bug applied.', unit: 'flyers',
      tiers: [ {q:250,p:88}, {q:500,p:132}, {q:1000,p:205} ],
      options: [ SIDES ]},

    { id: 'political-mailers', image: FRANK_IMG + 'c91ed377-dca6-4343-a99c-93275de2f93d.jpg', cat: 'union-political', route: 'custom',
      name: 'Political mailers', blurb: 'Disclaimers, mail permits and list handling. Always quoted.', unit: 'mailers',
      tiers: [], options: [] }
  ];

  /* ---------------- helpers ---------------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function money(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function param(name) { return new URLSearchParams(window.location.search).get(name); }
  function productById(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }
  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
    return null;
  }
  function routeLabel(r) {
    return r === 'pod' ? 'Print on demand' : r === 'custom' ? 'Quoted job' : 'Buy online';
  }
  function fromPrice(p) {
    if (!p.tiers.length) return null;
    var lowest = p.tiers[0];
    return lowest.p / lowest.q;
  }

  /* ---------------- pricing ---------------- */

  function priceFor(product, qty, chosen) {
    if (!product.tiers.length) return null;
    var tier = product.tiers[0];
    for (var i = 0; i < product.tiers.length; i++) {
      if (qty >= product.tiers[i].q) tier = product.tiers[i];
    }
    var base = tier.p;
    // scale between tiers so an in-between quantity is not mispriced
    if (qty !== tier.q) base = (tier.p / tier.q) * qty;
    var mult = 1;
    (product.options || []).forEach(function (opt) {
      var val = chosen[opt.id];
      opt.choices.forEach(function (c) { if (c.value === val) mult *= (c.mult || 1); });
    });
    return Math.round(base * mult * 100) / 100;
  }

  /* ---------------- cart ---------------- */

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function writeCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
    paintCount();
  }
  function cartCount() {
    return readCart().length;
  }
  function cartTotal() {
    return readCart().reduce(function (sum, it) { return sum + (it.price || 0); }, 0);
  }
  function paintCount() {
    var badges = document.querySelectorAll('[data-cart-count]');
    var n = cartCount();
    Array.prototype.forEach.call(badges, function (b) {
      b.textContent = n ? String(n) : '';
      b.style.display = n ? '' : 'none';
    });
  }

  /* ---------------- chrome ---------------- */

  var NAV = [
    ['/mmpuptown/about/', 'About'],
    ['/mmpuptown/mission/', 'Mission'],
    ['/mmpuptown/products/', 'Products'],
    ['/mmpuptown/shop/', 'Shop'],
    ['/mmpuptown/print-store/', 'Print Store'],
    ['/mmpuptown/news/', 'News'],
    ['/mmpuptown/contact/', 'Contact']
  ];

  var LOGO_SVG =
    '<svg viewBox="0 0 230 64" xmlns="http://www.w3.org/2000/svg">' +
    '<g transform="translate(4 4)">' +
    '<path d="M 28 2 A 26 22 0 1 1 28 50" fill="none" stroke="#1d7a44" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M 28 2 A 26 22 0 1 0 28 50" fill="none" stroke="#ec7621" stroke-width="5" stroke-linecap="round"/>' +
    '<text x="28" y="40" font-family="Open Sans, sans-serif" font-weight="900" font-size="38" fill="#1d7a44" text-anchor="middle" font-style="italic">M</text></g>' +
    '<text x="66" y="22" font-family="Open Sans, sans-serif" font-weight="800" font-size="17" fill="#1d7a44" font-style="italic">Minuteman</text>' +
    '<text x="66" y="40" font-family="Open Sans, sans-serif" font-weight="800" font-size="17" fill="#1d7a44" font-style="italic">Press</text>' +
    '<text x="66" y="56" font-family="Open Sans, sans-serif" font-weight="700" font-size="7.5" fill="#ec7621" letter-spacing="0.04em">WE DESIGN, PRINT &amp; PROMOTE...YOU!</text></svg>';

  function renderChrome(crumbs) {
    var host = $('#site-chrome');
    if (!host) return;
    var here = window.location.pathname;

    var bar = el('div', 'top-bar');
    bar.innerHTML = '<span class="addr">📍 4024 Washington Ave North, Minneapolis MN 55412</span>' +
                    '<span class="phone">📞 612-870-0777</span>';

    var nav = el('nav', 'main-nav');
    var brand = el('a', 'brand');
    brand.href = '/mmpuptown/';
    brand.innerHTML = '<span class="brand-logo">' + LOGO_SVG + '</span>';
    nav.appendChild(brand);

    var ul = el('ul', 'nav-links');
    NAV.forEach(function (n) {
      var li = el('li');
      var a = el('a', here.indexOf(n[0]) === 0 ? 'active' : null, n[1]);
      a.href = n[0];
      li.appendChild(a);
      ul.appendChild(li);
    });
    nav.appendChild(ul);

    var cta = el('div', 'nav-cta');
    var quote = el('a', 'btn btn-outline', 'Request a Quote');
    quote.href = '/mmpuptown/print-store/quote/';
    var cart = el('a', 'btn btn-primary cart-btn');
    cart.href = '/mmpuptown/shop/cart/';
    cart.innerHTML = 'Cart <span class="cart-badge" data-cart-count></span>';
    cta.appendChild(quote);
    cta.appendChild(cart);
    nav.appendChild(cta);

    host.appendChild(bar);
    host.appendChild(nav);

    if (crumbs && crumbs.length) {
      var bc = el('div', 'breadcrumb');
      var inner = el('div', 'inner');
      crumbs.forEach(function (c, i) {
        if (i) inner.appendChild(el('span', 'sep', '/'));
        if (c[1]) { var a = el('a', null, c[0]); a.href = c[1]; inner.appendChild(a); }
        else inner.appendChild(el('span', 'current', c[0]));
      });
      bc.appendChild(inner);
      host.appendChild(bc);
    }
    paintCount();
  }

  function renderFooter() {
    var host = $('#site-footer');
    if (!host) return;
    host.innerHTML =
      '<div class="foot-inner">' +
        '<div><h5>Minuteman Press Uptown</h5><p>4024 Washington Ave North<br>Minneapolis, MN 55412<br>612-870-0777</p></div>' +
        '<div><h5>Hours</h5><p>Monday–Friday<br>8:00a – 6:00p<br><br>Saturday–Sunday<br>Closed</p></div>' +
        '<div><h5>Locally owned</h5><p>Independently owned and operated for over 30 years. Union print shop.</p></div>' +
      '</div>' +
      '<div class="legal"><span>© 2026 I A Z Corporation dba Minuteman Press Uptown</span><span>·</span><span>All rights reserved</span></div>';
  }

  /* ---------------- product art ----------------
     Drawn mockups, one per product, until real photography exists.
     Give a product image: '/path/to/photo.jpg' and the photo is used
     instead — nothing else changes. */

  var ART = {
    'business-cards':
      '<rect x="36" y="46" width="112" height="66" rx="3" fill="#f1ece0" transform="rotate(-9 92 79)"/>' +
      '<g transform="rotate(4 108 72)"><rect x="52" y="39" width="112" height="66" rx="3" fill="#fff"/>' +
      '<circle cx="71" cy="58" r="8" fill="#ec7621"/><rect x="86" y="53" width="50" height="6" rx="2" fill="#1d7a44"/>' +
      '<rect x="86" y="63" width="32" height="3.5" rx="1.5" fill="#c8c8c8"/><rect x="62" y="85" width="64" height="3.5" rx="1.5" fill="#d4d4d4"/>' +
      '<rect x="62" y="92" width="46" height="3.5" rx="1.5" fill="#d4d4d4"/></g>',
    'letterhead':
      '<rect x="72" y="18" width="74" height="120" rx="2" fill="#f1ece0" transform="rotate(5 109 78)"/>' +
      '<g transform="rotate(-3 100 75)"><rect x="60" y="12" width="76" height="124" rx="2" fill="#fff"/>' +
      '<circle cx="73" cy="26" r="6" fill="#ec7621"/><rect x="83" y="22" width="30" height="5" rx="1.5" fill="#1d7a44"/>' +
      '<rect x="83" y="30" width="18" height="3" rx="1" fill="#c8c8c8"/>' +
      '<rect x="68" y="50" width="60" height="3" rx="1" fill="#dcdcdc"/><rect x="68" y="58" width="56" height="3" rx="1" fill="#dcdcdc"/>' +
      '<rect x="68" y="66" width="60" height="3" rx="1" fill="#dcdcdc"/><rect x="68" y="74" width="44" height="3" rx="1" fill="#dcdcdc"/>' +
      '<rect x="68" y="86" width="58" height="3" rx="1" fill="#dcdcdc"/><rect x="68" y="94" width="50" height="3" rx="1" fill="#dcdcdc"/>' +
      '<rect x="68" y="118" width="24" height="3" rx="1" fill="#1d7a44"/></g>',
    'envelopes':
      '<rect x="46" y="32" width="116" height="70" rx="3" fill="#f1ece0" transform="rotate(-6 104 67)"/>' +
      '<g transform="rotate(3 100 80)"><rect x="38" y="46" width="124" height="72" rx="3" fill="#fff"/>' +
      '<circle cx="50" cy="58" r="5" fill="#ec7621"/><rect x="59" y="55" width="26" height="4" rx="1.5" fill="#1d7a44"/>' +
      '<rect x="59" y="62" width="18" height="2.5" rx="1" fill="#cfcfcf"/>' +
      '<rect x="52" y="82" width="58" height="24" rx="2" fill="#eef3f7" stroke="#d5dde3"/>' +
      '<rect x="58" y="88" width="40" height="3" rx="1.5" fill="#b9c3cb"/><rect x="58" y="95" width="30" height="3" rx="1.5" fill="#b9c3cb"/></g>',
    'ncr-forms':
      '<rect x="66" y="30" width="80" height="104" rx="2" fill="#f6b3c4"/>' +
      '<rect x="60" y="23" width="80" height="104" rx="2" fill="#fbe07a"/>' +
      '<rect x="54" y="16" width="80" height="104" rx="2" fill="#fff"/>' +
      '<rect x="62" y="24" width="30" height="5" rx="1.5" fill="#1d7a44"/>' +
      '<text x="126" y="29" font-family="monospace" font-size="8" font-weight="700" fill="#c75e15" text-anchor="end">No 0142</text>' +
      '<rect x="62" y="40" width="64" height="56" fill="none" stroke="#d8d8d8"/>' +
      '<path d="M62 50 H126 M62 60 H126 M62 70 H126 M62 80 H126 M108 40 V96" stroke="#e3e3e3"/>' +
      '<rect x="62" y="104" width="30" height="3" rx="1" fill="#cfcfcf"/><rect x="100" y="104" width="26" height="3" rx="1" fill="#cfcfcf"/>',
    'flyers':
      '<rect x="70" y="18" width="78" height="120" rx="2" fill="#f7ecdf" transform="rotate(-7 109 78)"/>' +
      '<g transform="rotate(5 100 75)"><rect x="60" y="12" width="80" height="124" rx="2" fill="#fff"/>' +
      '<rect x="68" y="20" width="64" height="46" rx="2" fill="#ec7621"/><circle cx="84" cy="36" r="7" fill="#fbe6d4"/>' +
      '<path d="M68 66 L90 46 L104 58 L116 50 L132 66 Z" fill="#c75e15"/>' +
      '<rect x="68" y="74" width="54" height="8" rx="1.5" fill="#1d7a44"/>' +
      '<rect x="68" y="88" width="62" height="3" rx="1" fill="#d6d6d6"/><rect x="68" y="95" width="58" height="3" rx="1" fill="#d6d6d6"/>' +
      '<rect x="68" y="102" width="46" height="3" rx="1" fill="#d6d6d6"/><rect x="68" y="116" width="34" height="10" rx="5" fill="#1d7a44"/></g>',
    'brochures':
      '<path d="M36 30 L80 22 L80 128 L36 120 Z" fill="#efe9dc"/>' +
      '<path d="M80 22 L122 30 L122 120 L80 128 Z" fill="#fff"/>' +
      '<path d="M122 30 L166 22 L166 128 L122 120 Z" fill="#f6f2ea"/>' +
      '<path d="M86 38 L116 43 L116 70 L86 66 Z" fill="#ec7621"/>' +
      '<path d="M86 76 L116 80 L116 84 L86 80 Z" fill="#1d7a44"/>' +
      '<path d="M86 90 L112 94 L112 96.5 L86 92.5 Z" fill="#d2d2d2"/><path d="M86 98 L110 102 L110 104.5 L86 100.5 Z" fill="#d2d2d2"/>' +
      '<path d="M130 40 L158 36 L158 58 L130 62 Z" fill="#1d7a44"/>' +
      '<path d="M44 44 L72 40 L72 42.5 L44 46.5 Z" fill="#c9c9c9"/><path d="M44 52 L70 48 L70 50.5 L44 54.5 Z" fill="#c9c9c9"/>',
    'postcards':
      '<rect x="44" y="30" width="124" height="80" rx="3" fill="#f7ecdf" transform="rotate(7 106 70)"/>' +
      '<g transform="rotate(-5 100 78)"><rect x="34" y="40" width="130" height="82" rx="3" fill="#fff"/>' +
      '<line x1="100" y1="50" x2="100" y2="112" stroke="#e3ddd0" stroke-width="1.5"/>' +
      '<rect x="138" y="48" width="18" height="22" rx="1" fill="#fff" stroke="#ec7621" stroke-width="1.6" stroke-dasharray="2.5 2"/>' +
      '<rect x="141.5" y="51.5" width="11" height="15" fill="#1d7a44"/>' +
      '<rect x="108" y="84" width="48" height="3.5" rx="1.5" fill="#cfcfcf"/><rect x="108" y="92" width="40" height="3.5" rx="1.5" fill="#cfcfcf"/>' +
      '<rect x="108" y="100" width="44" height="3.5" rx="1.5" fill="#cfcfcf"/>' +
      '<rect x="44" y="52" width="46" height="9" rx="1.5" fill="#ec7621"/><rect x="44" y="67" width="44" height="3" rx="1" fill="#d6d6d6"/>' +
      '<rect x="44" y="74" width="40" height="3" rx="1" fill="#d6d6d6"/><rect x="44" y="81" width="42" height="3" rx="1" fill="#d6d6d6"/></g>',
    'door-hangers':
      '<g transform="rotate(-4 100 75)"><rect x="76" y="10" width="50" height="130" rx="5" fill="#fff"/>' +
      '<circle cx="101" cy="32" r="11" fill="#d96a1d"/><path d="M110 26 L126 14" stroke="#d96a1d" stroke-width="3"/>' +
      '<rect x="84" y="54" width="34" height="26" rx="2" fill="#1d7a44"/>' +
      '<rect x="84" y="88" width="34" height="3" rx="1" fill="#d6d6d6"/><rect x="84" y="95" width="30" height="3" rx="1" fill="#d6d6d6"/>' +
      '<rect x="84" y="102" width="32" height="3" rx="1" fill="#d6d6d6"/><rect x="84" y="118" width="26" height="9" rx="4.5" fill="#ec7621"/></g>',
    'banners':
      '<path d="M25 53 L10 28 M175 53 L190 28" stroke="#dbe4ea" stroke-width="1.5"/>' +
      '<rect x="16" y="44" width="168" height="62" rx="2" fill="#fff"/>' +
      '<g fill="none" stroke="#9aa6af" stroke-width="2"><circle cx="25" cy="53" r="3.5"/><circle cx="100" cy="53" r="3.5"/>' +
      '<circle cx="175" cy="53" r="3.5"/><circle cx="25" cy="97" r="3.5"/><circle cx="100" cy="97" r="3.5"/><circle cx="175" cy="97" r="3.5"/></g>' +
      '<rect x="40" y="62" width="120" height="13" rx="2" fill="#2a6f97"/><rect x="62" y="81" width="76" height="7" rx="2" fill="#ec7621"/>',
    'posters':
      '<g transform="rotate(-4 100 75)"><rect x="62" y="8" width="76" height="134" rx="2" fill="#fff"/>' +
      '<rect x="68" y="14" width="64" height="88" fill="#2a6f97"/><circle cx="114" cy="38" r="11" fill="#f4c430"/>' +
      '<path d="M68 102 L92 66 L106 84 L117 72 L132 102 Z" fill="#1b4b68"/>' +
      '<rect x="70" y="110" width="46" height="8" rx="1" fill="#1d1d1d"/><rect x="70" y="123" width="32" height="3.5" rx="1" fill="#bdbdbd"/></g>',
    'yard-signs':
      '<path d="M84 98 V140 M116 98 V140" stroke="#c9d3da" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="36" y="22" width="128" height="80" rx="3" fill="#fff"/>' +
      '<rect x="46" y="32" width="108" height="18" rx="2" fill="#ec7621"/>' +
      '<rect x="58" y="58" width="84" height="9" rx="1.5" fill="#2a6f97"/>' +
      '<rect x="70" y="74" width="60" height="5" rx="1.5" fill="#c4c4c4"/><rect x="80" y="86" width="40" height="5" rx="1.5" fill="#c4c4c4"/>',
    'labels':
      '<rect x="44" y="18" width="112" height="116" rx="3" fill="#fff"/>' +
      '<circle cx="68" cy="44" r="13" fill="#1d7a44"/><circle cx="100" cy="44" r="13" fill="#ec7621"/><circle cx="132" cy="44" r="13" fill="#f4c430"/>' +
      '<circle cx="68" cy="76" r="13" fill="#ec7621"/><circle cx="100" cy="76" r="13" fill="#f4c430"/><circle cx="132" cy="76" r="13" fill="#1d7a44"/>' +
      '<circle cx="68" cy="108" r="13" fill="#f4c430"/><circle cx="100" cy="108" r="13" fill="#1d7a44"/>' +
      '<circle cx="132" cy="108" r="13" fill="#f3f3f3" stroke="#d7d7d7" stroke-dasharray="3 2"/>' +
      '<circle cx="152" cy="124" r="13" fill="#ec7621"/>',
    'tshirts':
      '<path d="M70 24 L88 16 Q100 30 112 16 L130 24 L154 44 L140 62 L128 54 L128 134 L72 134 L72 54 L60 62 L46 44 Z" fill="#fff"/>' +
      '<path d="M88 16 Q100 30 112 16" fill="none" stroke="#e2dcec" stroke-width="2.5"/>' +
      '<circle cx="100" cy="68" r="13" fill="#ec7621"/><rect x="86" y="88" width="28" height="5" rx="2" fill="#7c5aa6"/>',
    'hoodies':
      '<path d="M76 30 Q100 2 124 30 L150 44 L160 118 L142 121 L134 78 L132 136 L68 136 L66 78 L58 121 L40 118 L50 44 Z" fill="#fff"/>' +
      '<path d="M84 32 Q100 54 116 32" fill="none" stroke="#e2dcec" stroke-width="3"/>' +
      '<path d="M96 46 L95 62 M104 46 L105 62" stroke="#d6cfe2" stroke-width="1.6"/>' +
      '<path d="M78 104 H122 L126 126 H74 Z" fill="none" stroke="#e2dcec" stroke-width="2"/>' +
      '<circle cx="100" cy="82" r="10" fill="#ec7621"/>',
    'union-flyers':
      '<rect x="72" y="18" width="76" height="120" rx="2" fill="#f0e2e2" transform="rotate(-6 110 78)"/>' +
      '<g transform="rotate(4 100 75)"><rect x="60" y="12" width="80" height="124" rx="2" fill="#fff"/>' +
      '<rect x="68" y="20" width="64" height="16" fill="#b71c1c"/><rect x="68" y="42" width="50" height="7" rx="1" fill="#0d1b3d"/>' +
      '<rect x="68" y="56" width="62" height="3" rx="1" fill="#d6d6d6"/><rect x="68" y="63" width="58" height="3" rx="1" fill="#d6d6d6"/>' +
      '<rect x="68" y="70" width="60" height="3" rx="1" fill="#d6d6d6"/><rect x="68" y="84" width="64" height="22" rx="2" fill="#f4c430"/>' +
      '<circle cx="124" cy="124" r="7.5" fill="none" stroke="#0d1b3d" stroke-width="1.5"/><circle cx="124" cy="124" r="3" fill="#0d1b3d"/>' +
      '<rect x="68" y="122" width="30" height="3" rx="1" fill="#c9c9c9"/></g>',
    'political-mailers':
      '<rect x="44" y="30" width="126" height="80" rx="3" fill="#e9d9d9" transform="rotate(6 107 70)"/>' +
      '<g transform="rotate(-5 100 78)"><rect x="34" y="38" width="132" height="86" rx="3" fill="#fff"/>' +
      '<path d="M34 41 a3 3 0 0 1 3 -3 h126 a3 3 0 0 1 3 3 v19 h-132 z" fill="#0d1b3d"/>' +
      '<rect x="44" y="45" width="62" height="8" rx="2" fill="#f4c430"/>' +
      '<rect x="46" y="72" width="18" height="18" rx="2" fill="none" stroke="#b71c1c" stroke-width="2.5"/>' +
      '<path d="M49.5 81 L54.5 86.5 L62 74" fill="none" stroke="#b71c1c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="74" y="74" width="72" height="5" rx="1.5" fill="#1d1d1d"/><rect x="74" y="84" width="60" height="3.5" rx="1.5" fill="#cfcfcf"/>' +
      '<rect x="46" y="104" width="70" height="3" rx="1" fill="#d6d6d6"/><rect x="46" y="111" width="54" height="3" rx="1" fill="#d6d6d6"/></g>',
    _default:
      '<rect x="62" y="14" width="76" height="122" rx="2" fill="#fff"/><rect x="70" y="24" width="44" height="7" rx="1.5" fill="#1d7a44"/>' +
      '<rect x="70" y="40" width="60" height="3" rx="1" fill="#d6d6d6"/><rect x="70" y="47" width="54" height="3" rx="1" fill="#d6d6d6"/>'
  };

  function paintArt(host, p) {
    if (p && p.image) {
      var img = document.createElement('img');
      img.src = p.image;
      img.alt = p.name || '';
      img.className = 'art-photo';
      host.appendChild(img);
      return;
    }
    var inner = (p && ART[p.id]) || ART._default;
    host.insertAdjacentHTML('beforeend',
      '<svg class="art-svg" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + '</svg>');
  }

  /* ---------------- product tile ---------------- */

  function tile(p) {
    var a = el('a', 'ptile');
    a.href = '/mmpuptown/shop/item/?id=' + encodeURIComponent(p.id);

    var art = el('div', 'ptile-art cat-' + p.cat);
    paintArt(art, p);
    a.appendChild(art);

    var body = el('div', 'ptile-body');
    var chip = el('span', 'rchip r-' + p.route, routeLabel(p.route));
    body.appendChild(chip);
    body.appendChild(el('h3', null, p.name));
    body.appendChild(el('p', null, p.blurb));

    var foot = el('div', 'ptile-foot');
    var unitPrice = fromPrice(p);
    if (unitPrice != null) {
      var from = el('span', 'ptile-price');
      from.innerHTML = '<small>from</small> ' + money(unitPrice) + ' <small>ea</small>';
      foot.appendChild(from);
    } else {
      foot.appendChild(el('span', 'ptile-price quoted', 'Quoted'));
    }
    foot.appendChild(el('span', 'ptile-go', '→'));
    body.appendChild(foot);

    a.appendChild(body);
    return a;
  }

  /* ---------------- page: shop index ---------------- */

  function renderShop() {
    var host = $('#shop-root');
    if (!host) return;
    renderChrome([['Home', '/mmpuptown/'], ['Shop']]);
    renderFooter();

    var active = param('category');
    var cat = active ? categoryById(active) : null;

    var head = el('div', 'section-inner');
    head.appendChild(el('div', 'section-eyebrow', 'Shop'));
    head.appendChild(el('h2', null, cat ? cat.name : 'Order print online'));
    head.appendChild(el('p', 'sub', cat ? cat.blurb :
      'Pick what you need, choose your options, and see the price as you go. Anything that needs a person looks at it says so.'));
    host.appendChild(head);

    var chips = el('div', 'section-inner cat-chips');
    var all = el('a', 'cchip' + (active ? '' : ' on'), 'Everything');
    all.href = '/mmpuptown/shop/';
    chips.appendChild(all);
    CATEGORIES.forEach(function (c) {
      var a = el('a', 'cchip' + (active === c.id ? ' on' : ''), c.name);
      a.href = '/mmpuptown/shop/?category=' + c.id;
      chips.appendChild(a);
    });
    host.appendChild(chips);

    var note = el('div', 'section-inner');
    var banner = el('div', 'seed-note');
    banner.innerHTML = '<b>Pricing is illustrative.</b> These are real products and real options, ' +
      'priced for demonstration until the shop&rsquo;s live price list is loaded.';
    note.appendChild(banner);
    host.appendChild(note);

    var grid = el('div', 'section-inner');
    var g = el('div', 'pgrid');
    PRODUCTS.filter(function (p) { return !active || p.cat === active; })
            .forEach(function (p) { g.appendChild(tile(p)); });
    grid.appendChild(g);
    host.appendChild(grid);
  }

  /* ---------------- page: product ---------------- */

  function renderItem() {
    var host = $('#item-root');
    if (!host) return;
    var p = productById(param('id'));

    if (!p) {
      renderChrome([['Home', '/mmpuptown/'], ['Shop', '/mmpuptown/shop/'], ['Not found']]);
      renderFooter();
      var miss = el('div', 'section-inner');
      miss.appendChild(el('h2', null, 'We could not find that product'));
      var back = el('a', 'btn btn-primary', 'Back to the shop');
      back.href = '/mmpuptown/shop/';
      miss.appendChild(back);
      host.appendChild(miss);
      return;
    }

    var cat = categoryById(p.cat);
    renderChrome([['Home', '/mmpuptown/'], ['Shop', '/mmpuptown/shop/'],
                  [cat.name, '/mmpuptown/shop/?category=' + cat.id], [p.name]]);
    renderFooter();
    document.title = p.name + ' — Minuteman Press Uptown';

    var wrap = el('div', 'section-inner');
    var layout = el('div', 'item-layout');

    var art = el('div', 'item-art cat-' + p.cat);
    paintArt(art, p);
    layout.appendChild(art);

    var panel = el('div', 'item-panel');
    panel.appendChild(el('span', 'rchip r-' + p.route, routeLabel(p.route)));
    panel.appendChild(el('h2', null, p.name));
    panel.appendChild(el('p', 'item-blurb', p.blurb));

    // Quoted products do not get a price or a cart.
    if (!p.tiers.length) {
      var q = el('div', 'quoted-panel');
      q.appendChild(el('p', null,
        'This one always needs a person. Tell us about the job and we will price it — usually within one business day.'));
      var qb = el('a', 'btn btn-primary btn-lg', 'Request a quote');
      qb.href = '/mmpuptown/print-store/quote/';
      q.appendChild(qb);
      panel.appendChild(q);
      layout.appendChild(panel);
      wrap.appendChild(layout);
      host.appendChild(wrap);
      return;
    }

    var chosen = {};
    (p.options || []).forEach(function (o) { chosen[o.id] = o.choices[0].value; });
    var qty = p.tiers[0].q;

    var form = el('div', 'item-config');

    var qf = el('div', 'cfg');
    qf.appendChild(el('span', 'cfg-label', 'Quantity'));
    var qrow = el('div', 'qty-row');
    p.tiers.forEach(function (t) {
      var b = el('button', 'qbtn' + (t.q === qty ? ' on' : ''), t.q.toLocaleString('en-US'));
      b.type = 'button';
      b.addEventListener('click', function () {
        qty = t.q;
        Array.prototype.forEach.call(qrow.children, function (c) { c.classList.remove('on'); });
        b.classList.add('on');
        repaint();
      });
      qrow.appendChild(b);
    });
    qf.appendChild(qrow);
    qf.appendChild(el('span', 'cfg-hint', p.unit));
    form.appendChild(qf);

    (p.options || []).forEach(function (opt) {
      var c = el('div', 'cfg');
      c.appendChild(el('span', 'cfg-label', opt.label));
      var sel = el('select', 'cfg-select');
      opt.choices.forEach(function (ch) {
        var o = el('option', null, ch.label);
        o.value = ch.value;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { chosen[opt.id] = sel.value; repaint(); });
      c.appendChild(sel);
      form.appendChild(c);
    });

    panel.appendChild(form);

    var priceBox = el('div', 'price-box');
    var priceMain = el('div', 'price-main');
    var priceEach = el('div', 'price-each');
    priceBox.appendChild(priceMain);
    priceBox.appendChild(priceEach);
    panel.appendChild(priceBox);

    var actions = el('div', 'item-actions');
    var add = el('button', 'btn btn-primary btn-lg', 'Add to cart');
    add.type = 'button';
    var added = el('span', 'added-note');
    added.hidden = true;
    actions.appendChild(add);
    actions.appendChild(added);
    panel.appendChild(actions);

    var upload = el('p', 'item-foot');
    upload.textContent = 'You will attach your artwork at checkout. No file ready? We can design it — just say so in the notes.';
    panel.appendChild(upload);

    function repaint() {
      var total = priceFor(p, qty, chosen);
      priceMain.textContent = money(total);
      priceEach.textContent = money(total / qty) + ' each · ' + qty.toLocaleString('en-US') + ' ' + p.unit;
    }
    repaint();

    add.addEventListener('click', function () {
      var total = priceFor(p, qty, chosen);
      var spec = (p.options || []).map(function (o) {
        var lbl = '';
        o.choices.forEach(function (c) { if (c.value === chosen[o.id]) lbl = c.label; });
        return o.label + ': ' + lbl;
      });
      var items = readCart();
      items.push({
        id: p.id, name: p.name, qty: qty, unit: p.unit,
        route: p.route, spec: spec, price: total
      });
      writeCart(items);
      added.hidden = false;
      added.textContent = 'Added — ' + money(total);
      add.textContent = 'Add another';
    });

    layout.appendChild(panel);
    wrap.appendChild(layout);
    host.appendChild(wrap);
  }

  /* ---------------- page: cart ---------------- */

  function renderCart() {
    var host = $('#cart-root');
    if (!host) return;
    renderChrome([['Home', '/mmpuptown/'], ['Shop', '/mmpuptown/shop/'], ['Cart']]);
    renderFooter();

    var wrap = el('div', 'section-inner');
    wrap.appendChild(el('div', 'section-eyebrow', 'Your cart'));
    wrap.appendChild(el('h2', null, 'Ready when you are'));

    var items = readCart();

    if (!items.length) {
      var empty = el('div', 'empty-cart');
      empty.appendChild(el('p', null, 'Nothing in the cart yet.'));
      var go = el('a', 'btn btn-primary', 'Browse the shop');
      go.href = '/mmpuptown/shop/';
      empty.appendChild(go);
      wrap.appendChild(empty);
      host.appendChild(wrap);
      return;
    }

    var layout = el('div', 'cart-layout');
    var list = el('div', 'cart-list');

    items.forEach(function (it, i) {
      var row = el('div', 'crow');
      var prod = productById(it.id) || { id: it.id, name: it.name };
      var art = el('div', 'crow-art cat-' + prod.cat);
      paintArt(art, prod);
      row.appendChild(art);

      var mid = el('div', 'crow-mid');
      mid.appendChild(el('h3', null, it.name));
      mid.appendChild(el('span', 'crow-qty', it.qty.toLocaleString('en-US') + ' ' + it.unit));
      if (it.spec && it.spec.length) {
        var sp = el('ul', 'crow-spec');
        it.spec.forEach(function (s) { sp.appendChild(el('li', null, s)); });
        mid.appendChild(sp);
      }
      row.appendChild(mid);

      var right = el('div', 'crow-right');
      right.appendChild(el('span', 'crow-price', money(it.price)));
      var rm = el('button', 'crow-remove', 'Remove');
      rm.type = 'button';
      rm.addEventListener('click', function () {
        var cur = readCart();
        cur.splice(i, 1);
        writeCart(cur);
        window.location.reload();
      });
      right.appendChild(rm);
      row.appendChild(right);

      list.appendChild(row);
    });
    layout.appendChild(list);

    var side = el('div', 'cart-side');
    var sum = el('div', 'cart-sum');
    sum.appendChild(el('h4', null, 'Summary'));
    var line = el('div', 'sum-line');
    line.appendChild(el('span', null, 'Subtotal'));
    line.appendChild(el('b', null, money(cartTotal())));
    sum.appendChild(line);
    var tax = el('div', 'sum-line muted');
    tax.appendChild(el('span', null, 'Tax and shipping'));
    tax.appendChild(el('b', null, 'Confirmed on your order'));
    sum.appendChild(tax);
    sum.appendChild(el('p', 'sum-note',
      'Submitting sends this to the shop as one order. Nothing is charged here — we confirm the total and the proof before anything is produced.'));
    side.appendChild(sum);
    layout.appendChild(side);

    wrap.appendChild(layout);

    /* checkout */
    var co = el('div', 'checkout');
    co.appendChild(el('h3', null, 'Where should we send the confirmation?'));

    var f = el('form', 'form-card');
    f.id = 'checkout-form';
    f.noValidate = true;
    f.innerHTML =
      '<div class="form-alert error" id="co-error" hidden></div>' +
      '<div class="field-row">' +
        '<div class="field"><label for="c-name">Your name <span class="req">*</span></label>' +
        '<input type="text" id="c-name" name="contact_name" required autocomplete="name"></div>' +
        '<div class="field"><label for="c-company">Company <span class="optional">optional</span></label>' +
        '<input type="text" id="c-company" name="company" autocomplete="organization"></div>' +
      '</div>' +
      '<div class="field-row">' +
        '<div class="field"><label for="c-email">Email <span class="req">*</span></label>' +
        '<input type="email" id="c-email" name="email" required autocomplete="email"></div>' +
        '<div class="field"><label for="c-phone">Phone <span class="optional">optional</span></label>' +
        '<input type="tel" id="c-phone" name="phone" autocomplete="tel"></div>' +
      '</div>' +
      '<div class="field"><label for="c-notes">Notes for the shop <span class="optional">optional</span></label>' +
      '<textarea id="c-notes" name="notes" placeholder="Deadlines, artwork questions, anything we should know."></textarea></div>' +
      '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary btn-lg" id="co-submit">Send this order</button>' +
      '<span class="fa-note">No card is charged here.</span></div>';

    co.appendChild(f);
    wrap.appendChild(co);
    host.appendChild(wrap);

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var errBox = $('#co-error');
      errBox.hidden = true;
      f.classList.add('validated');
      if (!f.checkValidity()) {
        var bad = f.querySelector(':invalid');
        if (bad) bad.focus();
        errBox.textContent = 'We need a name and an email to send the confirmation to.';
        errBox.hidden = false;
        return;
      }
      var btn = $('#co-submit');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      var cart = readCart();
      var lines = cart.map(function (it) {
        return it.name + ' × ' + it.qty + ' ' + it.unit +
               (it.spec && it.spec.length ? ' (' + it.spec.join(', ') + ')' : '') +
               ' — ' + money(it.price);
      }).join('\n');

      var payload = {
        contact_name: $('#c-name').value.trim(),
        company: $('#c-company').value.trim() || null,
        email: $('#c-email').value.trim(),
        phone: $('#c-phone').value.trim() || null,
        job_type: 'Online order (' + cart.length + ' item' + (cart.length === 1 ? '' : 's') + ')',
        quantity: String(cart.reduce(function (n, it) { return n + it.qty; }, 0)),
        turnaround: 'Standard',
        notes: 'ONLINE ORDER — subtotal ' + money(cartTotal()) + '\n\n' + lines +
               ($('#c-notes').value.trim() ? '\n\nCustomer notes:\n' + $('#c-notes').value.trim() : ''),
        page_source: window.location.pathname
      };

      fetch(SUPABASE_URL + '/rest/v1/rpc/mmp_submit_quote', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payload: payload })
      }).then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error(t || res.status); });
        return res.json();
      }).then(function (ref) {
        writeCart([]);
        host.innerHTML = '';
        var done = el('div', 'section-inner');
        var card = el('div', 'form-card form-success');
        card.appendChild(el('div', 'fs-mark', '✓'));
        card.appendChild(el('h3', null, 'Order received — thank you.'));
        card.appendChild(el('p', null,
          'It is in front of a real person now. We will confirm the total and send a proof before anything goes on press.'));
        var badge = el('div', 'fs-ref', 'Reference ' + ref);
        card.appendChild(badge);
        done.appendChild(card);
        host.appendChild(done);
        renderChrome([['Home', '/mmpuptown/'], ['Shop', '/mmpuptown/shop/'], ['Order sent']]);
        renderFooter();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }).catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Send this order';
        errBox.textContent = 'We could not send that just now. Nothing was lost — try again, or call 612-870-0777. (' +
          String(err.message || err).slice(0, 140) + ')';
        errBox.hidden = false;
      });
    });
  }

  /* ---------------- boot ---------------- */

  function boot() {
    renderShop();
    renderItem();
    renderCart();
    paintCount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.MMPShop = { PRODUCTS: PRODUCTS, CATEGORIES: CATEGORIES, priceFor: priceFor };
})();
