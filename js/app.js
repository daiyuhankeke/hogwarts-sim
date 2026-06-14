import {
  initCharacterFormOptions,
  bindCharacterForm,
  bindInviteCode,
} from './create-controller.js';
import { bindSaveControls, showSaveScreen } from './save-controller.js';
import { bindGameTurnControls } from './game-controller.js';

document.addEventListener('DOMContentLoaded', init);

function init() {
  initCharacterFormOptions();
  bindCharacterForm();
  bindSaveControls();
  bindInviteCode();
  bindGameTurnControls();
  showSaveScreen();
}
