import {
  mergeStateUpdate,
  saveGame,
  addHistoryEntry,
  narrativeForAI,
} from './state.js';
import { clampRelationships, buildEventContext, getUpcomingEvents } from './game-systems.js';
import {
  renderStatusBar,
  renderNarrative,
  renderOptions,
  setLoading,
  showError,
  hideError,
  showMagicGains,
  renderRelationships,
  renderMagicPanel,
  renderProgressPanel,
  renderFamilyPanel,
  renderTimetablePanel,
  renderEventHints,
} from './ui.js';
import { applySceneVisual } from './scene-visuals.js';
import { inferMagicGains, applyInferredMagicGains } from './magic-inference.js';
import { processAfterTurn } from './progression.js';
import { applyTimeAfterTurn, migrateTime } from './time-system.js';
import { capClockToSchedule } from './schedule-context.js';
import { sanitizeStateUpdate } from '../lib/validateStateUpdate.js';
import {
  getGameState,
  setGameState,
  getCurrentSlot,
  getLastResponse,
  setLastResponse,
} from './game-store.js';

const API_URL = '/api/chat';
const INVITE_KEY = 'hogwarts-invite-code';

function getInviteCode() {
  return localStorage.getItem(INVITE_KEY) || '';
}

export function renderGameUI(gameState = getGameState()) {
  if (!gameState) return;
  applySceneVisual(gameState);
  renderStatusBar(gameState);
  renderRelationships(gameState);
  renderMagicPanel(gameState);
  renderProgressPanel(gameState);
  renderFamilyPanel(gameState);
  renderTimetablePanel(gameState);
  const ctx = buildEventContext(gameState);
  renderEventHints(getUpcomingEvents(gameState).map((e) => e.label));
  document.getElementById('player-name').textContent = gameState.profile.name;
  document.getElementById('player-house').textContent = `${gameState.profile.house} · ${gameState.profile.year}年级`;
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
  const options = aiOptions ?? getLastResponse()?.options ?? gameState?.lastOptions;
  return normalizeOptions(options);
}

export function bootstrapTurnView(narrativeHint) {
  if (narrativeHint) renderNarrative(narrativeHint);
  renderOptions(getOptionsForState(), handleOptionSelect);
}

export async function handleOptionSelect(option, customDetail) {
  hideError();
  const gameState = getGameState();
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
  let aiTimeUpdate = null;

  if (data.stateUpdate) {
    const sanitized = sanitizeStateUpdate(data.stateUpdate);
    if (sanitized.currentTarget !== undefined) delete sanitized.currentTarget;
    const clamped = clampRelationships(sanitized, gameState);
    aiTimeUpdate = clamped.time;
    gameState = mergeStateUpdate(gameState, clamped);
  }

  gameState.time = applyTimeAfterTurn(
    gameState.time,
    aiTimeUpdate,
    gameState,
    { actionLabel, narrative: data.narrative || '' }
  );
  gameState.time = {
    ...gameState.time,
    clock: capClockToSchedule(gameState.time.clock, gameState, {
      actionLabel,
      narrative: data.narrative || '',
    }),
  };
  gameState.time = migrateTime({ ...gameState, time: gameState.time });

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

  gameState.progression = processAfterTurn(gameState, stateBefore, narrative);

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

  if (data.ending) {
    showEndingBanner(data.ending, data.endingLabel);
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
