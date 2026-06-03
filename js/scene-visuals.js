/**
 * 场景视觉 — 根据 state.scene.location 切换背景
 * 图片位于 assets/scenes/，可替换为自有 JPG/WebP
 */

const SCENE_ASSETS = 'assets/scenes';

/** 四学院公共休息室背景 */
export const HOUSE_COMMON_ROOMS = {
  '格兰芬多': {
    image: `${SCENE_ASSETS}/common-room-gryffindor.png`,
    label: '格兰芬多公共休息室',
    fx: 'fireplace',
  },
  '斯莱特林': {
    image: `${SCENE_ASSETS}/common-room-slytherin.png`,
    label: '斯莱特林公共休息室',
    fx: 'fireplace',
  },
  '拉文克劳': {
    image: `${SCENE_ASSETS}/common-room-ravenclaw.png`,
    label: '拉文克劳公共休息室',
    fx: 'none',
  },
  '赫奇帕奇': {
    image: `${SCENE_ASSETS}/common-room-hufflepuff.png`,
    label: '赫奇帕奇公共休息室',
    fx: 'fireplace',
  },
};

const HOUSE_KEYWORDS = {
  '格兰芬多': /格兰芬多|狮院|胖夫人/,
  '斯莱特林': /斯莱特林|蛇院|地窖/,
  '拉文克劳': /拉文克劳|鹰院|拉文克劳塔/,
  '赫奇帕奇': /赫奇帕奇|獾院|赫奇帕奇地下室/,
};

/** @type {{ id: string, label: string, keywords: RegExp, image: string, fx?: string }[]} */
export const SCENE_MAP = [
  {
    id: 'great_hall',
    label: '大礼堂',
    keywords: /大礼堂|礼堂|宴会厅|开学宴|分院宴|万圣节宴|年终宴/,
    image: `${SCENE_ASSETS}/great-hall.webp`,
    fx: 'candles',
  },
  {
    id: 'library',
    label: '图书馆',
    keywords: /图书馆|禁书区|平斯夫人/,
    image: `${SCENE_ASSETS}/library.png`,
    fx: 'dust',
  },
  {
    id: 'common_room',
    label: '公共休息室',
    keywords: /公共休息室|休息室|格兰芬多塔|斯莱特林地窖|拉文克劳塔|赫奇帕奇|胖夫人|狮院|蛇院|鹰院|獾院/,
    image: `${SCENE_ASSETS}/common-room-gryffindor.png`,
    fx: 'fireplace',
  },
  {
    id: 'quidditch',
    label: '魁地奇球场',
    keywords: /魁地奇|球场|训练|飞天扫帚/,
    image: `${SCENE_ASSETS}/quidditch.svg`,
    fx: 'wind',
  },
  {
    id: 'hogsmeade',
    label: '霍格莫德',
    keywords: /霍格莫德|蜂蜜公爵|三把扫帚|佐科|尖叫棚屋/,
    image: `${SCENE_ASSETS}/hogsmeade.png`,
    fx: 'snow',
  },
  {
    id: 'train',
    label: '霍格沃茨特快',
    keywords: /火车|特快|9又3\/4|九又四分之三|国王十字|站台/,
    image: `${SCENE_ASSETS}/train.png`,
    fx: 'steam',
  },
  {
    id: 'dungeon',
    label: '地牢',
    keywords: /地牢|魔药|地窖|斯内普|魔药课/,
    image: `${SCENE_ASSETS}/dungeon.svg`,
    fx: 'fog',
  },
  {
    id: 'grounds',
    label: '城堡场地',
    keywords: /禁林|黑湖|场地|海格|小屋|温室|草药|魁地奇杯/,
    image: `${SCENE_ASSETS}/grounds.svg`,
    fx: 'none',
  },
  {
    id: 'castle',
    label: '霍格沃茨',
    keywords: /霍格沃茨|城堡|走廊|楼梯|教室|变形|魔咒|占卜|黑魔法防御|天文塔|有求必应/,
    image: `${SCENE_ASSETS}/castle.jpg`,
    fx: 'none',
  },
];

