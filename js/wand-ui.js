import { formatWandSummary } from './wand-system.js';

export function renderWandPreview(container, wand) {
  if (!container) return;
  if (!wand) {
    container.innerHTML = '<p class="hint">点击「前往奥利凡德」挑选魔杖</p>';
    return;
  }

  container.innerHTML = `
    <div class="wand-preview-card wand-preview-text">
      <div class="wand-preview-info">
        <strong>${escapeHtml(formatWandSummary(wand))}</strong>
        <span class="wand-flex">${escapeHtml(wand.flexibility)}</span>
        <p class="wand-appearance">${escapeHtml(wand.appearance || '')}</p>
        ${wand.affinity ? `<p class="wand-affinity">${escapeHtml(wand.affinity)}</p>` : ''}
        <span class="hint">${wand.generatedBy === 'api' ? '奥利凡德为你挑选' : '本地生成'}</span>
      </div>
    </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
