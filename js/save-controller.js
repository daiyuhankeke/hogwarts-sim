import {
  saveGame,
  loadGame,
  exportSave,
  importSave,
  listSaveSlots,
  MAX_SLOTS,
} from './state.js';
import {
  populateSaveSlots,
  renderSaveScreen,
  showScreen,
  renderNarrative,
  renderOptions,
  applyHouseTheme,
  hideError,
  showError,
} from './ui.js';
import { clearSceneVisual } from './scene-visuals.js';
import {
  getGameState,
  setGameState,
  getCurrentSlot,
  setCurrentSlot,
  resetSession,
} from './game-store.js';
import {
  bootstrapTurnView,
  getOptionsForState,
  handleOptionSelect,
  renderGameUI,
} from './game-controller.js';
import { prepareNewCharacterScreen } from './create-controller.js';

export function showSaveScreen() {
  clearSceneVisual();
  resetSession();
  renderSaveScreen(listSaveSlots());
  populateSaveSlots(listSaveSlots());
  showScreen('save-screen');
}

export function loadGameFromSlot(slot) {
  const loaded = loadGame(slot);
  if (!loaded) return false;

  setGameState(loaded);
  setCurrentSlot(slot);
  applyHouseTheme(loaded.profile.house);
  showScreen('game-screen');
  renderGameUI(loaded);

  const lastHist = loaded.history[loaded.history.length - 1];
  const narrative = lastHist?.narrative || loaded.lastNarrative;
  if (narrative) {
    renderNarrative(narrative);
    renderOptions(getOptionsForState(), handleOptionSelect);
  } else {
    bootstrapTurnView('读档成功。正在等待剧情，你也可以先选一项行动。');
  }
  hideError();
  return true;
}

function beginNewGameInSlot(slot) {
  const existing = loadGame(slot);
  if (existing && !confirm(`存档槽 ${slot + 1} 已有进度（${existing.profile.name}），确定覆盖并开始新游戏？`)) {
    return;
  }
  setCurrentSlot(slot);
  prepareNewCharacterScreen();
  showScreen('create-screen');
}

function bindSaveScreenControls() {
  document.getElementById('save-slot-list')?.addEventListener('click', (e) => {
    const continueBtn = e.target.closest('.save-continue-btn');
    const newBtn = e.target.closest('.save-new-btn');
    if (continueBtn) {
      const slot = Number(continueBtn.dataset.slot);
      if (!loadGameFromSlot(slot)) showError('该存档槽为空');
      return;
    }
    if (newBtn) beginNewGameInSlot(Number(newBtn.dataset.slot));
  });

  document.getElementById('save-screen-import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });
}

export function bindSaveControls() {
  bindSaveScreenControls();

  document.getElementById('new-game-btn')?.addEventListener('click', () => {
    if (confirm('返回存档选择？未保存的进度将丢失。')) {
      showSaveScreen();
    }
  });

  document.getElementById('save-btn')?.addEventListener('click', () => {
    const gameState = getGameState();
    if (!gameState) return;
    const slot = Number(document.getElementById('save-slot-select')?.value ?? 0);
    saveGame(gameState, slot);
    setCurrentSlot(slot);
    populateSaveSlots(listSaveSlots());
    alert(`已保存到槽${slot + 1}`);
  });

  document.getElementById('load-btn')?.addEventListener('click', () => {
    const slot = Number(document.getElementById('save-slot-select')?.value ?? 0);
    if (!loadGameFromSlot(slot)) showError('该存档槽为空');
  });

  document.getElementById('export-btn')?.addEventListener('click', () => {
    const gameState = getGameState();
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
      const imported = importSave(text);
      setGameState(imported);
      saveGame(imported, getCurrentSlot());
      applyHouseTheme(imported.profile.house);
      showScreen('game-screen');
      renderGameUI(imported);
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

export { MAX_SLOTS };
