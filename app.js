/* ═══════════════════════════════════════════════════════════════
   APIDash — app.js
   REST API Tester · Core Logic
   ═══════════════════════════════════════════════════════════════ */

// ── STATE ──────────────────────────────────────────────────────────────
let bodyType = 'json';
let history = [];
let rawResponseText = '';
let responseHeaders = {};
let currentRespTab = 'pretty';
let toastTimer = null;

// ── INIT ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  addRow('params');
  addRow('headers', 'Content-Type', 'application/json');
  initResizer();
});

// ── KEY-VALUE ROW MANAGEMENT ───────────────────────────────────────────

/**
 * Append a new key-value row to a table.
 * @param {string} tableId  - 'params' or 'headers'
 * @param {string} key      - Pre-fill key input
 * @param {string} value    - Pre-fill value input
 * @param {boolean} checked - Whether the row checkbox is checked
 */
function addRow(tableId, key = '', value = '', checked = true) {
  const table = document.getElementById(tableId + '-table');
  const row = document.createElement('div');
  row.className = 'kv-row';
  row.innerHTML = `
    <input type="checkbox" class="kv-check" ${checked ? 'checked' : ''} onchange="updateURL()">
    <input type="text" class="kv-input" placeholder="${tableId === 'params' ? 'param' : 'header'}"
           value="${escHtml(key)}" oninput="updateURL()">
    <input type="text" class="kv-input" placeholder="value"
           value="${escHtml(value)}" oninput="updateURL()">
    <button class="kv-delete" onclick="this.closest('.kv-row').remove(); updateURL()">×</button>
  `;
  table.appendChild(row);
}

/**
 * Collect all enabled rows from a kv table.
 * @param {string} tableId - 'params' or 'headers'
 * @returns {{ key: string, value: string, enabled: boolean }[]}
 */
function getRows(tableId) {
  const rows = document.querySelectorAll(`#${tableId}-table .kv-row`);
  const result = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('.kv-input');
    const check = row.querySelector('.kv-check');
    if (inputs[0].value.trim()) {
      result.push({
        key: inputs[0].value.trim(),
        value: inputs[1].value,
        enabled: check.checked
      });
    }
  });
  return result;
}

/**
 * Sync enabled query params into the URL input field.
 */
function updateURL() {
  const params = getRows('params').filter(p => p.enabled);
  if (params.length === 0) return;
  try {
    const url = new URL(document.getElementById('url-input').value);
    url.search = '';
    params.forEach(p => url.searchParams.append(p.key, p.value));
    document.getElementById('url-input').value = url.toString();
  } catch (_) {
    // Invalid URL — skip silently
  }
}

// ── TAB SWITCHING ──────────────────────────────────────────────────────

/**
 * Switch the active request tab (Params / Headers / Body / Auth).
 * @param {string} id  - Tab panel suffix id
 * @param {Element} el - The clicked tab element
 */
function switchTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
}

/**
 * Switch the active response view tab (Pretty / Raw / Headers).
 * @param {string} id  - Panel suffix id
 * @param {Element} el - The clicked tab element
 */
