import {
  createInitialState,
  mergeStateUpdate,
  saveGame,
  loadGame,
  exportSave,
  importSave,
  listSaveSlots,
  addHistoryEntry,
  MAX_SLOTS,
} from './state.js';
import {
  DEFAULT_NAME,
  DEFAULT_APPEARANCE,
  TALENT_PRESETS,
  TARGET_GROUPS,
} from './character-config.js';
import { CLUB_OPTIONS, MAX_CLUBS, detectMilestones, getPlaythroughHook, getClubNames, processAfterTurn } from './progression.js';
import { clampRelationships, buildEventContext, getUpcomingEvents, checkEnding } from './game-systems.js';
import {
  applyHouseTheme,
  renderStatusBar,
  renderNarrative,
  renderOptions,
  renderRelationships,
  renderMagicPanel,
  renderProgressPanel,
  renderEventHints,
  setLoading,
  showError,
  hideError,
  showScreen,
  populateSaveSlots,
  showMagicGains,
  showMilestoneToast,
} from './ui.js';
import { renderWandPreview } from './wand-ui.js';
import { applySceneVisual, clearSceneVisual } from './scene-visuals.js';
import { inferMagicGains, applyInferredMagicGains } from './magic-inference.js';
import { toggleAudio, isAudioEnabled, stopAmbient } from './ambient-audio.js';

let gameState = null;
let currentSlot = 0;
let lastResponse = null;
let pendingWand = null;

const API_URL = '/api/chat';
const WAND_API_URL = '/api/wand';
const INVITE_KEY = 'hogwarts-invite-code';

function getInviteCode() {
  return localStorage.getItem(INVITE_KEY) || '';
}

document.addEventListener('DOMContentLoaded', init);

function init() {
  bindCharacterForm();
  bindGameControls();
  bindSaveControls();
  bindInviteCode();
  initCharacterFormOptions();

  const saved = loadGame(0);
  if (saved) {
    gameState = saved;
    applyHouseTheme(gameState.profile.house);
    showScreen('game-screen');
    renderGameUI();
    if (gameState.history.length > 0) {
      const last = gameState.history[gameState.history.length - 1];
      renderNarrative(last.narrative);
      renderOptions(getDefaultOptions(), handleOptionSelect);
    }
  } else {
    clearSceneVisual();
    showScreen('create-screen');
  }
}

function initCharacterFormOptions() {
  const talentContainer = document.getElementById('talent-presets');
  if (talentContainer) {
    talentContainer.innerHTML = TALENT_PRESETS.map(
      (t) =>
        `<label class="talent-chip"><input type="checkbox" name="talentPreset" value="${t}"><span>${t}</span></label>`
    ).join('');
    talentContainer.addEventListener('change', updateTalentSummary);
    document.querySelector('input[name="talentCustom"]')?.addEventListener('input', updateTalentSummary);
  }

  const targetSelect = document.getElementById('target-select');
  if (targetSelect) {
    targetSelect.innerHTML = '';
    for (const group of TARGET_GROUPS) {
      const og = document.createElement('optgroup');
      og.label = group.label;
      for (const name of group.options) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        og.appendChild(opt);
      }
      targetSelect.appendChild(og);
    }
    targetSelect.value = '先不选';
  }

  document.getElementById('wand-generate-btn')?.addEventListener('click', () => generateWand(false));
  document.getElementById('wand-generate-image-btn')?.addEventListener('click', () => generateWand(true));
  document.getElementById('wand-fallback-btn')?.addEventListener('click', () => generateWand(false, true));

  const clubContainer = document.getElementById('club-presets');
  if (clubContainer) {
    clubContainer.innerHTML = CLUB_OPTIONS.map(
      (c) =>
        `<label class="talent-chip" title="${c.desc}"><input type="checkbox" name="clubPreset" value="${c.id}"><span>${c.name}</span></label>`
    ).join('');
    clubContainer.addEventListener('change', limitClubSelection);
  }

  document.getElementById('audio-toggle-btn')?.addEventListener('click', () => {
    const on = toggleAudio();
    const btn = document.getElementById('audio-toggle-btn');
    if (btn) btn.textContent = on ? '🔊 环境音' : '🔇 环境音';
    if (on && gameState) applySceneVisual(gameState);
    else stopAmbient();
  });
  updateAudioButton();
}

