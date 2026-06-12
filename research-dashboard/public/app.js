/* ── Research Dashboard — app.js ─────────────────────────────────────────── */

const API = 'http://localhost:3001/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showStatus(el, msg, type) {
  el.textContent = ' ' + msg;
  el.className = 'status-msg ' + type;
  el.style.display = 'block';
}

function fmtDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) { return str; }
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

// ── Tab switching ─────────────────────────────────────────────────────────────

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'timeline') loadTimeline();
    if (btn.dataset.tab === 'publish') { clearSelection(); loadUpdates(); }
    if (btn.dataset.tab === 'import') clearSelection();
  });
});

// ── Tag chip UI (reusable) ────────────────────────────────────────────────────

function buildTagUI(containerEl, inputEl, initialTags) {
  let tags = [...(initialTags || [])];

  function render() {
    // Remove old chips (keep the input)
    containerEl.querySelectorAll('.tag-chip').forEach(c => c.remove());
    tags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `${esc(tag)}<span class="remove" title="Remove">×</span>`;
      chip.querySelector('.remove').addEventListener('click', () => {
        tags = tags.filter(t => t !== tag);
        render();
      });
      containerEl.insertBefore(chip, inputEl);
    });
  }

  inputEl.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && inputEl.value.trim()) {
      e.preventDefault();
      const val = inputEl.value.trim().replace(/,$/, '');
      if (val && !tags.includes(val)) { tags.push(val); render(); }
      inputEl.value = '';
    } else if (e.key === 'Backspace' && inputEl.value === '' && tags.length) {
      tags.pop();
      render();
    }
  });

  render();
  return { getTags: () => tags, setTags: (t) => { tags = [...t]; render(); } };
}

// ── TAB 1: IMPORT ─────────────────────────────────────────────────────────────

let importTagUI = null;
let pendingImportId = null;

const parseBtn = document.getElementById('import-parse-btn');
const saveBtn = document.getElementById('import-save-btn');
const importPreview = document.getElementById('import-preview');
const importStatus = document.getElementById('import-status');

parseBtn.addEventListener('click', async () => {
  const text = document.getElementById('import-text').value.trim();
  const title = document.getElementById('import-title').value.trim();
  const chatDate = document.getElementById('import-date').value;

  if (!text) { alert('Paste some chat text first.'); return; }

  parseBtn.disabled = true;
  parseBtn.textContent = 'Parsing…';
  importStatus.style.display = 'none';

  try {
    const project = document.getElementById('import-project').value || 'stick';
    const data = await api('POST', '/imports', { text, title, chatDate, project });
    pendingImportId = data.id;

    // Tag UI
    const tagContainer = document.getElementById('import-tags');
    const tagInput = document.getElementById('import-tag-input');
    importTagUI = buildTagUI(tagContainer, tagInput, data.suggestedTags);

    // Excerpt preview
    const excerptEl = document.getElementById('excerpt-preview');
    if (data.excerpts.length === 0) {
      excerptEl.innerHTML = '<p style="color:var(--muted);font-size:13px;">No ⦿-⦿ excerpts found in this text.</p>';
    } else {
      excerptEl.innerHTML = `<label>${data.excerpts.length} excerpt${data.excerpts.length > 1 ? 's' : ''} found</label>
        <div class="excerpt-list">${data.excerpts.map(ex =>
          `<div class="excerpt-item">${esc(ex)}</div>`
        ).join('')}</div>`;
    }

    importPreview.style.display = 'block';
    importPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    parseBtn.disabled = false;
    parseBtn.textContent = 'Parse & Preview';
  }
});

saveBtn.addEventListener('click', async () => {
  if (!pendingImportId || !importTagUI) return;
  const tags = importTagUI.getTags();
  const title = document.getElementById('import-title').value.trim();

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    await api('PATCH', '/imports/' + pendingImportId, { tags, title });
    importStatus.textContent = '✓ Saved.';
    importStatus.className = 'status-msg success';
    importStatus.style.display = 'inline';

    // Reset form
    setTimeout(() => {
      document.getElementById('import-text').value = '';
      document.getElementById('import-title').value = '';
      document.getElementById('import-date').value = '';
      importPreview.style.display = 'none';
      importStatus.style.display = 'none';
      pendingImportId = null;
    }, 1500);
  } catch (e) {
    importStatus.textContent = '✗ ' + e.message;
    importStatus.className = 'status-msg error';
    importStatus.style.display = 'inline';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Import';
  }
});

// ── TAB 2: TIMELINE ───────────────────────────────────────────────────────────

let timelineData = [];
let activeTimelineTag = null;
let selectedImportIds = new Set();

