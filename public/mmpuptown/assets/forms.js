/* ==================================================================
   MMP FORMS — capture for quote / order / send-files.

   Submits through a Supabase RPC (mmp_submit_quote), not a table write.
   That is deliberate: the RPC is SECURITY DEFINER, so the public form
   needs no read or write grant on mmp_quotes at all. Nobody can list
   other people's submissions with the anon key.

   Files go to the mmp-uploads storage bucket first; their paths ride
   along in the payload.

   Requires: a <form> with an id, [data-mmp-form] handled below.
   ================================================================== */
(function () {
  'use strict';

  // Same project as the inline editor — see editor.js. Publishable (anon)
  // key; access is governed by RLS and the RPC, not by hiding this.
  var SUPABASE_URL = 'https://qcikhcnclduakriextsz.supabase.co';
  var SUPABASE_ANON = 'sb_publishable_GifRjDSjTWuHSiN-y7b7ZQ_AFOMvkkh';
  var UPLOAD_BUCKET = 'mmp-uploads';
  var MAX_BYTES = 25 * 1024 * 1024;

  var form = document.getElementById('quote-form');
  if (!form) return;

  var errorBox = document.getElementById('form-error');
  var submitBtn = document.getElementById('submit-btn');
  var drop = document.getElementById('file-drop');
  var fileInput = document.getElementById('file-input');
  var fileList = document.getElementById('file-list');
  var picked = [];

  function humanSize(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function clearError() {
    if (errorBox) errorBox.hidden = true;
  }

  /* ---------- file picking ---------- */

  function renderFiles() {
    if (!fileList) return;
    fileList.innerHTML = '';
    picked.forEach(function (file, i) {
      var li = document.createElement('li');

      var name = document.createElement('span');
      name.className = 'fl-name';
      name.textContent = file.name;

      var size = document.createElement('span');
      size.className = 'fl-size';
      size.textContent = humanSize(file.size);

      var kill = document.createElement('button');
      kill.type = 'button';
      kill.setAttribute('aria-label', 'Remove ' + file.name);
      kill.textContent = '×';
      kill.addEventListener('click', function () {
        picked.splice(i, 1);
        renderFiles();
      });

      li.appendChild(name);
      li.appendChild(size);
      li.appendChild(kill);
      fileList.appendChild(li);
    });
  }

  function addFiles(list) {
    var rejected = [];
    Array.prototype.forEach.call(list, function (file) {
      if (file.size > MAX_BYTES) { rejected.push(file.name); return; }
      var dupe = picked.some(function (p) {
        return p.name === file.name && p.size === file.size;
      });
      if (!dupe) picked.push(file);
    });
    if (rejected.length) {
      showError('These files are over the 25 MB limit and were not attached: ' +
        rejected.join(', ') + '. Send them to mpls@minutemanpress.com and we will match them to your request.');
    }
    renderFiles();
  }

  if (drop && fileInput) {
    drop.addEventListener('click', function () { fileInput.click(); });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener('change', function () {
      addFiles(fileInput.files);
      fileInput.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (evt) {
      drop.addEventListener(evt, function (e) {
        e.preventDefault(); drop.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      drop.addEventListener(evt, function (e) {
        e.preventDefault(); drop.classList.remove('dragover');
      });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  }

  /* ---------- upload ---------- */

  function safeName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  }

  function uploadOne(file, folder) {
    var path = folder + '/' + Date.now() + '-' + safeName(file.name);
    return fetch(SUPABASE_URL + '/storage/v1/object/' + UPLOAD_BUCKET + '/' + path, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'false'
      },
      body: file
    }).then(function (res) {
      if (!res.ok) throw new Error('upload failed for ' + file.name);
      return { path: path, name: file.name, size: file.size, type: file.type || null };
    });
  }

  /* ---------- submit ---------- */

  function collect() {
    var data = {};
    Array.prototype.forEach.call(
      form.querySelectorAll('input[name], select[name], textarea[name]'),
      function (el) {
        if (el.type === 'checkbox') { data[el.name] = el.checked; return; }
        var v = (el.value || '').trim();
        data[el.name] = v === '' ? null : v;
      }
    );
    data.page_source = window.location.pathname;
    return data;
  }

  function succeed(ref) {
    var card = document.createElement('div');
    card.className = 'form-card form-success';

    var mark = document.createElement('div');
    mark.className = 'fs-mark';
    mark.textContent = '✓';

    var h = document.createElement('h3');
    h.textContent = 'Got it — thank you.';

    var p1 = document.createElement('p');
    p1.textContent = 'Your request is in front of a real person. We usually come back with a quote within one business day, and we will call if anything needs clarifying.';

    var p2 = document.createElement('p');
    p2.textContent = 'In a hurry? Call the shop at 612-870-0777 and mention your reference.';

    card.appendChild(mark);
    card.appendChild(h);
    card.appendChild(p1);
    card.appendChild(p2);

    if (ref) {
      var badge = document.createElement('div');
      badge.className = 'fs-ref';
      badge.textContent = 'Reference ' + ref;
      card.appendChild(badge);
    }

    form.parentNode.replaceChild(card, form);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();
    form.classList.add('validated');

    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      if (bad) { bad.focus(); bad.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      showError('A few required fields still need filling in — they are outlined below.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = picked.length ? 'Uploading…' : 'Sending…';

    var folder = 'quotes/' + (Date.now() + '-' + Math.random().toString(36).slice(2, 8));

    Promise.all(picked.map(function (f) { return uploadOne(f, folder); }))
      .then(function (uploaded) {
        var payload = collect();
        payload.files = uploaded;
        submitBtn.textContent = 'Sending…';
        return fetch(SUPABASE_URL + '/rest/v1/rpc/mmp_submit_quote', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': 'Bearer ' + SUPABASE_ANON,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ payload: payload })
        });
      })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) { throw new Error(t || ('HTTP ' + res.status)); });
        }
        return res.json();
      })
      .then(function (ref) { succeed(ref); })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send my quote request';
        showError('Something went wrong sending your request. Nothing was lost — ' +
          'try again, or call us at 612-870-0777 and we will take it over the phone. (' +
          (err && err.message ? String(err.message).slice(0, 160) : 'unknown error') + ')');
      });
  });
})();