function limitClubSelection(e) {
  const checked = [...document.querySelectorAll('input[name="clubPreset"]:checked')];
  if (checked.length > MAX_CLUBS) {
    e.target.checked = false;
    showCreateError(`最多选择 ${MAX_CLUBS} 个社团`);
  }
}

function collectClubs(form) {
  return [...form.querySelectorAll('input[name="clubPreset"]:checked')].map((el) => el.value).slice(0, MAX_CLUBS);
}

function updateAudioButton() {
  const btn = document.getElementById('audio-toggle-btn');
  if (btn) btn.textContent = isAudioEnabled() ? '🔊 环境音' : '🔇 环境音';
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
  return {
    name: form.name.value,
    house: form.house.value,
    year: Number(form.year.value),
    bloodStatus: form.bloodStatus.value,
    appearance: form.appearance.value,
    talents: collectTalents(form),
    custom: form.custom.value,
    target: form.target.value,
    tone: form.tone.value,
    saveCedric: form.saveCedric?.checked ?? false,
    clubs: collectClubs(form),
    wand: pendingWand,
  };
}

async function generateWand(withImage = false, useFallback = false) {
  const form = document.getElementById('character-form');
  if (!form) return;

  hideCreateError();
  const profile = collectProfileFromForm(form);
  delete profile.wand;

  const btn = document.getElementById('wand-generate-btn');
  const imgBtn = document.getElementById('wand-generate-image-btn');
  const fallbackBtn = document.getElementById('wand-fallback-btn');
  const statusEl = document.getElementById('wand-status');
  [btn, imgBtn, fallbackBtn].forEach((b) => { if (b) b.disabled = true; });
  if (statusEl) statusEl.textContent = '奥利凡德正在翻找魔杖盒……';

  try {
    const res = await fetch(WAND_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        inviteCode: getInviteCode(),
        withImage,
        useFallback,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '魔杖生成失败');

    pendingWand = data.wand;
    renderWandPreview(document.getElementById('wand-preview'), pendingWand);
    if (statusEl) statusEl.textContent = '魔杖已选定！';
    document.getElementById('start-game-btn').disabled = false;
  } catch (err) {
    if (statusEl) statusEl.textContent = '';
    showCreateError(err.message || '魔杖生成失败，可尝试「快速生成」');
  } finally {
    [btn, imgBtn, fallbackBtn].forEach((b) => { if (b) b.disabled = false; });
  }
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

function bindCharacterForm() {
  const form = document.getElementById('character-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideCreateError();
    hideError();

    if (!pendingWand) {
      showCreateError('请先在奥利凡德魔杖店挑选魔杖');
      return;
    }

    const profile = collectProfileFromForm(form);

    gameState = createInitialState(profile);
    currentSlot = 0;
    applyHouseTheme(gameState.profile.house);
    showScreen('game-screen');
    renderGameUI();

    await sendTurn('开始游戏', buildStartMessage(profile));
  });
}