function switchRespTab(id, el) {
  document.querySelectorAll('.resp-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.resp-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + id).classList.add('active');
  currentRespTab = id;
}

// ── METHOD COLOR ───────────────────────────────────────────────────────

/**
 * Update the method select element's color class to match the chosen method.
 */
function updateMethodColor() {
  const sel = document.getElementById('method-select');
  sel.className = 'method-select method-' + sel.value;
}

// ── BODY EDITOR ────────────────────────────────────────────────────────

/**
 * Set the active body content type and update placeholder text.
 * @param {string}  type - 'json' | 'text' | 'form'
 * @param {Element} btn  - The clicked button element
 */
function setBodyType(type, btn) {
  bodyType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const ta = document.getElementById('body-textarea');
  if (type === 'json')      ta.placeholder = '{\n  "key": "value"\n}';
  else if (type === 'text') ta.placeholder = 'Plain text body...';
  else                      ta.placeholder = 'key=value&key2=value2';
}

/**
 * Pretty-format the JSON body textarea content.
 */
function formatBody() {
  const ta = document.getElementById('body-textarea');
  try {
    const parsed = JSON.parse(ta.value);
    ta.value = JSON.stringify(parsed, null, 2);
    showToast('✓ Formatted', 'success');
  } catch {
    showToast('Invalid JSON', 'error');
  }
}

// ── AUTH ───────────────────────────────────────────────────────────────

/**
 * Render auth-specific fields based on selected auth type.
 */
function updateAuthType() {
  const type = document.getElementById('auth-type').value;
  const container = document.getElementById('auth-fields');
  container.innerHTML = '';

  if (type === 'bearer') {
    container.innerHTML = `
      <div class="field-group">
        <label class="field-label">Token</label>
        <input type="text" class="field-input" id="auth-token" placeholder="eyJhbGci...">
      </div>`;
  } else if (type === 'basic') {
    container.innerHTML = `
      <div class="field-group">
        <label class="field-label">Username</label>
        <input type="text" class="field-input" id="auth-user" placeholder="username">
      </div>
      <div class="field-group">
        <label class="field-label">Password</label>
        <input type="password" class="field-input" id="auth-pass" placeholder="password">
      </div>`;
  } else if (type === 'apikey') {
    container.innerHTML = `
      <div class="field-group">
        <label class="field-label">Key Name</label>
        <input type="text" class="field-input" id="auth-key-name" placeholder="X-API-Key">
      </div>
      <div class="field-group">
        <label class="field-label">Value</label>
        <input type="text" class="field-input" id="auth-key-val" placeholder="your-api-key">
      </div>`;
  }
}

/**
 * Build and return an Authorization header object based on current auth settings.
 * @returns {Object} Header key-value pair or empty object
 */
function getAuthHeader() {
  const type = document.getElementById('auth-type').value;

  if (type === 'bearer') {
    const token = document.getElementById('auth-token')?.value;
    if (token) return { Authorization: 'Bearer ' + token };
  } else if (type === 'basic') {
    const user = document.getElementById('auth-user')?.value || '';
    const pass = document.getElementById('auth-pass')?.value || '';
    if (user) return { Authorization: 'Basic ' + btoa(user + ':' + pass) };
  } else if (type === 'apikey') {
    const name = document.getElementById('auth-key-name')?.value;
    const val  = document.getElementById('auth-key-val')?.value;
    if (name && val) return { [name]: val };
  }

  return {};
}

// ── SEND REQUEST ───────────────────────────────────────────────────────

/**
 * Build and fire the HTTP request, then render the response.
 */
async function sendRequest() {
  const url = document.getElementById('url-input').value.trim();
  if (!url) { showToast('Enter a URL first', 'error'); return; }
  if (!url.startsWith('http')) { showToast('URL must start with http(s)://', 'error'); return; }

  const method = document.getElementById('method-select').value;
  const btn    = document.getElementById('send-btn');

  // Loading state
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = '<span class="spinner"></span>SENDING';

  // ── Build headers ──
  const headersObj = {};
  getRows('headers').filter(h => h.enabled).forEach(h => headersObj[h.key] = h.value);
  Object.assign(headersObj, getAuthHeader());

  // ── Build body ──
  const bodyText = document.getElementById('body-textarea').value.trim();
  let bodyPayload;

  if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText) {
    if (bodyType === 'json') {
      headersObj['Content-Type'] = headersObj['Content-Type'] || 'application/json';
      bodyPayload = bodyText;
    } else if (bodyType === 'form') {
      headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
      bodyPayload = bodyText;
    } else {
      headersObj['Content-Type'] = 'text/plain';
      bodyPayload = bodyText;
    }
  }

  const startTime = Date.now();

  try {
    const options = { method, headers: headersObj };
    if (bodyPayload) options.body = bodyPayload;

    const response     = await fetch(url, options);
    const elapsed      = Date.now() - startTime;
    const responseText = await response.text();

    rawResponseText = responseText;

    // Collect response headers
    responseHeaders = {};
    response.headers.forEach((v, k) => responseHeaders[k] = v);

    // Update status badge
    const status = response.status;
    const badge  = document.getElementById('status-badge');
    badge.textContent = status + ' ' + response.statusText;
    badge.className   = 'status-badge status-' + Math.floor(status / 100) + 'xx';

    // Update time & size
    document.getElementById('time-display').textContent = elapsed + 'ms';
    document.getElementById('size-display').textContent = formatBytes(responseText.length);
    document.getElementById('time-meta').style.display  = 'flex';
    document.getElementById('size-meta').style.display  = 'flex';

    // Hide empty state
    document.getElementById('empty-state').style.display = 'none';

    // Render response content
    try {
      const json   = JSON.parse(responseText);
      const pretty = JSON.stringify(json, null, 2);
      renderPretty(pretty, true);
      renderRaw(responseText);
    } catch {
      renderPretty(responseText, false);
      renderRaw(responseText);
    }

    renderResponseHeaders();
    activateRespTab('pretty');

    // History
    addToHistory(method, url, status, elapsed);
    showToast(`${status} ${response.statusText} · ${elapsed}ms`, status < 400 ? 'success' : 'error');

  } catch (err) {
    document.getElementById('status-badge').textContent = 'ERROR';
    document.getElementById('status-badge').className   = 'status-badge status-5xx';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('panel-pretty').classList.add('active');
    document.getElementById('json-viewer').innerHTML =
      `<span style="color:var(--red)">${escHtml(err.message)}\n\nThis may be a CORS issue or network error.\nCheck the browser console for details.</span>`;
    document.getElementById('line-nums').innerHTML = '';
    rawResponseText = err.message;
    showToast('Request failed: ' + err.message, 'error');
  }

  // Reset button
  btn.disabled = false;
  btn.classList.remove('loading');
  btn.innerHTML = '▶ SEND';
}