function updateSelectionBar() {
  let bar = document.getElementById('selection-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'selection-bar';
    bar.className = 'selection-bar';
    document.body.appendChild(bar);
  }
  if (selectedImportIds.size === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  bar.innerHTML = `
    <span class="sel-count">${selectedImportIds.size} entr${selectedImportIds.size === 1 ? 'y' : 'ies'} selected</span>
    <span class="sel-clear" onclick="clearSelection()">clear</span>
    <button class="btn-primary" id="gen-btn" onclick="generateDraft()">Generate Article Draft →</button>
  `;
}

function clearSelection() {
  selectedImportIds.clear();
  document.querySelectorAll('.import-select-cb').forEach(cb => cb.checked = false);
  updateSelectionBar();
}

window.clearSelection = clearSelection;

async function generateDraft() {
  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.textContent = 'Generating…';
  try {
    const data = await api('POST', '/generate-draft', { importIds: Array.from(selectedImportIds) });
    clearSelection();
    openNewDraft(data.title, data.body);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Generate Article Draft →';
    const bar = document.getElementById('selection-bar');
    const errEl = document.createElement('span');
    errEl.style.cssText = 'color:var(--danger);font-size:12px;';
    errEl.textContent = e.message;
    bar.appendChild(errEl);
    setTimeout(() => errEl.remove(), 4000);
  }
}

window.generateDraft = generateDraft;

async function openNewDraft(title, body) {
  // Switch to publish tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const publishBtn = document.querySelector('[data-tab="publish"]');
  publishBtn.classList.add('active');
  document.getElementById('tab-publish').classList.add('active');

  await loadUpdates();

  // Create the draft
  const res = await api('POST', '/updates', { title: title || 'New Draft', body: body || '', tags: [], images: [] });
  updates = await api('GET', '/updates');
  renderUpdateList();
  selectUpdate(res.id);
}

window.openNewDraft = openNewDraft;

async function loadTimeline() {
  const contentEl = document.getElementById('timeline-content');
  contentEl.innerHTML = '<div class="loading">Loading…</div>';

  try {
    timelineData = await api('GET', '/timeline');
    renderTimeline();
    buildTimelineTagFilters();
  } catch (e) {
    contentEl.innerHTML = `<div class="loading">Error: ${esc(e.message)}</div>`;
  }
}

function buildTimelineTagFilters() {
  const filtersEl = document.getElementById('timeline-tag-filters');
  const tagSet = new Set();
  timelineData.forEach(week => week.imports.forEach(imp => (imp.tags || []).forEach(t => tagSet.add(t))));

  if (tagSet.size === 0) { filtersEl.innerHTML = ''; return; }

  let html = `<button class="tag-filter-btn active" data-tag="">All</button>`;
  tagSet.forEach(t => { html += `<button class="tag-filter-btn" data-tag="${esc(t)}">${esc(t)}</button>`; });
  filtersEl.innerHTML = html;

  filtersEl.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersEl.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTimelineTag = btn.dataset.tag || null;
      renderTimeline();
    });
  });
}

function renderTimeline() {
  const contentEl = document.getElementById('timeline-content');
  contentEl.className = 'timeline-selectable';

  if (timelineData.length === 0) {
    contentEl.innerHTML = '<div class="loading">No imports yet. Go to Import tab to add some.</div>';
    return;
  }

  let html = '';
  timelineData.forEach(week => {
    const imports = activeTimelineTag
      ? week.imports.filter(imp => (imp.tags || []).includes(activeTimelineTag))
      : week.imports;

    if (imports.length === 0) return;

    const weekLabel = fmtWeek(week.weekStart);
    html += `<div class="week-group"><div class="week-label">Week of ${weekLabel}</div>`;
    imports.forEach(imp => {
      const tagsHtml = (imp.tags || []).map(t => `<span class="tag-chip" style="cursor:default">${esc(t)}</span>`).join('');
      const excerptNote = imp.excerptCount > 0 ? `${imp.excerptCount} excerpt${imp.excerptCount > 1 ? 's' : ''}` : 'no excerpts';
      const checked = selectedImportIds.has(imp.id) ? 'checked' : '';
      html += `
        <div class="import-entry">
          <input type="checkbox" class="import-select-cb" ${checked}
            onchange="toggleImportSelect(${imp.id}, this.checked)">
          <div class="import-header" onclick="toggleImport(this, ${imp.id})">
            <span class="import-title">${esc(imp.title || '(untitled)')}</span>
            <span class="import-date">${fmtDate(imp.chat_date || imp.imported_at)}</span>
            <span class="import-count">${excerptNote}</span>
            <span class="import-toggle">▶</span>
          </div>
          <div class="import-body" id="import-body-${imp.id}">
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${tagsHtml || '<span style="color:var(--muted);font-size:12px;">no tags</span>'}</div>
            <div id="import-excerpts-${imp.id}" style="margin-top:12px;"></div>
          </div>
        </div>`;
    });
    html += '</div>';
  });

  contentEl.innerHTML = html || '<div class="loading">No results for this tag.</div>';
}

