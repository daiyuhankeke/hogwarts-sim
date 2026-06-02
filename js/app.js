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
import { clampRelationships, buildEventContext, getUpcomingEvents, checkEnding } from './game-systems.js';
import {
  applyHouseTheme,
  renderStatusBar,
  renderNarrative,
  renderOptions,
  renderRelationships,
  renderEventHints,
  setLoading,
  showError,
  hideError,
  showScreen,
  populateSaveSlots,
} from './ui.js';

let gameState = null;
let currentSlot = 0;
let lastResponse = null;

const API_URL = '/api/chat';
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
    showScreen('create-screen');
  }
}

function bindCharacterForm() {
  const form = document.getElementById('character-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const profile = {
      name: form.name.value,
      house: form.house.value,
      year: Number(form.year.value),
      bloodStatus: form.bloodStatus.value,
      appearance: form.appearance.value,
      talent: form.talent.value,
      custom: form.custom.value,
      target: form.target.value,
      tone: form.tone.value,
      saveCedric: form.saveCedric?.checked ?? false,
    };

    if (!profile.name.trim()) {
      showError('请填写姓名');
      return;
    }

    gameState = createInitialState(profile);
    currentSlot = 0;
    applyHouseTheme(profile.house);
    showScreen('game-screen');
    renderGameUI();

    await sendTurn('开始游戏', buildStartMessage(profile));
  });
}

function buildStartMessage(profile) {
  let msg = `开始游戏。角色信息：\n`;
  msg += `姓名：${profile.name}\n学院：${profile.house}\n年级：${profile.year}\n`;
  msg += `血统：${profile.bloodStatus}\n外貌：${profile.appearance}\n`;
  if (profile.talent) msg += `特殊才能：${profile.talent}\n`;
  if (profile.custom) msg += `自定义：${profile.custom}\n`;
  msg += `首要想攻略：${profile.target}\n氛围偏好：${profile.tone}\n`;
  if (profile.saveCedric) msg += `玩家希望在三强赛中拯救塞德里克。\n`;
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
  renderStatusBar(gameState);
  renderRelationships(gameState);
  const ctx = buildEventContext(gameState);
  renderEventHints(getUpcomingEvents(gameState).map((e) => e.label), ctx.endingHint);
  document.getElementById('player-name').textContent = gameState.profile.name;
  document.getElementById('player-house').textContent = `${gameState.profile.house} · ${gameState.profile.year}年级`;
}

async function handleOptionSelect(option, customDetail) {
  hideError();
  let actionText = `${option.id}. ${option.text}`;
  if (customDetail) actionText = `F. 自定义行动：${customDetail}`;
  if (option.id === 'C' && gameState) {
    const ctx = buildEventContext(gameState);
    if (!ctx.hogsmeadeAvailable) {
      showError('霍格莫德仅周六开放（三年级及以上）');
      return;
    }
  }
  await sendTurn(actionText, actionText);
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

  if (data.stateUpdate) {
    const clamped = clampRelationships(data.stateUpdate, gameState);
    gameState = mergeStateUpdate(gameState, clamped);
  }

  if (data.ending) {
    gameState.flags.ending = data.ending;
  }

  const narrative = data.narrative || '（本回合无叙事内容）';
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
