/* ==================================================================
   MMP INLINE EDITOR — Christine's click-to-edit tool.
   Reads/writes public.mmp_content in the cares-works Supabase.
   Add to any page with a <body data-page-slug="home"> attribute.
   Every editable block needs data-block-id="something-unique".

   Edit mode: append ?edit=christine to the URL.
   Anyone with the URL + token can edit — no login. URL secret is the
   whole gate for the placeholder-content phase. Real auth comes with
   Phase 1 build.
   ================================================================== */
(function () {
  var SUPABASE_URL = 'https://qcikhcnclduakriextsz.supabase.co';
  var SUPABASE_ANON = 'sb_publishable_GifRjDSjTWuHSiN-y7b7ZQ_AFOMvkkh';
  var EDIT_TOKEN = 'christine';

  var pageSlug = document.body.getAttribute('data-page-slug');
  if (!pageSlug) return;

  var params = new URLSearchParams(location.search);
  var editRequested = params.get('edit') === EDIT_TOKEN;

  // Sticky edit mode: if the token is in the URL now, keep it in every
  // internal link on the page so she never falls out of edit mode
  // while clicking around the site. One bookmark, all pages.
  if (editRequested) {
    var addToken = function () {
      Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function (a) {
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        // internal only — same origin, path-based hrefs
        var isInternal = href.charAt(0) === '/' || (href.indexOf('://') === -1 && href.indexOf('mailto:') !== 0 && href.indexOf('tel:') !== 0);
        if (!isInternal) return;
        if (href.indexOf('edit=' + EDIT_TOKEN) !== -1) return;
        a.setAttribute('href', href + (href.indexOf('?') === -1 ? '?' : '&') + 'edit=' + EDIT_TOKEN);
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addToken);
    } else {
      addToken();
    }
  }

  // ----- helpers -----
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + SUPABASE_ANON,
      'Content-Type': 'application/json'
    }, opts.headers || {});
    return fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  }

  function toast(msg, kind) {
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);' +
      'background:' + (kind === 'error' ? '#b71c1c' : '#1d7a44') + ';color:white;' +
      'padding:12px 22px;border-radius:6px;font-family:"Open Sans",sans-serif;' +
      'font-size:14px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,0.25);z-index:99999;' +
      'letter-spacing:0.03em;';
    document.body.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity 0.3s'; el.style.opacity = '0'; }, 2200);
    setTimeout(function () { el.remove(); }, 2600);
  }

  // ----- 1. LOAD saved content and inject into blocks -----
  var blocks = Array.prototype.slice.call(document.querySelectorAll('[data-block-id]'));
  if (!blocks.length) return;

  api('mmp_content?page_slug=eq.' + encodeURIComponent(pageSlug) + '&select=block_id,content')
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var byId = {};
      rows.forEach(function (row) { byId[row.block_id] = row.content; });
      blocks.forEach(function (el) {
        var id = el.getAttribute('data-block-id');
        if (byId[id] != null && byId[id] !== '') el.innerHTML = byId[id];
        el.setAttribute('data-original', el.innerHTML);
      });
      if (editRequested) enableEditMode();
    })
    .catch(function (e) {
      console.error('[mmp-editor] load failed', e);
      blocks.forEach(function (el) { el.setAttribute('data-original', el.innerHTML); });
      if (editRequested) enableEditMode();
    });

  // ----- 2. EDIT MODE -----
  function enableEditMode() {
    // style tag with edit-mode CSS
    var style = document.createElement('style');
    style.textContent =
      '[data-block-id]{outline:2px dashed rgba(29,122,68,0.35);outline-offset:4px;transition:outline-color 0.15s;border-radius:3px;}' +
      '[data-block-id]:hover{outline-color:#1d7a44;outline-style:solid;}' +
      '[data-block-id]:focus{outline:3px solid #ec7621;outline-offset:4px;background:rgba(255,249,219,0.4);}' +
      '.mmp-edit-bar{position:fixed;bottom:0;left:0;right:0;background:#1a1a1a;color:white;' +
      'padding:14px 24px;display:flex;align-items:center;gap:16px;z-index:99998;' +
      'font-family:"Open Sans",sans-serif;font-size:13px;box-shadow:0 -4px 20px rgba(0,0,0,0.25);}' +
      '.mmp-edit-bar .status{flex:1;letter-spacing:0.02em;}' +
      '.mmp-edit-bar .status b{color:#f4c430;}' +
      '.mmp-edit-bar button{font-family:inherit;font-size:12px;font-weight:800;letter-spacing:0.06em;' +
      'text-transform:uppercase;padding:12px 22px;border:none;border-radius:4px;cursor:pointer;' +
      'transition:opacity 0.15s;}' +
      '.mmp-edit-bar button:disabled{opacity:0.4;cursor:not-allowed;}' +
      '.mmp-edit-bar .btn-cancel{background:transparent;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.25);}' +
      '.mmp-edit-bar .btn-save{background:#ec7621;color:white;}' +
      '.mmp-edit-bar .btn-save:hover:not(:disabled){background:#c75e15;}' +
      'body.mmp-edit-mode{padding-bottom:64px;}';
    document.head.appendChild(style);
    document.body.classList.add('mmp-edit-mode');

    // make blocks editable
    blocks.forEach(function (el) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');
      el.addEventListener('input', updateStatus);
    });

    // edit bar
    var bar = document.createElement('div');
    bar.className = 'mmp-edit-bar';
    bar.innerHTML =
      '<span class="status"><b>EDIT MODE</b> · <span id="mmp-count">0 of ' + blocks.length + ' edited</span> · <span style="opacity:0.6;">Click any yellow-outlined block, type, then hit Save.</span></span>' +
      '<button class="btn-cancel" id="mmp-cancel">Discard</button>' +
      '<button class="btn-save" id="mmp-save" disabled>Save &amp; Publish</button>';
    document.body.appendChild(bar);

    document.getElementById('mmp-cancel').addEventListener('click', discard);
    document.getElementById('mmp-save').addEventListener('click', save);

    updateStatus();
  }

  function updateStatus() {
    var dirty = blocks.filter(function (el) {
      return el.innerHTML !== el.getAttribute('data-original');
    });
    var count = document.getElementById('mmp-count');
    var saveBtn = document.getElementById('mmp-save');
    if (count) count.textContent = dirty.length + ' of ' + blocks.length + ' edited';
    if (saveBtn) saveBtn.disabled = dirty.length === 0;
  }

  function discard() {
    var dirty = blocks.filter(function (el) {
      return el.innerHTML !== el.getAttribute('data-original');
    });
    if (dirty.length && !confirm('Discard ' + dirty.length + ' unsaved change(s)?')) return;
    blocks.forEach(function (el) { el.innerHTML = el.getAttribute('data-original'); });
    updateStatus();
    toast('Changes discarded');
  }

  function save() {
    var saveBtn = document.getElementById('mmp-save');
    if (!saveBtn || saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    var dirty = blocks.filter(function (el) {
      return el.innerHTML !== el.getAttribute('data-original');
    });

    var payload = dirty.map(function (el) {
      return {
        page_slug: pageSlug,
        block_id: el.getAttribute('data-block-id'),
        content: el.innerHTML,
        updated_at: new Date().toISOString(),
        updated_by: 'christine'
      };
    });

    api('mmp_content', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        dirty.forEach(function (el) { el.setAttribute('data-original', el.innerHTML); });
        updateStatus();
        saveBtn.textContent = 'Save & Publish';
        toast('Saved & published — ' + payload.length + ' block' + (payload.length === 1 ? '' : 's'));
      })
      .catch(function (e) {
        console.error('[mmp-editor] save failed', e);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Publish';
        toast('Save failed — ' + e.message + '. Check console.', 'error');
      });
  }
})();
