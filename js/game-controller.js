import {
  mergeStateUpdate,
  saveGame,
  addHistoryEntry,
  narrativeForAI,
} from './state.js';
import { clampRelationships, buildEventContext, getUpcomingEvents, checkEnding } from './game-systems.js';
import {
  renderStatusBar,
  renderNarrative,
  renderOptions,
  setLoading,
  showError,
  hideError,
  showMagicGains,
  showMilestoneToast,
  openCareerSelectionModal,
  closeCareerSelectionModal,
  renderRelationships,
  renderMagicPanel,
  renderProgressPanel,
  renderCareerPanel,
  renderFamilyPanel,
  renderTimetablePanel,
  renderEventHints,
} from './ui.js';
import { applySceneVisual } from './scene-visuals.js';
import { inferMagicGains, applyInferredMagicGains } from './magic-inference.js';
import {
  isGraduationReady,
  selectCareer,
  buildGraduationCareerOptions,
  getCareerById,
} from './career-system.js';
import { detectMilestones, processAfterTurn } from './progression.js';
import { sanitizeStateUpdate } from '../lib/validateStateUpdate.js';
import {
  getGameState,
  setGameState,
  getCurrentSlot,
  getLastResponse,
  setLastResponse,
  isCareerModalDismissed,
  setCareerModalDismissed,
} from './game-store.js';

const API_URL = '/api/chat';
const INVITE_KEY = 'hogwarts-invite-code';

function getInviteCode() {
  return localStorage.getItem(INVITE_KEY) || '';
}

export function renderGameUI(gameState = getGameState(), { openCareer = true } = {}) {
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
  if (openCareer) maybeOpenCareerModal();
}

function isHogsmeadeOption(option) {
  return /霍格莫德|hogsmeade/i.test(option.text || '');
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .filter((o) => o && o.id && o.text)
    .slice(0, 6)
    .map((o) => ({ id: String(o.id).toUpperCase().slice(0, 1), text: String(o.text) }));
}

export function getOptionsForState(aiOptions) {
  const gameState = getGameState();
  if (gameState && isGraduationReady(gameState)) {
    return buildGraduationCareerOptions(gameState);
  }
  const options = aiOptions ?? getLastResponse()?.options ?? gameState?.lastOptions;
  return normalizeOptions(options);
}

export function bootstrapTurnView(narrativeHint) {
  if (narrativeHint) renderNarrative(narrativeHint);
  renderOptions(getOptionsForState(), handleOptionSelect);
}

export function maybeOpenCareerModal() {
  const gameState = getGameState();
  if (!gameState || !isGraduationReady(gameState) || isCareerModalDismissed()) return;
  openCareerSelectionModal(gameState, handleCareerSelect);
}

export function handleCareerSelect(careerId) {
  let gameState = getGameState();
  if (!gameState) return;
  try {
    const career = getCareerById(careerId);
    gameState = selectCareer(gameState, careerId);
    setCareerModalDismissed(false);
    if (gameState.progression && !gameState.progression.achievements.includes('career_chosen')) {
      gameState.progression.achievements.push('career_chosen');
    }
    setGameState(gameState);
    saveGame(gameState, getCurrentSlot());
    closeCareerSelectionModal();
    renderGameUI(gameState);
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

export async function handleOptionSelect(option, customDetail) {
  hideError();
  const gameState = getGameState();
  if (option.careerId) {
    handleCareerSelect(option.careerId);
    return;
  }
  if (option.openCareerModal && gameState && isGraduationReady(gameState)) {
    setCareerModalDismissed(false);
    openCareerSelectionModal(gameState, handleCareerSelect);
    return;
  }
  let actionText = `${option.id}. ${option.text}`;
  if (customDetail) actionText = `F. 自定义行动：${customDetail}`;

  if (gameState && isHogsmeadeOption(option)) {
    const ctx = buildEventContext(gameState);
    if (!ctx.hogsmeadeAvailable) {
      showError('霍格莫德仅周六开放（三年级及以上）');
      return;
    }
  }
  await sendTurn(actionText, actionText);
}

export async function sendTurn(actionLabel, userMessage, isRetry = false) {
  let gameState = getGameState();
  if (gameState) {
    gameState.lastAction = userMessage;
    setGameState(gameState);
  }

  setLoading(true);
  hideError();

  try {
    const eventContext = buildEventContext(gameState);
    const historyForAI = (gameState?.history || []).slice(-3).map((h) => ({
      action: h.action,
      narrative: narrativeForAI(h.narrative),
    }));

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: gameState,
        action: userMessage,
        history: historyForAI,
        eventContext,
        isRetry,
        inviteCode: getInviteCode(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `请求失败 (${res.status})`);
    }

    setLastResponse(data);
    applyResponse(data, actionLabel);
  } catch (err) {
    showError(err.message || '网络错误，请重试');
    bootstrapTurnView(
      gameState?.history?.length
        ? gameState.history[gameState.history.length - 1].narrative
        : '连接失败，请检查网络或邀请码后点击「重试本回合」。'
    );
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
  let gameState = getGameState();
  if (data.statusLine) renderStatusBar(gameState, data.statusLine);

  const stateBefore = structuredClone(gameState);
  const magicBefore = gameState?.magic ? structuredClone(gameState.magic) : null;

  if (data.stateUpdate) {
    const sanitized = sanitizeStateUpdate(data.stateUpdate);
    const clamped = clampRelationships(sanitized, gameState);
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
  if (data.options) {
    gameState.lastOptions = data.options;
  }

  setGameState(gameState);
  setLastResponse(data);
  saveGame(gameState, getCurrentSlot());

  renderGameUI(gameState);
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

export function bindGameTurnControls() {
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
    const gameState = getGameState();
    if (gameState?.lastAction) {
      sendTurn(gameState.lastAction, gameState.lastAction, true);
    }
  });
}

export function bindCareerControls() {
  document.getElementById('career-modal-close')?.addEventListener('click', () => {
    setCareerModalDismissed(true);
    closeCareerSelectionModal();
  });
  document.querySelector('.career-modal-backdrop')?.addEventListener('click', () => {
    setCareerModalDismissed(true);
    closeCareerSelectionModal();
  });

  const panel = document.getElementById('career-panel');
  panel?.addEventListener('click', (e) => {
    const gameState = getGameState();
    if (e.target.id === 'open-career-modal-btn' && gameState && isGraduationReady(gameState)) {
      openCareerSelectionModal(gameState, handleCareerSelect);
    }
  });
}
