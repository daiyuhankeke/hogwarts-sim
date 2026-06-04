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
} from './game-store.js';
import {
  bootstrapTurnView,
  getOptionsForState,
  handleOptionSelect,
  renderGameUI,
} from './game-controller.js';

export function bindSaveControls() {
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
    const loaded = loadGame(slot);
    if (!loaded) {
      showError('该存档槽为空');
      return;
    }
    setGameState(loaded);
    setCurrentSlot(slot);
    applyHouseTheme(loaded.profile.house);
    showScreen('game-screen');
    renderGameUI(loaded);
    const lastHist = loaded.history[loaded.history.length - 1];
    renderNarrative(lastHist?.narrative || loaded.lastNarrative || '读档成功，请选择下一步行动。');
    renderOptions(getOptionsForState(), handleOptionSelect);
    hideError();
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
