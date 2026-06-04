/** 全局游戏会话状态（单页应用共享） */

let gameState = null;
let currentSlot = 0;
let lastResponse = null;
let pendingWand = null;
let careerModalDismissed = false;

export function getGameState() {
  return gameState;
}

export function setGameState(state) {
  gameState = state;
  if (state?.lastOptions) {
    lastResponse = { options: state.lastOptions };
  }
  return gameState;
}

export function getCurrentSlot() {
  return currentSlot;
}

export function setCurrentSlot(slot) {
  currentSlot = slot;
}

export function getLastResponse() {
  return lastResponse;
}

export function setLastResponse(response) {
  lastResponse = response;
  if (gameState && response?.options) {
    gameState.lastOptions = response.options;
  }
}

export function getPendingWand() {
  return pendingWand;
}

export function setPendingWand(wand) {
  pendingWand = wand;
}

export function isCareerModalDismissed() {
  return careerModalDismissed;
}

export function setCareerModalDismissed(value) {
  careerModalDismissed = value;
}

export function resetSession() {
  gameState = null;
  lastResponse = null;
  pendingWand = null;
  careerModalDismissed = false;
}