// ── RENDER FUNCTIONS ───────────────────────────────────────────────────

/**
 * Render pretty (syntax-highlighted) JSON or plain text with line numbers.
 * @param {string}  text   - Text to render
 * @param {boolean} isJson - Whether to apply syntax highlighting
 */
function renderPretty(text, isJson = true) {
  const viewer   = document.getElementById('json-viewer');
  const lineNums = document.getElementById('line-nums');

  viewer.innerHTML = isJson
    ? syntaxHighlight(text)
    : `<span style="color:var(--text2)">${escHtml(text)}</span>`;

  const lines = text.split('\n');
  lineNums.innerHTML = lines.map((_, i) => i + 1).join('\n');
}

/**
 * Render raw response text.
 * @param {string} text
 */
function renderRaw(text) {
  document.getElementById('raw-viewer').textContent = text;
}

/**
 * Render the response headers table.
 */
function renderResponseHeaders() {
  const viewer = document.getElementById('headers-viewer');
  viewer.innerHTML = Object.entries(responseHeaders)
    .map(([k, v]) => `
      <div class="header-row">
        <span class="hdr-key">${escHtml(k)}</span>
        <span class="hdr-val">${escHtml(v)}</span>
      </div>`)
    .join('');
}

/**
 * Programmatically activate a response tab panel.
 * @param {string} id - Panel suffix id (e.g. 'pretty', 'raw', 'resp-headers')
 */
function activateRespTab(id) {
  document.querySelectorAll('.resp-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  document.querySelectorAll('.resp-tab').forEach(t => {
    const label = t.textContent.trim().toLowerCase();
    t.classList.toggle('active',
      label === id || (id === 'resp-headers' && t.textContent.trim() === 'Headers')
    );
  });
}