function toggleImportSelect(id, checked) {
  if (checked) selectedImportIds.add(id);
  else selectedImportIds.delete(id);
  updateSelectionBar();
}

window.toggleImportSelect = toggleImportSelect;

function fmtWeek(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) { return dateStr; }
}

async function toggleImport(headerEl, importId) {
  const bodyEl = document.getElementById('import-body-' + importId);
  const toggleEl = headerEl.querySelector('.import-toggle');
  const isOpen = bodyEl.classList.contains('open');

  if (isOpen) {
    bodyEl.classList.remove('open');
    toggleEl.textContent = '▶';
    return;
  }

  bodyEl.classList.add('open');
  toggleEl.textContent = '▼';

  const excerptsEl = document.getElementById('import-excerpts-' + importId);
  if (excerptsEl.dataset.loaded) return;

  excerptsEl.innerHTML = '<div class="loading">Loading excerpts…</div>';
  try {
    const data = await api('GET', '/imports/' + importId);
    if (data.excerpts.length === 0) {
      excerptsEl.innerHTML = '<div style="color:var(--muted);font-size:12px;">No excerpts.</div>';
    } else {
      excerptsEl.innerHTML = data.excerpts.map(ex =>
        `<div class="excerpt-item">${esc(ex.content)}</div>`
      ).join('');
    }
    excerptsEl.dataset.loaded = '1';
  } catch (e) {
    excerptsEl.innerHTML = `<div style="color:var(--danger);">Error: ${esc(e.message)}</div>`;
  }
}

// Make toggleImport globally accessible (called via inline onclick)
window.toggleImport = toggleImport;

// ── TAB 3: PUBLISH ────────────────────────────────────────────────────────────

let updates = [];
let selectedUpdateId = null;
let editorTagUI = null;

async function loadUpdates() {
  const listEl = document.getElementById('update-list');
  listEl.innerHTML = '<div class="loading">Loading…</div>';
  try {
    updates = await api('GET', '/updates');
    renderUpdateList();
  } catch (e) {
    listEl.innerHTML = `<div class="loading">Error: ${esc(e.message)}</div>`;
  }
}

function renderUpdateList() {
  const listEl = document.getElementById('update-list');
  if (updates.length === 0) {
    listEl.innerHTML = '<div style="color:var(--muted);font-size:12px;">No updates yet.</div>';
    return;
  }
  listEl.innerHTML = updates.map(u => `
    <div class="update-list-item ${selectedUpdateId === u.id ? 'selected' : ''}" data-id="${u.id}" onclick="selectUpdate(${u.id})">
      <div class="upd-title">${esc(u.title)}</div>
      <div class="upd-meta">${fmtDate(u.created_at)}</div>
      <span class="upd-status ${u.published_at ? 'published' : 'draft'}">${u.published_at ? 'published' : 'draft'}</span>
      <span class="project-badge ${esc(u.project || 'stick')}">${esc(u.project || 'stick')}</span>
    </div>
  `).join('');
}

function selectUpdate(id) {
  selectedUpdateId = id;
  renderUpdateList();
  const upd = updates.find(u => u.id === id);
  if (!upd) return;
  renderEditor(upd);
}

window.selectUpdate = selectUpdate;