function buildStartMessage(profile) {
  const p = profile.name?.trim() ? profile : { ...profile, name: DEFAULT_NAME, appearance: DEFAULT_APPEARANCE };
  let msg = `开始游戏。角色信息：\n`;
  msg += `姓名：${p.name}\n学院：${p.house}\n年级：${p.year}\n`;
  msg += `血统：${p.bloodStatus}\n外貌：${p.appearance}\n`;
  const talents = p.talents || [];
  if (talents.length) msg += `特殊才能：${talents.join('、')}\n`;
  if (p.wand) {
    msg += `魔杖：${p.wand.wood}，${p.wand.core}，${p.wand.length}，${p.wand.flexibility}\n`;
    if (p.wand.appearance) msg += `魔杖外观：${p.wand.appearance}\n`;
    if (p.wand.affinity) msg += `魔杖相性：${p.wand.affinity}\n`;
  }
  if (p.custom) msg += `自定义：${p.custom}\n`;
  msg += `首要想攻略：${p.target}\n氛围偏好：${p.tone}\n`;
  if (p.saveCedric) msg += `玩家希望在三强赛中拯救塞德里克。\n`;
  const hook = getPlaythroughHook(p.year);
  msg += `本局主线：${hook.label}（${hook.hint}）\n`;
  const clubs = getClubNames(p.clubs || []);
  if (clubs.length) msg += `参加社团：${clubs.join('、')}\n`;
  return msg;
}

function bindGameControls() {
  document.getElementById('custom-submit')?.addEventListener('click', () => {
    const input = document.getElementById('custom-action');
    const text = input?.value.trim();
    if (!text) {
      showError('请输入自定义行动');
      return;
    }
    input.value = '';
    handleOptionSelect({ id: 'F', text: `自定义：${text}` }, text);
  });

  document.getElementById('retry-btn')?.addEventListener('click', () => {
    if (gameState?.lastAction) {
      sendTurn(gameState.lastAction, gameState.lastAction, true);
    }
  });

  document.getElementById('new-game-btn')?.addEventListener('click', () => {
    if (confirm('开始新游戏？未保存的进度将丢失。')) {
      gameState = null;
      pendingWand = null;
      renderWandPreview(document.getElementById('wand-preview'), null);
      const startBtn = document.getElementById('start-game-btn');
      if (startBtn) startBtn.disabled = true;
      clearSceneVisual();
      showScreen('create-screen');
    }
  });
}

