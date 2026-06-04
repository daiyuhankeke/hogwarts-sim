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
  renderFamilyPanel,
  renderTimetablePanel,
  renderEventHints,
  renderCareerPanel,
  openCareerSelectionModal,
  closeCareerSelectionModal,
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
import { formatTodayClassHint } from './timetable.js';
import { toggleAudio, isAudioEnabled, stopAmbient } from './ambient-audio.js';
import { resolveOptions, buildContextualOptions } from './contextual-options.js';
import {
  isGraduationReady,
  selectCareer,
  buildGraduationCareerOptions,
  getCareerById,
} from './career-system.js';
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

let gameState = null;
let currentSlot = 0;
let lastResponse = null;
let pendingWand = null;
let careerModalDismissed = false;

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
  bindCareerControls();
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
    } else {
      bootstrapTurnView('读档成功。正在等待剧情，你也可以先选一项行动。');
    }
    renderOptions(getOptionsForState(lastResponse?.options), handleOptionSelect);
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
  initFamilyFormOptions();
  bindFamilyFormEvents();
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
    appearance: form.appearance.value,
    talents: collectTalents(form),
    custom: form.custom.value,
    target: form.target.value,
    tone: form.tone.value,
    saveCedric: form.saveCedric?.checked ?? false,
    clubs: collectClubs(form),
    wand: pendingWand,
    family: collectFamilyFromForm(form),
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

    const blood = form.bloodStatus.value;
    const familyId = form.wizardFamily?.value;
    if ((blood === '麻瓜出身' || familyId === 'custom') && !form.surname?.value?.trim()) {
      showCreateError('请填写姓氏');
      return;
    }

    const profile = collectProfileFromForm(form);

    gameState = createInitialState(profile);
    currentSlot = 0;
    applyHouseTheme(gameState.profile.house);
    showScreen('game-screen');
    bootstrapTurnView('猫头鹰正在送来第一页故事，请稍候……');
    renderGameUI();

    await sendTurn('开始游戏', buildStartMessage(profile));
  });
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
  msg += `首要想攻略：${p.target}\n氛围偏好：${p.tone}\n`;
  if (p.saveCedric) msg += `玩家希望在三强赛中拯救塞德里克。\n`;
  const hook = getPlaythroughHook(p.year);
  msg += `本局原著主线：${hook.label}（${hook.hint}）。须与哈利·波特同期事件对齐，哈利为剧情核心，玩家为参与者。\n`;
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
      careerModalDismissed = false;
      renderWandPreview(document.getElementById('wand-preview'), null);
      const startBtn = document.getElementById('start-game-btn');
      if (startBtn) startBtn.disabled = true;
      closeCareerSelectionModal();
      clearSceneVisual();
      showScreen('create-screen');
    }
  });
}

function bindCareerControls() {
  document.getElementById('career-modal-close')?.addEventListener('click', () => {
    careerModalDismissed = true;
    closeCareerSelectionModal();
  });
  document.querySelector('.career-modal-backdrop')?.addEventListener('click', () => {
    careerModalDismissed = true;
    closeCareerSelectionModal();
  });

  const panel = document.getElementById('career-panel');
  panel?.addEventListener('click', (e) => {
    if (e.target.id === 'open-career-modal-btn' && gameState && isGraduationReady(gameState)) {
      openCareerSelectionModal(gameState, handleCareerSelect);
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
    renderOptions(getOptionsForState(lastResponse?.options), handleOptionSelect);
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
      renderOptions(getOptionsForState(), handleOptionSelect);
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
  renderCareerPanel(gameState);
  renderFamilyPanel(gameState);
  renderTimetablePanel(gameState);
  const ctx = buildEventContext(gameState);
  renderEventHints(getUpcomingEvents(gameState).map((e) => e.label), ctx.endingHint);
  document.getElementById('player-name').textContent = gameState.profile.name;
  document.getElementById('player-house').textContent = `${gameState.profile.house} · ${gameState.profile.year}年级`;
  maybeOpenCareerModal();
}

function maybeOpenCareerModal() {
  if (!gameState || !isGraduationReady(gameState) || careerModalDismissed) return;
  openCareerSelectionModal(gameState, handleCareerSelect);
}

function handleCareerSelect(careerId) {
  if (!gameState) return;
  try {
    const career = getCareerById(careerId);
    gameState = selectCareer(gameState, careerId);
    careerModalDismissed = false;
    if (gameState.progression && !gameState.progression.achievements.includes('career_chosen')) {
      gameState.progression.achievements.push('career_chosen');
    }
    saveGame(gameState, currentSlot);
    closeCareerSelectionModal();
    renderGameUI();
    renderOptions(getOptionsForState(), handleOptionSelect);
    renderNarrative(
      `🎓 ${gameState.profile.name} 从霍格沃茨毕业了。\n\n` +
      `她选择了「${career?.name || gameState.career.chosenName}」作为今后的道路。` +
      `${career ? `\n\n${career.tagline}` : ''}\n\n` +
      '选择下方行动，或直接输入自定义行动，开启毕业后的新篇章。'
    );
    hideError();
  } catch (err) {
    showError(err.message);
  }
}

async function handleOptionSelect(option, customDetail) {
  hideError();
  if (option.careerId) {
    handleCareerSelect(option.careerId);
    return;
  }
  if (option.openCareerModal && gameState && isGraduationReady(gameState)) {
    careerModalDismissed = false;
    openCareerSelectionModal(gameState, handleCareerSelect);
    return;
  }
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
  if (gameState) gameState.lastAction = userMessage;
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
    bootstrapTurnView(gameState?.history?.length
      ? gameState.history[gameState.history.length - 1].narrative
      : '连接失败，请检查网络或邀请码后点击「重试本回合」。');
  } finally {
    setLoading(false);
  }
}

function applyResponse(data, actionLabel) {
  try {
    applyResponseInner(data, actionLabel);
  } catch (err) {
    console.error('applyResponse error:', err);
    showError(`处理剧情时出错：${err.message}。可先选择下方行动，或重试本回合。`);
    if (data?.narrative) renderNarrative(data.narrative);
    renderOptions(getOptionsForState(data?.options), handleOptionSelect);
  }
}

function applyResponseInner(data, actionLabel) {
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
  renderOptions(getOptionsForState(data.options), handleOptionSelect);

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

function getOptionsForState(aiOptions) {
  if (!gameState) return buildContextualOptions(null);
  if (isGraduationReady(gameState)) {
    return buildGraduationCareerOptions(gameState);
  }
  const narrative = gameState.history?.[gameState.history.length - 1]?.narrative || '';
  const classHint = formatTodayClassHint(gameState);
  return resolveOptions(aiOptions, gameState, narrative, classHint);
}

/** 进入游戏或回合失败时，保证叙事区与选项区有内容 */
function bootstrapTurnView(narrativeHint) {
  if (narrativeHint) renderNarrative(narrativeHint);
  renderOptions(getOptionsForState(lastResponse?.options), handleOptionSelect);
}