const DEFAULT_SCENE = {
  id: 'castle',
  label: '霍格沃茨',
  image: `${SCENE_ASSETS}/castle.jpg`,
  fx: 'none',
};

export function resolveSceneVisual(location = '', season = '', weather = '', house = '') {
  const text = `${location} ${season} ${weather}`;
  for (const scene of SCENE_MAP) {
    if (scene.keywords.test(text)) {
      if (scene.id === 'common_room') {
        return resolveCommonRoomVisual(text, house);
      }
      return scene;
    }
  }
  if (location.trim()) {
    return { ...DEFAULT_SCENE, label: location };
  }
  return DEFAULT_SCENE;
}

function resolveCommonRoomVisual(text, house = '') {
  let resolvedHouse = house;
  for (const [name, pattern] of Object.entries(HOUSE_KEYWORDS)) {
    if (pattern.test(text)) {
      resolvedHouse = name;
      break;
    }
  }
  const room = HOUSE_COMMON_ROOMS[resolvedHouse] || HOUSE_COMMON_ROOMS['格兰芬多'];
  return {
    id: 'common_room',
    label: room.label,
    image: room.image,
    fx: room.fx,
    house: resolvedHouse || house,
  };
}

let lastSceneKey = null;

export function applySceneVisual(state) {
  const backdrop = document.getElementById('scene-backdrop');
  const labelEl = document.getElementById('scene-label');
  if (!backdrop) return;

  const location = state?.scene?.location ?? '';
  const season = state?.time?.season ?? '';
  const weather = state?.scene?.weather ?? '';
  const house = state?.profile?.house ?? '';
  const visual = resolveSceneVisual(location, season, weather, house);
  const sceneKey = `${visual.id}:${visual.image}`;

  if (sceneKey === lastSceneKey && backdrop.dataset.loaded === '1') {
    if (labelEl) labelEl.textContent = visual.label;
    return;
  }

  lastSceneKey = sceneKey;
  backdrop.className = `scene-backdrop scene-${visual.id}${visual.fx && visual.fx !== 'none' ? ` fx-${visual.fx}` : ''}`;
  backdrop.dataset.scene = visual.id;
  if (visual.id === 'common_room') {
    backdrop.dataset.house = visual.house || house || '';
  } else {
    delete backdrop.dataset.house;
  }

  const imgEl = backdrop.querySelector('.scene-backdrop-image');
  if (imgEl) {
    backdrop.dataset.loaded = '0';
    imgEl.style.opacity = '0';
    const img = new Image();
    img.onload = () => {
      imgEl.style.backgroundImage = `url("${visual.image}")`;
      requestAnimationFrame(() => {
        imgEl.style.opacity = '1';
        backdrop.dataset.loaded = '1';
      });
    };
    img.onerror = () => {
      imgEl.style.backgroundImage = '';
      backdrop.classList.add('scene-fallback');
      backdrop.dataset.loaded = '1';
    };
    img.src = visual.image;
  }

  if (labelEl) labelEl.textContent = visual.label;

  document.body.dataset.weather = weather === '雨' || weather === '雪' ? weather : '';
  document.body.dataset.season = season || '';
  document.body.dataset.house = state?.profile?.house || '';

  import('./ambient-audio.js').then(({ playAmbientForScene }) => {
    playAmbientForScene(visual.id);
  }).catch(() => {});
}

export function clearSceneVisual() {
  lastSceneKey = null;
  const backdrop = document.getElementById('scene-backdrop');
  if (backdrop) {
    backdrop.className = 'scene-backdrop scene-none';
    backdrop.dataset.loaded = '0';
    const imgEl = backdrop.querySelector('.scene-backdrop-image');
    if (imgEl) {
      imgEl.style.backgroundImage = '';
      imgEl.style.opacity = '0';
    }
  }
  document.body.dataset.weather = '';
  document.body.dataset.house = '';
  import('./ambient-audio.js').then(({ stopAmbient }) => stopAmbient()).catch(() => {});
}
