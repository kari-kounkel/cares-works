/* ==================================================================
   MMP INLINE EDITOR — Christine's click-to-edit tool.
   Reads/writes public.mmp_content in the cares-works Supabase.
   Add to any page with a <body data-page-slug="home"> attribute.
   Every editable block needs data-block-id="something-unique".

   Edit mode: append ?edit=christine to the URL.
   Preview toggle in the edit bar shows the live-visitor view.
   .ck-image-slot[data-block-id] blocks upload to Storage on click.
   ================================================================== */
(function () {
  var SUPABASE_URL = 'https://qcikhcnclduakriextsz.supabase.co';
  var SUPABASE_ANON = 'sb_publishable_GifRjDSjTWuHSiN-y7b7ZQ_AFOMvkkh';
  var STORAGE_BUCKET = 'mmp-content';
  var EDIT_TOKEN = 'christine';

  var pageSlug = document.body.getAttribute('data-page-slug');
  if (!pageSlug) return;

  var params = new URLSearchParams(location.search);
  var editRequested = params.get('edit') === EDIT_TOKEN;

  // Sticky edit mode: keep ?edit=christine on every internal link so
  // she stays in edit mode while clicking around. One bookmark works
  // for every page on both sites.
  if (editRequested) {
    var addToken = function () {
      Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function (a) {
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
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

  function uploadImage(file) {
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var stamp = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    var path = pageSlug + '/' + stamp + '.' + ext;
    return fetch(SUPABASE_URL + '/storage/v1/object/' + STORAGE_BUCKET + '/' + path, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: file
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Upload ' + r.status + ': ' + t); });
      return SUPABASE_URL + '/storage/v1/object/public/' + STORAGE_BUCKET + '/' + path;
    });
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
    var style = document.createElement('style');
    style.textContent =
      /* text-editable outlines */
      '[data-block-id]:not(.ck-image-slot){outline:2px dashed rgba(29,122,68,0.35);outline-offset:4px;transition:outline-color 0.15s;border-radius:3px;}' +
      '[data-block-id]:not(.ck-image-slot):hover{outline-color:#1d7a44;outline-style:solid;}' +
      '[data-block-id]:not(.ck-image-slot):focus{outline:3px solid #ec7621;outline-offset:4px;background:rgba(255,249,219,0.4);}' +
      /* image-slot upload state */
      '.ck-image-slot[data-block-id]{cursor:pointer;position:relative;outline:3px dashed #ec7621;outline-offset:2px;transition:outline-color 0.15s;overflow:hidden;}' +
      '.ck-image-slot[data-block-id]:hover{outline-color:#1d7a44;outline-style:solid;}' +
      '.ck-image-slot[data-block-id].has-image{outline-style:solid;}' +
      '.ck-image-slot[data-block-id] .ck-img-hint{position:absolute;top:6px;right:6px;background:#1d7a44;color:white;font-size:10px;font-weight:800;padding:4px 8px;border-radius:3px;letter-spacing:0.06em;text-transform:uppercase;z-index:2;pointer-events:none;}' +
      '.ck-image-slot[data-block-id] img{width:100%;height:100%;object-fit:cover;display:block;}' +
      /* brand-logo slot — different sizing rules (contain, not cover) */
      '.ck-image-slot.brand-logo{overflow:visible;min-width:230px;max-width:400px;min-height:70px;padding:6px;}' +
      '.ck-image-slot.brand-logo svg{width:100%;height:auto;max-height:80px;display:block;}' +
      '.ck-image-slot.brand-logo img{width:auto !important;max-width:400px;max-height:110px;height:auto !important;object-fit:contain !important;}' +
      /* edit bar */
      '.mmp-edit-bar{position:fixed;bottom:0;left:0;right:0;background:#1a1a1a;color:white;' +
      'padding:14px 24px;display:flex;align-items:center;gap:12px;z-index:99998;' +
      'font-family:"Open Sans",sans-serif;font-size:13px;box-shadow:0 -4px 20px rgba(0,0,0,0.25);}' +
      '.mmp-edit-bar .status{flex:1;letter-spacing:0.02em;}' +
      '.mmp-edit-bar .status b{color:#f4c430;}' +
      '.mmp-edit-bar button{font-family:inherit;font-size:12px;font-weight:800;letter-spacing:0.06em;' +
      'text-transform:uppercase;padding:12px 18px;border:none;border-radius:4px;cursor:pointer;' +
      'transition:opacity 0.15s;}' +
      '.mmp-edit-bar button:disabled{opacity:0.4;cursor:not-allowed;}' +
      '.mmp-edit-bar .btn-preview{background:transparent;color:#f4c430;border:1px solid #f4c430;}' +
      '.mmp-edit-bar .btn-cancel{background:transparent;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.25);}' +
      '.mmp-edit-bar .btn-save{background:#ec7621;color:white;}' +
      '.mmp-edit-bar .btn-save:hover:not(:disabled){background:#c75e15;}' +
      'body.mmp-edit-mode{padding-bottom:64px;}' +
      /* preview: hide editor UI + placeholder markers so she sees the live site */
      'body.mmp-preview .mmp-edit-bar{transform:translateY(100%);transition:transform 0.3s;}' +
      'body.mmp-preview .mmp-preview-exit{transform:translateY(0);}' +
      'body.mmp-preview [data-block-id]{outline:none !important;background:transparent !important;}' +
      'body.mmp-preview .ck-image-slot[data-block-id] .ck-img-hint{display:none;}' +
      'body.mmp-preview .ck-note,body.mmp-preview .ck-todo{display:none !important;}' +
      /* preview exit button (hidden when not previewing) */
      '.mmp-preview-exit{position:fixed;top:16px;right:16px;background:#1a1a1a;color:#f4c430;border:2px solid #f4c430;' +
      'padding:10px 18px;border-radius:6px;font-family:"Open Sans",sans-serif;font-size:12px;font-weight:800;' +
      'letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;z-index:99999;box-shadow:0 6px 18px rgba(0,0,0,0.3);' +
      'display:none;}' +
      'body.mmp-preview .mmp-preview-exit{display:block;}';
    document.head.appendChild(style);
    document.body.classList.add('mmp-edit-mode');

    // wire each block for its type
    blocks.forEach(function (el) {
      if (el.classList.contains('ck-image-slot')) {
        wireImageSlot(el);
      } else {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'true');
        el.addEventListener('input', updateStatus);
      }
    });

    // Kill link navigation on any <a> that IS or CONTAINS an editable block —
    // otherwise clicking the text/photo/button inside just navigates away.
    // Preview mode restores navigation so she can click through as a visitor.
    Array.prototype.slice.call(document.querySelectorAll('a')).forEach(function (a) {
      if (!a.matches('[data-block-id]') && !a.querySelector('[data-block-id]')) return;
      a.addEventListener('click', function (e) {
        if (document.body.classList.contains('mmp-preview')) return;
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // edit bar
    var bar = document.createElement('div');
    bar.className = 'mmp-edit-bar';
    bar.innerHTML =
      '<span class="status"><b>EDIT MODE</b> · <span id="mmp-count">0 of ' + blocks.length + ' edited</span> · <span style="opacity:0.6;">Click text to type. Click grey boxes to upload photos.</span></span>' +
      '<button class="btn-preview" id="mmp-preview">👁 Preview</button>' +
      '<button class="btn-cancel" id="mmp-cancel">Discard</button>' +
      '<button class="btn-save" id="mmp-save" disabled>Save &amp; Publish</button>';
    document.body.appendChild(bar);

    // preview-exit floating button
    var exit = document.createElement('button');
    exit.className = 'mmp-preview-exit';
    exit.textContent = '← Back to Edit';
    exit.addEventListener('click', exitPreview);
    document.body.appendChild(exit);

    document.getElementById('mmp-cancel').addEventListener('click', discard);
    document.getElementById('mmp-save').addEventListener('click', save);
    document.getElementById('mmp-preview').addEventListener('click', enterPreview);

    updateStatus();
  }

  // ----- IMAGE SLOTS -----
  function wireImageSlot(el) {
    // if the loaded content is already an <img>, mark it as such
    if (el.querySelector('img')) el.classList.add('has-image');

    // hint badge
    var hint = document.createElement('span');
    hint.className = 'ck-img-hint';
    hint.textContent = el.classList.contains('has-image') ? '📷 Replace' : '📷 Upload';
    el.appendChild(hint);

    el.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') return;
      var picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.style.display = 'none';
      picker.addEventListener('change', function () {
        var file = picker.files && picker.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast('Image too big — 10MB max.', 'error'); return; }
        hint.textContent = '⏳ Uploading…';
        uploadImage(file).then(function (url) {
          el.innerHTML = '<img src="' + url + '" alt="">';
          el.classList.add('has-image');
          var newHint = document.createElement('span');
          newHint.className = 'ck-img-hint';
          newHint.textContent = '📷 Replace';
          el.appendChild(newHint);
          updateStatus();
          toast('Uploaded — hit Save & Publish.');
        }).catch(function (err) {
          console.error('[mmp-editor] upload failed', err);
          hint.textContent = '📷 Upload';
          toast('Upload failed — ' + err.message, 'error');
        });
      });
      document.body.appendChild(picker);
      picker.click();
      setTimeout(function () { picker.remove(); }, 500);
    });
  }

  // ----- PREVIEW -----
  function enterPreview() {
    document.body.classList.add('mmp-preview');
    // freeze text edits while previewing so she can't accidentally type
    blocks.forEach(function (el) {
      if (el.getAttribute('contenteditable') === 'true') {
        el.setAttribute('data-was-editable', '1');
        el.setAttribute('contenteditable', 'false');
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function exitPreview() {
    document.body.classList.remove('mmp-preview');
    blocks.forEach(function (el) {
      if (el.getAttribute('data-was-editable') === '1') {
        el.setAttribute('contenteditable', 'true');
        el.removeAttribute('data-was-editable');
      }
    });
  }

  function updateStatus() {
    var dirty = blocks.filter(function (el) {
      return currentContent(el) !== el.getAttribute('data-original');
    });
    var count = document.getElementById('mmp-count');
    var saveBtn = document.getElementById('mmp-save');
    if (count) count.textContent = dirty.length + ' of ' + blocks.length + ' edited';
    if (saveBtn) saveBtn.disabled = dirty.length === 0;
  }

  // strip the editor-only .ck-img-hint span when comparing/saving
  function currentContent(el) {
    if (!el.classList.contains('ck-image-slot')) return el.innerHTML;
    var clone = el.cloneNode(true);
    Array.prototype.slice.call(clone.querySelectorAll('.ck-img-hint')).forEach(function (h) { h.remove(); });
    return clone.innerHTML;
  }

  function discard() {
    var dirty = blocks.filter(function (el) {
      return currentContent(el) !== el.getAttribute('data-original');
    });
    if (dirty.length && !confirm('Discard ' + dirty.length + ' unsaved change(s)?')) return;
    blocks.forEach(function (el) {
      el.innerHTML = el.getAttribute('data-original');
      if (el.classList.contains('ck-image-slot')) wireImageSlot(el);
    });
    updateStatus();
    toast('Changes discarded');
  }

  function save() {
    var saveBtn = document.getElementById('mmp-save');
    if (!saveBtn || saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    var dirty = blocks.filter(function (el) {
      return currentContent(el) !== el.getAttribute('data-original');
    });

    var payload = dirty.map(function (el) {
      return {
        page_slug: pageSlug,
        block_id: el.getAttribute('data-block-id'),
        content: currentContent(el),
        updated_at: new Date().toISOString(),
        updated_by: 'christine'
      };
    });

    // on_conflict tells PostgREST which unique index to merge on;
    // without it the whole upsert 409s the moment any row already exists.
    api('mmp_content?on_conflict=page_slug%2Cblock_id', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (r.ok) return null;
        return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ' — ' + (t || 'no body')); });
      })
      .then(function () {
        dirty.forEach(function (el) { el.setAttribute('data-original', currentContent(el)); });
        updateStatus();
        saveBtn.textContent = 'Save & Publish';
        toast('Saved & published — ' + payload.length + ' block' + (payload.length === 1 ? '' : 's'));
      })
      .catch(function (e) {
        console.error('[mmp-editor] save failed', e);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Publish';
        toast('Save failed — ' + e.message, 'error');
      });
  }
})();
