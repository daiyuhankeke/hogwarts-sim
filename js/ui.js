const HOUSE_COLORS = {
  '格兰芬多': { primary: '#740001', accent: '#d3a625' },
  '斯莱特林': { primary: '#1a472a', accent: '#aaaaaa' },
  '拉文克劳': { primary: '#0e1a40', accent: '#946b2d' },
  '赫奇帕奇': { primary: '#372672', accent: '#ecb939' },
};

export function applyHouseTheme(house) {
  const colors = HOUSE_COLORS[house] || HOUSE_COLORS['格兰芬多'];
  document.documentElement.style.setProperty('--house-primary', colors.primary);
  document.documentElement.style.setProperty('--house-accent', colors.accent);
}

export function renderStatusBar(state, statusLine) {
  const el = document.getElementById('status-bar');
  if (!el) return;

  if (statusLine) {
    el.textContent = statusLine;
    return;
  }

  const target = state.currentTarget || '无';
  const rel = target !== '无' ? state.relationships[target] : null;
  const stage = rel?.stage ?? '—';
  const affection = rel?.affection ?? 0;
  const mood = state.player.mood;

  el.textContent =
    `第${state.time.week}周 ${state.time.weekday} | 霍格沃茨 | ${state.scene.weather} | ` +
    `场景：${state.scene.location} | 当前男主：${target} | 关系：${stage} | 好感：${affection} | 心情：${mood}`;
}

export function renderNarrative(text) {
  const el = document.getElementById('narrative');
  if (!el) return;
  el.innerHTML = formatNarrative(text);
  el.scrollTop = 0;
}

function formatNarrative(text) {
  if (!text) return '<p class="placeholder">等待故事开始……</p>';
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function renderOptions(options, onSelect, disabled = false) {
  const container = document.getElementById('options');
  if (!container) return;
  container.innerHTML = '';

  if (!options || options.length === 0) {
    container.innerHTML = '<p class="hint">暂无选项</p>';
    return;
  }

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.disabled = disabled;
    btn.innerHTML = `<span class="opt-id">${escapeHtml(opt.id)}</span><span class="opt-text">${escapeHtml(opt.text)}</span>`;
    btn.addEventListener('click', () => onSelect(opt));
    container.appendChild(btn);
  }
}

export function renderRelationships(state) {
  const el = document.getElementById('relationships-panel');
  if (!el) return;

  const items = Object.entries(state.relationships)
    .filter(([, r]) => r.affection > 0)
    .sort((a, b) => b[1].affection - a[1].affection);

  if (items.length === 0) {
    el.innerHTML = '<p class="hint">尚未与任何人建立好感</p>';
    return;
  }

  el.innerHTML = items
    .map(
      ([name, r]) =>
        `<div class="rel-item"><span>${escapeHtml(name)}</span>` +
        `<span class="rel-stage">${escapeHtml(r.stage)}</span>` +
        `<span class="rel-bar"><span style="width:${r.affection}%"></span></span>` +
        `<span class="rel-num">${r.affection}</span></div>`
    )
    .join('');
}

export function renderEventHints(events, endingHint) {
  const el = document.getElementById('event-hints');
  if (!el) return;
  const parts = [];
  if (events?.length) parts.push(`近期：${events.join('、')}`);
  if (endingHint) parts.push(endingHint);
  el.textContent = parts.join(' | ') || '';
}

export function setLoading(loading) {
  const overlay = document.getElementById('loading');
  const options = document.getElementById('options');
  if (overlay) overlay.hidden = !loading;
  if (options) {
    options.querySelectorAll('button').forEach((b) => {
      b.disabled = loading;
    });
  }
  const submitBtn = document.getElementById('custom-submit');
  if (submitBtn) submitBtn.disabled = loading;
}

export function showError(message) {
  const el = document.getElementById('error-banner');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function hideError() {
  const el = document.getElementById('error-banner');
  if (el) el.hidden = true;
}

export function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => {
    s.hidden = s.id !== screenId;
  });
}

export function populateSaveSlots(slots) {
  const select = document.getElementById('save-slot-select');
  if (!select) return;
  select.innerHTML = '';
  for (let i = 0; i < slots.length; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    const info = slots[i];
    opt.textContent = info ? `槽${i + 1}：${info.name}（第${info.week}周）` : `槽${i + 1}：空`;
    select.appendChild(opt);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
