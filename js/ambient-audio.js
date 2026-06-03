/** 场景环境音 — 可选 assets/audio/*.mp3，无文件则静默 */

const SCENE_SOUNDS = {
  great_hall: 'assets/audio/great-hall.mp3',
  library: 'assets/audio/library.mp3',
  common_room: 'assets/audio/common-room.mp3',
  quidditch: 'assets/audio/quidditch.mp3',
  train: 'assets/audio/train.mp3',
  castle: 'assets/audio/castle.mp3',
  dungeon: 'assets/audio/dungeon.mp3',
  hogsmeade: 'assets/audio/hogsmeade.mp3',
  grounds: 'assets/audio/outdoor.mp3',
};

let audioEl = null;
let enabled = localStorage.getItem('hogwarts-audio') !== 'off';
let currentScene = null;

export function isAudioEnabled() {
  return enabled;
}

export function setAudioEnabled(on) {
  enabled = on;
  localStorage.setItem('hogwarts-audio', on ? 'on' : 'off');
  if (!on) stopAmbient();
}

export function toggleAudio() {
  setAudioEnabled(!enabled);
  return enabled;
}

export function playAmbientForScene(sceneId) {
  if (!enabled || !sceneId || sceneId === 'none') {
    stopAmbient();
    return;
  }
  if (sceneId === currentScene && audioEl && !audioEl.paused) return;

  const src = SCENE_SOUNDS[sceneId];
  if (!src) {
    stopAmbient();
    return;
  }

  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.volume = 0.25;
  }

  const test = new Audio();
  test.src = src;
  test.addEventListener('canplaythrough', () => {
    if (!enabled) return;
    audioEl.src = src;
    audioEl.play().catch(() => {});
    currentScene = sceneId;
  }, { once: true });
  test.addEventListener('error', () => {}, { once: true });
  test.load();
}

export function stopAmbient() {
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
  currentScene = null;
}
