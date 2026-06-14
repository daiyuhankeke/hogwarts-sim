import { createInitialState } from './state.js';
import {
  DEFAULT_NAME,
  DEFAULT_APPEARANCE,
  TALENT_PRESETS,
  applyComposedAppearanceToForm,
  fitAppearanceField,
} from './character-config.js';
import { getPlaythroughHook } from './progression.js';
import {
  showScreen,
  applyHouseTheme,
  hideError,
} from './ui.js';
import { renderWandPreview } from './wand-ui.js';
import {
  renderAppearanceTraitGroups,
  bindAppearanceTraitLimits,
  collectAppearanceTraits,
  formatTraitsSummary,
  clearAppearanceTraitInputs,
} from './appearance-config.js';
import { clearSceneVisual, applySceneVisual } from './scene-visuals.js';
import { toggleAudio, isAudioEnabled, stopAmbient } from './ambient-audio.js';
import {
  SACRED_28_FAMILIES,
  PLAYER_MUGGLE_ATTITUDES,
  CANON_CONNECTION_OPTIONS,
  collectFamilyFromForm,
  formatFamilyForPrompt,
  getFamilyById,
  resolvePlayerNameFromForm,
  resolvePlayerSurname,
  isSacred28FamilySelection,
} from './family-background.js';
import {
  getPendingWand,
  setPendingWand,
  setGameState,
  setCurrentSlot,
  getCurrentSlot,
  resetSession,
  getGameState,
} from './game-store.js';
import {
  sendTurn,
  bootstrapTurnView,
  renderGameUI,
} from './game-controller.js';

const WAND_API_URL = '/api/wand';
const APPEARANCE_API_URL = '/api/appearance';
const INVITE_KEY = 'hogwarts-invite-code';

function getInviteCode() {
  return localStorage.getItem(INVITE_KEY) || '';
}