function bindSaveControls() {
  document.getElementById('save-btn')?.addEventListener('click', () => {
    if (!gameState) return;
    const slot = Number(document.getElementById('save-slot-select')?.value ?? 0);
    saveGame(gameState, slot);
    currentSlot = slot;
    populateSaveSlots(listSaveSlots());
    alert(`已保存到槽${slot + 1}`);
  });

  document.getElementById('load-btn')?.addEventListener('click', () => {
    const slot = Number(document.getElementById('save-slot-select')?.value ?? 0);
    const loaded = loadGame(slot);
    if (!loaded) {
      showError('该存档槽为空');
      return;
    }
    gameState = loaded;
    currentSlot = slot;
    applyHouseTheme(gameState.profile.house);
    showScreen('game-screen');
    renderGameUI();
    const lastHist = gameState.history[gameState.history.length - 1];
    renderNarrative(lastHist?.narrative || '读档成功，请选择下一步行动。');
    renderOptions(lastResponse?.options || getDefaultOptions(), handleOptionSelect);
    hideError();
  });

  document.getElementById('export-btn')?.addEventListener('click', () => {
    if (!gameState) return;
    const blob = new Blob([exportSave(gameState)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hogwarts-${gameState.profile.name}-w${gameState.time.week}.json`;
    a.click();
  });

  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });

  document.getElementById('import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      gameState = importSave(text);
      applyHouseTheme(gameState.profile.house);
      saveGame(gameState, currentSlot);
      showScreen('game-screen');
      renderGameUI();
      renderNarrative('存档导入成功。');
      renderOptions(getDefaultOptions(), handleOptionSelect);
      hideError();
    } catch (err) {
      showError('导入失败：' + err.message);
    }
    e.target.value = '';
  });

  populateSaveSlots(listSaveSlots());
}

function renderGameUI() {
  if (!gameState) return;
  applySceneVisual(gameState);
  renderStatusBar(gameState);
  renderRelationships(gameState);
  renderMagicPanel(gameState);
  renderProgressPanel(gameState);
  const ctx = buildEventContext(gameState);
  renderEventHints(getUpcomingEvents(gameState).map((e) => e.label), ctx.endingHint);
  document.getElementById('player-name').textContent = gameState.profile.name;
  document.getElementById('player-house').textContent = `${gameState.profile.house} · ${gameState.profile.year}年级`;
}

async function handleOptionSelect(option, customDetail) {
  hideError();
  let actionText = `${option.id}. ${option.text}`;
  if (customDetail) actionText = `F. 自定义行动：${customDetail}`;

  // 仅当选项内容明确是霍格莫德时才校验（不能按字母 C 硬编码，AI 每回合选项文案会变）
  if (gameState && isHogsmeadeOption(option)) {
    const ctx = buildEventContext(gameState);
    if (!ctx.hogsmeadeAvailable) {
      showError('霍格莫德仅周六开放（三年级及以上）');
      return;
    }
  }
  await sendTurn(actionText, actionText);
}

function isHogsmeadeOption(option) {
  return /霍格莫德|hogsmeade/i.test(option.text || '');
}

async function sendTurn(actionLabel, userMessage, isRetry = false) {
  setLoading(true);
  hideError();

  try {
    const eventContext = buildEventContext(gameState);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: gameState,
        action: userMessage,
        history: gameState.history.slice(-3),
        eventContext,
        isRetry,
        inviteCode: getInviteCode(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `请求失败 (${res.status})`);
    }

    lastResponse = data;
    applyResponse(data, actionLabel);
  } catch (err) {
    showError(err.message || '网络错误，请重试');
    renderOptions(lastResponse?.options || getDefaultOptions(), handleOptionSelect);
  } finally {
    setLoading(false);
  }
}

function applyResponse(data, actionLabel) {
  if (data.statusLine) renderStatusBar(gameState, data.statusLine);

  const stateBefore = structuredClone(gameState);
  const magicBefore = gameState?.magic ? structuredClone(gameState.magic) : null;

  if (data.stateUpdate) {
    const clamped = clampRelationships(data.stateUpdate, gameState);
    gameState = mergeStateUpdate(gameState, clamped);
  }

  if (data.ending) {
    gameState.flags.ending = data.ending;
  }

  const narrative = data.narrative || '（本回合无叙事内容）';

  if (magicBefore && gameState.magic) {
    const gains = inferMagicGains(narrative, actionLabel, magicBefore, gameState.magic);
    if (gains.length) {
      const { magic, applied } = applyInferredMagicGains(gameState.magic, gains);
      gameState.magic = magic;
      showMagicGains(applied);
    }
  }

  const milestones = detectMilestones(stateBefore.relationships || {}, gameState.relationships || {});
  gameState.progression = processAfterTurn(gameState, stateBefore, narrative);
  if (milestones.length) showMilestoneToast(milestones);

  gameState = addHistoryEntry(gameState, actionLabel, narrative);

  saveGame(gameState, currentSlot);
  renderGameUI();
  renderNarrative(narrative);
  renderOptions(data.options || getDefaultOptions(), handleOptionSelect);

  const ending = checkEnding(gameState);
  if (data.ending || ending?.type) {
    showEndingBanner(data.ending || ending.type, data.endingLabel || ending.label);
  }
}

function showEndingBanner(type, label) {
  const el = document.getElementById('ending-banner');
  if (!el) return;
  el.hidden = false;
  el.textContent = `🎓 结局：${label || type}`;
}

function bindInviteCode() {
  const input = document.getElementById('invite-code');
  const saved = getInviteCode();
  if (input && saved) input.value = saved;
  input?.addEventListener('change', () => {
    localStorage.setItem(INVITE_KEY, input.value.trim());
  });
}

function getDefaultOptions() {
  return [
    { id: 'A', text: '去图书馆复习（可能遇到某男主）' },
    { id: 'B', text: '去公共休息室休息（可能触发闲聊）' },
    { id: 'C', text: '去霍格莫德（周六限定）' },
    { id: 'D', text: '去魁地奇球场看训练' },
    { id: 'E', text: '去上课（魔药/变形/魔咒/占卜/神奇生物）' },
    { id: 'F', text: '自定义行动' },
  ];
}
