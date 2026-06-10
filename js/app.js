import { loadGame } from './state.js';
import { applyHouseTheme, showScreen, renderNarrative, renderOptions } from './ui.js';
import { clearSceneVisual } from './scene-visuals.js';
import { setGameState } from './game-store.js';
import {
  bootstrapTurnView,
  bindGameTurnControls,
  getOptionsForState,
  handleOptionSelect,
  renderGameUI,
} from './game-controller.js';
import {
  initCharacterFormOptions,
  bindCharacterForm,
  bindNewGameControl,
  bindInviteCode,
} from './create-controller.js';
import { bindSaveControls } from './save-controller.js';

document.addEventListener('DOMContentLoaded', init);

function init() {
  initCharacterFormOptions();
  bindCharacterForm();
  bindNewGameControl();
  bindSaveControls();
  bindInviteCode();
  bindGameTurnControls();

  const saved = loadGame(0);
  if (saved) {
    setGameState(saved);
    applyHouseTheme(saved.profile.house);
    showScreen('game-screen');
    renderGameUI(saved);
    if (saved.history.length > 0) {
      const last = saved.history[saved.history.length - 1];
      renderNarrative(last.narrative || saved.lastNarrative);
    } else {
      bootstrapTurnView('读档成功。正在等待剧情，你也可以先选一项行动。');
      return;
    }
    renderOptions(getOptionsForState(), handleOptionSelect);
  } else {
    clearSceneVisual();
    showScreen('create-screen');
  }
}