/**
 * Apply syntax highlighting to a JSON string and return HTML.
 * @param {string} json - Pretty-printed JSON text
 * @returns {string} HTML string with <span> color wrappers
 */
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
        return `<span class="json-string">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
      if (/null/.test(match))       return `<span class="json-null">${match}</span>`;
      return `<span class="json-number">${match}</span>`;
    }
  );
}

// ── HISTORY ────────────────────────────────────────────────────────────

/**
 * Push a completed request into the history list.
 */
function addToHistory(method, url, status, time) {
  history.unshift({ method, url, status, time, ts: Date.now() });
  if (history.length > 30) history.pop();
  renderHistory();
}

/**
 * Re-render the history sidebar list.
 */
function renderHistory() {
  const list = document.getElementById('history-list');
  if (history.length === 0) {
    list.innerHTML = '<div class="history-empty">No requests yet.</div>';
    return;
  }
  list.innerHTML = history.map((h, i) => `
    <div class="history-item" onclick="loadHistory(${i})">
      <div class="history-method method-${h.method}">${h.method}</div>
      <div class="history-url">${escHtml(shortenUrl(h.url))}</div>
      <div class="history-status" style="color:${h.status < 400 ? 'var(--green)' : 'var(--red)'}">
        ${h.status} · ${h.time}ms
      </div>
    </div>
  `).join('');
}

/**
 * Load a history entry back into the URL bar.
 * @param {number} i - History index
 */
function loadHistory(i) {
  const h = history[i];
  document.getElementById('url-input').value      = h.url;
  document.getElementById('method-select').value  = h.method;
  updateMethodColor();
}

/**
 * Wipe the full request history.
 */
function clearHistory() {
  history = [];
  renderHistory();
}

// ── QUICK EXAMPLES ─────────────────────────────────────────────────────

/** Example preset definitions */
const EXAMPLES = {
  jsonplaceholder: {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [],
    body: ''
  },
  catfact: {
    method: 'GET',
    url: 'https://catfact.ninja/fact',
    headers: [],
    body: ''
  },
  github: {
    method: 'GET',
    url: 'https://api.github.com/users/torvalds',
    headers: [['Accept', 'application/vnd.github.v3+json']],
    body: ''
  },
  weather: {
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=22.57&longitude=88.36&current_weather=true',
    headers: [],
    body: ''
  },
  'httpbin-post': {
    method: 'POST',
    url: 'https://httpbin.org/post',
    headers: [],
    body: '{\n  "name": "APIDash",\n  "version": "1.0",\n  "author": "Roshan"\n}'
  },
  reqres: {
    method: 'GET',
    url: 'https://reqres.in/api/users?page=1',
    headers: [['x-api-key', 'reqres-free-v1']],
    body: ''
  }
};

/**
 * Load a named preset into the editor.
 * @param {string} name - Key from EXAMPLES
 */
function loadExample(name) {
  const ex = EXAMPLES[name];
  if (!ex) return;

  document.getElementById('url-input').value     = ex.url;
  document.getElementById('method-select').value = ex.method;
  updateMethodColor();

  // Reset & populate headers
  document.getElementById('headers-table').innerHTML = '';
  ex.headers.forEach(([k, v]) => addRow('headers', k, v));

  // Set body
  document.getElementById('body-textarea').value = ex.body;

  // Auto-switch to Body tab for POST requests
  if (ex.method === 'POST') {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab')[2].classList.add('active');
    document.getElementById('tab-body').classList.add('active');
  }

  showToast('Loaded: ' + name, 'success');
}

// ── COPY ───────────────────────────────────────────────────────────────

/**
 * Copy the last response text to the clipboard.
 */
function copyResponse() {
  if (!rawResponseText) { showToast('Nothing to copy', 'error'); return; }
  navigator.clipboard.writeText(rawResponseText).then(() => {
    showToast('✓ Copied to clipboard', 'success');
  });
}

// ── TOAST ──────────────────────────────────────────────────────────────

/**
 * Display a temporary toast notification.
 * @param {string} msg  - Message to display
 * @param {string} type - 'success' | 'error' | ''
 */
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = 'toast ' + type + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── RESIZER ────────────────────────────────────────────────────────────

/**
 * Wire up the drag-to-resize handle between left and right panels.
 */
function initResizer() {
  const resizer   = document.getElementById('resizer');
  const leftPanel = document.getElementById('left-panel');
  let isResizing  = false;

  resizer.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const rect     = document.querySelector('.workspace').getBoundingClientRect();
    const newWidth = Math.max(260, Math.min(600, e.clientX - rect.left));
    leftPanel.style.width = newWidth + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
  });
}

// ── UTILITIES ──────────────────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS in innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

/**
 * Format a byte count as a human-readable string.
 * @param {number} n - Byte count
 * @returns {string}
 */
function formatBytes(n) {
  if (n < 1024)    return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

/**
 * Shorten a URL to a readable hostname + truncated path.
 * @param {string} url
 * @returns {string}
 */
function shortenUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname;
    return u.hostname + (path.length > 30 ? path.slice(0, 30) + '…' : path);
  } catch {
    return url.slice(0, 40);
  }
}