function renderEditor(upd) {
  const panel = document.getElementById('editor-panel');
  const isPublished = !!upd.published_at;

  const proj = upd.project || 'stick';
  panel.innerHTML = `
    <div class="form-row">
      <label>Title</label>
      <input type="text" id="ed-title" value="${esc(upd.title)}" ${isPublished ? 'readonly' : ''}>
    </div>

    <div class="form-row">
      <label>Project</label>
      <select id="ed-project" ${isPublished ? 'disabled' : ''}>
        <option value="stick" ${proj === 'stick' ? 'selected' : ''}>⦿-⦿ stick / game</option>
        <option value="loob" ${proj === 'loob' ? 'selected' : ''}>loob</option>
        <option value="time-compass" ${proj === 'time-compass' ? 'selected' : ''}>time compass</option>
      </select>
    </div>

    <div class="form-row">
      <label>Date (shown on public feed)</label>
      <input type="date" id="ed-date" value="${(upd.post_date || upd.created_at || '').slice(0,10)}" ${isPublished ? 'readonly' : ''}>
    </div>

    <div class="form-row">
      <label>Body (markdown)</label>
      <textarea id="ed-body" style="min-height:160px" ${isPublished ? 'readonly' : ''}>${esc(upd.body)}</textarea>
      <div class="preview-area" id="ed-preview"></div>
    </div>

    <div class="form-row">
      <label>Tags</label>
      <div class="tag-area" id="ed-tags">
        <input class="tag-input" id="ed-tag-input" placeholder="add tag…" ${isPublished ? 'disabled' : ''}>
      </div>
    </div>

    <div class="form-row">
      <label>Images</label>
      <div class="image-upload-area">
        <input type="file" id="ed-image-file" accept="image/*" multiple style="display:none">
        <button class="btn-sm" onclick="document.getElementById('ed-image-file').click()">+ Upload images</button>
        <span id="upload-status" style="font-size:12px;color:var(--muted);margin-left:8px;"></span>
      </div>
      <div id="ed-image-list" class="image-list"></div>
    </div>

    <div class="editor-actions">
      ${isPublished
        ? `<button class="btn-sm" onclick="enablePublishedEdit(${upd.id})">Edit</button>
           <button class="btn-sm" onclick="unpublishUpdate()">Unpublish</button>`
        : `<button class="btn-primary" onclick="saveDraft()">Save Draft</button>
           <button class="btn-success" onclick="publishUpdate()">Publish</button>
           <button class="btn-danger btn-sm" onclick="deleteDraft()">Delete Draft</button>`
      }
    </div>
    <div id="ed-status"></div>
  `;

  // Tag UI
  editorTagUI = buildTagUI(
    document.getElementById('ed-tags'),
    document.getElementById('ed-tag-input'),
    upd.tags || []
  );

  // Live markdown preview
  const bodyEl = document.getElementById('ed-body');
  const previewEl = document.getElementById('ed-preview');
  function updatePreview() {
    previewEl.innerHTML = simpleMarkdown(bodyEl.value);
  }
  bodyEl.addEventListener('input', updatePreview);
  updatePreview();

  // Image list
  renderImageList(upd.images || []);

  // File upload
  const fileInput = document.getElementById('ed-image-file');
  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files.length) return;
      const statusEl = document.getElementById('upload-status');
      statusEl.textContent = 'Uploading…';
      const form = new FormData();
      for (const f of fileInput.files) form.append('images', f);
      try {
        const res = await fetch('/api/images/upload', { method: 'POST', body: form });
        const data = await res.json();
        const upd2 = updates.find(u => u.id === selectedUpdateId);
        const merged = [...new Set([...(upd2.images || []), ...data.files])];
        await api('PATCH', '/updates/' + selectedUpdateId, { images: merged });
        updates = updates.map(u => u.id === selectedUpdateId ? { ...u, images: merged } : u);
        renderImageList(merged);
        statusEl.textContent = `${data.files.length} file(s) uploaded`;
        setTimeout(() => statusEl.textContent = '', 2000);
      } catch (e) {
        statusEl.textContent = 'Upload failed: ' + e.message;
      }
      fileInput.value = '';
    });
  }
}

function renderImageList(images) {
  const el = document.getElementById('ed-image-list');
  if (!el) return;
  if (!images.length) { el.innerHTML = '<span style="color:var(--muted);font-size:12px;">No images yet.</span>'; return; }
  el.innerHTML = images.map(f => `
    <div class="image-thumb-row">
      <img src="/research/images/${encodeURIComponent(f)}" alt="${esc(f)}" class="image-thumb">
      <span class="image-name">${esc(f)}</span>
      <span class="image-remove" onclick="removeImage('${esc(f)}')">×</span>
    </div>
  `).join('');
}

async function removeImage(filename) {
  const upd = updates.find(u => u.id === selectedUpdateId);
  if (!upd) return;
  const newImages = (upd.images || []).filter(f => f !== filename);
  await api('PATCH', '/updates/' + selectedUpdateId, { images: newImages });
  updates = updates.map(u => u.id === selectedUpdateId ? { ...u, images: newImages } : u);
  renderImageList(newImages);
}

window.removeImage = removeImage;

function simpleMarkdown(text) {
  // Very basic: paragraphs, bold, italic, code
  return text
    .split(/\n\n+/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      // Inline transforms
      block = block
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      return `<p>${block}</p>`;
    })
    .join('');
}