function showCreateError(message) {
  const el = document.getElementById('create-error');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function hideCreateError() {
  const el = document.getElementById('create-error');
  if (el) el.hidden = true;
}

export function initCharacterFormOptions() {
  const talentContainer = document.getElementById('talent-presets');
  if (talentContainer) {
    talentContainer.innerHTML = TALENT_PRESETS.map(
      (t) =>
        `<label class="talent-chip"><input type="checkbox" name="talentPreset" value="${t}"><span>${t}</span></label>`
    ).join('');
    talentContainer.addEventListener('change', updateTalentSummary);
    document.querySelector('input[name="talentCustom"]')?.addEventListener('input', updateTalentSummary);
  }

  document.getElementById('wand-generate-btn')?.addEventListener('click', () => generateWand(false));
  document.getElementById('wand-fallback-btn')?.addEventListener('click', () => generateWand(true));

  document.getElementById('audio-toggle-btn')?.addEventListener('click', () => {
    const on = toggleAudio();
    const btn = document.getElementById('audio-toggle-btn');
    if (btn) btn.textContent = on ? '🔊 环境音' : '🔇 环境音';
    const gs = getGameState();
    if (on && gs) applySceneVisual(gs);
    else stopAmbient();
  });
  updateAudioButton();
  initFamilyFormOptions();
  bindFamilyFormEvents();
  bindAppearanceControls();
  updateAppearanceTraitSummary();
}

function updateAppearanceTraitSummary() {
  const form = document.getElementById('character-form');
  const el = document.getElementById('appearance-trait-summary');
  if (!form || !el) return;
  el.textContent = `已选：${formatTraitsSummary(collectAppearanceTraits(form))}`;
}

function bindAppearanceControls() {
  const form = document.getElementById('character-form');
  renderAppearanceTraitGroups(document.getElementById('appearance-trait-groups'));
  bindAppearanceTraitLimits(form, updateAppearanceTraitSummary);

  const field = document.getElementById('player-appearance');
  field?.addEventListener('input', () => fitAppearanceField(field));

  document.getElementById('appearance-compose-btn')?.addEventListener('click', () => {
    applyComposedAppearanceToForm(form, { fillRandom: true });
    const statusEl = document.getElementById('appearance-status');
    if (statusEl) statusEl.textContent = '已根据标签组合描写，可在下方继续修改。';
  });
  document.getElementById('appearance-ai-btn')?.addEventListener('click', () => generateAppearance('compose'));
  document.getElementById('appearance-refine-btn')?.addEventListener('click', () => generateAppearance('refine'));
}

function applyAppearanceResult(result) {
  const form = document.getElementById('character-form');
  const input = form?.appearance ?? form?.elements?.appearance;
  if (input && result?.appearance) {
    input.value = result.appearance;
    fitAppearanceField(input);
  }
}

function collectAppearanceProfile(form) {
  const { name } = resolvePlayerNameFromForm(form);
  return {
    name,
    house: form.house.value,
    year: Number(form.year.value),
    bloodStatus: form.bloodStatus.value,
    appearance: form.appearance.value.trim(),
    family: collectFamilyFromForm(form),
  };
}

async function generateAppearance(mode = 'compose') {
  const form = document.getElementById('character-form');
  if (!form) return;

  hideCreateError();
  const profile = collectAppearanceProfile(form);
  const appearanceTraits = collectAppearanceTraits(form);

  const composeBtn = document.getElementById('appearance-compose-btn');
  const aiBtn = document.getElementById('appearance-ai-btn');
  const refineBtn = document.getElementById('appearance-refine-btn');
  const statusEl = document.getElementById('appearance-status');
  [composeBtn, aiBtn, refineBtn].forEach((b) => { if (b) b.disabled = true; });
  if (statusEl) {
    statusEl.textContent = mode === 'refine'
      ? '正在 AI 润色现有描写……'
      : '正在根据标签 AI 撰写描写……';
  }

  try {
    const res = await fetch(APPEARANCE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        appearanceTraits,
        inviteCode: getInviteCode(),
        mode,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '外貌生成失败');

    applyAppearanceResult(data.appearance);
    if (statusEl) {
      statusEl.textContent = mode === 'refine'
        ? '润色完成，可继续修改。'
        : 'AI 描写已生成，可继续修改。';
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = '';
    showCreateError(err.message || '外貌生成失败');
  } finally {
    [composeBtn, aiBtn, refineBtn].forEach((b) => { if (b) b.disabled = false; });
  }
}

function updateAudioButton() {
  const btn = document.getElementById('audio-toggle-btn');
  if (btn) btn.textContent = isAudioEnabled() ? '🔊 环境音' : '🔇 环境音';
}

function initFamilyFormOptions() {
  const familySelect = document.getElementById('wizard-family-select');
  if (familySelect) {
    for (const f of SACRED_28_FAMILIES) {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.label}（${f.surname}）— ${f.attitude}`;
      familySelect.appendChild(opt);
    }
    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = '其他纯血姓氏（自拟）';
    familySelect.appendChild(customOpt);
  }

  const playerAtt = document.getElementById('player-muggle-attitude');
  if (playerAtt) {
    playerAtt.innerHTML = PLAYER_MUGGLE_ATTITUDES.map(
      (a) => `<option value="${a.value}">${a.label}</option>`
    ).join('');
  }

  const chips = document.getElementById('canon-connection-chips');
  if (chips) {
    chips.innerHTML = CANON_CONNECTION_OPTIONS.filter((c) => c.id !== 'none').map(
      (c) =>
        `<label class="talent-chip"><input type="checkbox" name="canonConnection" value="${c.id}"><span>${c.label}</span></label>`
    ).join('');
  }

  updateFamilyFormVisibility();
  syncPlayerSurnameField();
}

function syncPlayerSurnameField() {
  const form = document.getElementById('character-form');
  const surnameInput = document.getElementById('player-surname');
  const hintEl = document.getElementById('surname-hint');
  if (!form || !surnameInput) return;

  const blood = form.bloodStatus?.value || '纯血';
  const familyId = form.wizardFamily?.value;
  const isMuggleborn = blood === '麻瓜出身';
  const isCustom = familyId === 'custom';
  const isS28 = isSacred28FamilySelection(form);

  if (isMuggleborn || isCustom) {
    surnameInput.disabled = false;
    surnameInput.readOnly = false;
    surnameInput.placeholder = isMuggleborn ? '自拟姓氏，如：格林' : '自拟纯血姓氏，如：Rookwood';
    if (hintEl) {
      hintEl.textContent = isMuggleborn
        ? '麻瓜出身：姓氏自拟。'
        : '非神圣二十八家族：姓氏与家族名自拟。';
    }
    return;
  }

  if (familyId === 'random') {
    surnameInput.disabled = true;
    surnameInput.readOnly = true;
    surnameInput.value = resolvePlayerSurname(form);
    surnameInput.placeholder = '';
    if (hintEl) hintEl.textContent = '已随机归属神圣二十八家族，姓氏随家族（同名同院同血统结果固定）。';
    return;
  }

  if (isS28 && familyId) {
    const fam = getFamilyById(familyId);
    surnameInput.disabled = true;
    surnameInput.readOnly = true;
    surnameInput.value = fam?.label || '';
    if (hintEl) hintEl.textContent = `神圣二十八家族·${fam?.label || ''}，姓氏随家族。`;
  }
}

function bindFamilyFormEvents() {
  const form = document.getElementById('character-form');
  form?.bloodStatus?.addEventListener('change', () => {
    updateFamilyFormVisibility();
    syncPlayerSurnameField();
  });
  document.getElementById('blood-status-select')?.addEventListener('change', () => {
    updateFamilyFormVisibility();
    syncPlayerSurnameField();
  });
  form?.wizardFamily?.addEventListener('change', () => {
    updateFamilyFormVisibility();
    syncPlayerSurnameField();
  });
  form?.givenName?.addEventListener('input', syncPlayerSurnameField);
  form?.house?.addEventListener('change', syncPlayerSurnameField);
  form?.familyAutoGenerate?.addEventListener('change', () => {
    const manual = document.getElementById('family-manual-panel');
    const auto = form?.familyAutoGenerate?.checked;
    if (manual) manual.hidden = auto !== false;
  });
  document.getElementById('family-preview-btn')?.addEventListener('click', () => {
    const formEl = document.getElementById('character-form');
    if (!formEl) return;
    const family = collectFamilyFromForm(formEl);
    const preview = document.getElementById('family-preview');
    if (preview) {
      preview.textContent = formatFamilyForPrompt(family);
      preview.hidden = false;
    }
  });
}

function setElVisible(el, visible) {
  if (!el) return;
  el.hidden = !visible;
  el.style.display = visible ? '' : 'none';
}

function updateFamilyFormVisibility() {
  const form = document.getElementById('character-form');
  if (!form) return;
  const blood = form.bloodStatus?.value || form.elements?.bloodStatus?.value || '纯血';
  const wizardRow = document.getElementById('wizard-family-row');
  const sideWrap = document.getElementById('wizard-parent-side-wrap');
  const attitudeRow = document.getElementById('player-attitude-row');
  const hintEl = document.getElementById('family-section-hint');
  const isMuggleborn = blood === '麻瓜出身';
  const isHalf = blood === '混血';
  const isWizardBlood = blood === '纯血' || isHalf;

  setElVisible(wizardRow, isWizardBlood);
  setElVisible(sideWrap, isHalf);
  setElVisible(attitudeRow, isWizardBlood);

  if (hintEl) {
    if (isMuggleborn) {
      hintEl.textContent = '麻瓜出身：父母均为麻瓜；姓氏在上方自拟。不可选择神圣二十八家族。';
    } else if (isHalf) {
      hintEl.textContent = '混血：请选择巫师侧神圣二十八家族（姓氏随家族），或选「自拟」并填写姓氏。';
    } else {
      hintEl.textContent = '纯血：可选神圣二十八（姓氏随家族）或自拟纯血姓氏。';
    }
  }

  const manual = document.getElementById('family-manual-panel');
  if (manual) manual.hidden = form.familyAutoGenerate?.checked !== false;
}

function collectTalents(form) {
  const presets = [...form.querySelectorAll('input[name="talentPreset"]:checked')].map((el) => el.value);
  const customRaw = form.talentCustom?.value || '';
  const custom = customRaw.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  return [...new Set([...presets, ...custom])];
}

function updateTalentSummary() {
  const form = document.getElementById('character-form');
  const el = document.getElementById('talent-summary');
  if (!form || !el) return;
  const talents = collectTalents(form);
  el.textContent = talents.length ? `已选：${talents.join('、')}` : '已选：无';
}

function collectProfileFromForm(form) {
  const { givenName, surname, name } = resolvePlayerNameFromForm(form);
  return {
    name,
    givenName,
    surname,
    house: form.house.value,
    year: Number(form.year.value),
    bloodStatus: form.bloodStatus.value,
    appearance: form.appearance.value.trim() || applyComposedAppearanceToForm(form),
    talents: collectTalents(form),
    custom: form.custom.value,
    tone: form.tone.value,
    saveCedric: form.saveCedric?.checked ?? false,
    wand: getPendingWand(),
    family: collectFamilyFromForm(form),
  };
}

async function generateWand(useFallback = false) {
  const form = document.getElementById('character-form');
  if (!form) return;

  hideCreateError();
  const profile = collectProfileFromForm(form);
  delete profile.wand;

  const btn = document.getElementById('wand-generate-btn');
  const fallbackBtn = document.getElementById('wand-fallback-btn');
  const statusEl = document.getElementById('wand-status');
  [btn, fallbackBtn].forEach((b) => { if (b) b.disabled = true; });
  if (statusEl) statusEl.textContent = '奥利凡德正在翻找魔杖盒……';

  try {
    const res = await fetch(WAND_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        inviteCode: getInviteCode(),
        useFallback,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '魔杖生成失败');

    setPendingWand(data.wand);
    renderWandPreview(document.getElementById('wand-preview'), data.wand);
    if (statusEl) statusEl.textContent = '魔杖已选定！';
    document.getElementById('start-game-btn').disabled = false;
  } catch (err) {
    if (statusEl) statusEl.textContent = '';
    showCreateError(err.message || '魔杖生成失败，可尝试「快速生成」');
  } finally {
    [btn, fallbackBtn].forEach((b) => { if (b) b.disabled = false; });
  }
}

function buildStartMessage(profile) {
  const p = profile.name?.trim() ? profile : { ...profile, name: DEFAULT_NAME, appearance: DEFAULT_APPEARANCE };
  let msg = `开始游戏。角色信息：\n`;
  msg += `姓名：${p.name}\n学院：${p.house}\n年级：${p.year}\n`;
  msg += `血统：${p.bloodStatus}\n外貌：${p.appearance}\n`;
  if (p.family) msg += `${formatFamilyForPrompt(p.family)}\n`;
  const talents = p.talents || [];
  if (talents.length) msg += `特殊才能：${talents.join('、')}\n`;
  if (p.wand) {
    msg += `魔杖：${p.wand.wood}，${p.wand.core}，${p.wand.length}，${p.wand.flexibility}\n`;
    if (p.wand.appearance) msg += `魔杖外观：${p.wand.appearance}\n`;
    if (p.wand.affinity) msg += `魔杖相性：${p.wand.affinity}\n`;
  }
  if (p.custom) msg += `自定义：${p.custom}\n`;
  msg += `日常叙事基调：${p.tone}\n`;
  if (p.saveCedric) msg += `玩家希望在三强赛中拯救塞德里克。\n`;
  const hook = getPlaythroughHook(p.year);
  msg += `本局原著主线：${hook.label}（${hook.hint}）。须与哈利·波特同期事件对齐，哈利为剧情核心，玩家为参与者。\n`;
  return msg;
}

export function bindCharacterForm() {
  const form = document.getElementById('character-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideCreateError();
    hideError();

    if (!getPendingWand()) {
      showCreateError('请先在奥利凡德魔杖店挑选魔杖');
      return;
    }

    const blood = form.bloodStatus.value;
    const familyId = form.wizardFamily?.value;
    if ((blood === '麻瓜出身' || familyId === 'custom') && !form.surname?.value?.trim()) {
      showCreateError('请填写姓氏');
      return;
    }

    const profile = collectProfileFromForm(form);
    const gameState = createInitialState(profile);
    setGameState(gameState);
    setCurrentSlot(getCurrentSlot());
    applyHouseTheme(gameState.profile.house);
    showScreen('game-screen');
    bootstrapTurnView('猫头鹰正在送来第一页故事，请稍候……');
    renderGameUI(gameState);

    await sendTurn('开始游戏', buildStartMessage(profile));
  });
}

export function prepareNewCharacterScreen() {
  resetSession();
  renderWandPreview(document.getElementById('wand-preview'), null);
  const appearanceField = document.getElementById('player-appearance');
  if (appearanceField) appearanceField.value = '';
  clearAppearanceTraitInputs(document.getElementById('character-form'));
  updateAppearanceTraitSummary();
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) startBtn.disabled = true;
  clearSceneVisual();
}

export function bindInviteCode() {
  const input = document.getElementById('invite-code');
  const saved = getInviteCode();
  if (input && saved) input.value = saved;
  input?.addEventListener('change', () => {
    localStorage.setItem(INVITE_KEY, input.value.trim());
  });
}