async function saveDraft() {
  if (!selectedUpdateId || !editorTagUI) return;
  const title = document.getElementById('ed-title').value.trim();
  const body = document.getElementById('ed-body').value.trim();
  const tags = editorTagUI.getTags();
  const images = (updates.find(u => u.id === selectedUpdateId) || {}).images || [];
  const post_date = document.getElementById('ed-date').value || null;
  const project = document.getElementById('ed-project') ? document.getElementById('ed-project').value : 'stick';
  const statusEl = document.getElementById('ed-status');

  if (!title || !body) { alert('Title and body are required.'); return; }

  try {
    await api('PATCH', '/updates/' + selectedUpdateId, { title, body, tags, images, post_date, project });
    // Refresh list
    updates = updates.map(u => u.id === selectedUpdateId
      ? { ...u, title, body, tags, images, post_date, project }
      : u
    );
    renderUpdateList();
    showStatus(statusEl, '✓ Draft saved.', 'success');
  } catch (e) {
    showStatus(statusEl, '✗ ' + e.message, 'error');
  }
}

window.saveDraft = saveDraft;

async function publishUpdate() {
  if (!selectedUpdateId) return;
  const statusEl = document.getElementById('ed-status');

  if (!confirm('Publish this update? This will write updates.json and push to GitHub.')) return;

  // Save first
  await saveDraft();

  try {
    const res = await api('POST', '/updates/' + selectedUpdateId + '/publish');
    showStatus(statusEl, '✓ Published and pushed to GitHub!', 'success');
    // Refresh
    updates = await api('GET', '/updates');
    renderUpdateList();
    const upd = updates.find(u => u.id === selectedUpdateId);
    if (upd) renderEditor(upd);
  } catch (e) {
    showStatus(statusEl, '✗ Publish failed: ' + e.message, 'error');
  }
}

window.publishUpdate = publishUpdate;

async function deleteDraft() {
  if (!selectedUpdateId) return;
  if (!confirm('Delete this draft?')) return;

  try {
    await api('DELETE', '/updates/' + selectedUpdateId);
    selectedUpdateId = null;
    updates = await api('GET', '/updates');
    renderUpdateList();
    document.getElementById('editor-panel').innerHTML =
      '<div style="color:var(--muted);font-size:13px;padding-top:40px;text-align:center;">Select a draft or create a new one.</div>';
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

window.deleteDraft = deleteDraft;

async function unpublishUpdate() {
  if (!selectedUpdateId) return;
  if (!confirm('Unpublish this update? It will become an editable draft again.')) return;
  const statusEl = document.getElementById('ed-status');
  try {
    await api('POST', '/updates/' + selectedUpdateId + '/unpublish');
    updates = await api('GET', '/updates');
    renderUpdateList();
    const upd = updates.find(u => u.id === selectedUpdateId);
    if (upd) renderEditor(upd);
    showStatus(statusEl, '✓ Unpublished. You can now edit and re-publish.', 'success');
  } catch (e) {
    showStatus(statusEl, '✗ ' + e.message, 'error');
  }
}

window.unpublishUpdate = unpublishUpdate;

async function saveAndRepublish() {
  if (!selectedUpdateId) return;
  const statusEl = document.getElementById('ed-status');
  await saveDraft();
  try {
    await api('POST', '/updates/' + selectedUpdateId + '/publish');
    updates = await api('GET', '/updates');
    renderUpdateList();
    const upd = updates.find(u => u.id === selectedUpdateId);
    if (upd) renderEditor(upd);
    showStatus(statusEl, '✓ Saved and re-published to GitHub.', 'success');
  } catch (e) {
    showStatus(statusEl, '✗ ' + e.message, 'error');
  }
}

window.saveAndRepublish = saveAndRepublish;

function enablePublishedEdit() {
  document.getElementById('ed-title').removeAttribute('readonly');
  document.getElementById('ed-date').removeAttribute('readonly');
  document.getElementById('ed-body').removeAttribute('readonly');
  document.getElementById('ed-project').removeAttribute('disabled');
  document.getElementById('ed-tag-input').removeAttribute('disabled');
  const actionsEl = document.querySelector('.editor-actions');
  actionsEl.innerHTML = `
    <button class="btn-primary" onclick="saveAndRepublish()">Save &amp; Re-publish</button>
    <button class="btn-sm" onclick="unpublishUpdate()">Unpublish</button>
  `;
}

window.enablePublishedEdit = enablePublishedEdit;

document.getElementById('new-draft-btn').addEventListener('click', async () => {
  const title = prompt('Draft title:');
  if (!title) return;

  try {
    const res = await api('POST', '/updates', { title, body: '', tags: [], images: [] });
    updates = await api('GET', '/updates');
    renderUpdateList();
    selectUpdate(res.id);
  } catch (e) {
    alert('Error: ' + e.message);
  }
});
