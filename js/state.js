const STORAGE_KEY = 'hogwarts-sim-save';
const SLOT_PREFIX = 'hogwarts-sim-slot-';
const MAX_SLOTS = 3;

const ROMANCE_TARGETS = ['哈利', '德拉科', '西奥多', '布雷斯', '弗雷德', '乔治', '塞德里克', '奥利弗·伍德'];

const YEAR_OFFSETS = {
  '哈利': 0,
  '德拉科': 0,
  '西奥多': 0,
  '布雷斯': 0,
  '弗雷德': 2,
  '乔治': 2,
  '塞德里克': 3,
  '奥利弗·伍德': 3,
};

const AFFECTION_STAGES = [
  { max: 20, stage: '陌生人' },
  { max: 40, stage: '有印象' },
  { max: 60, stage: '感兴趣' },
  { max: 75, stage: '暧昧' },
  { max: 90, stage: '确认关系' },
  { max: 100, stage: '热恋' },
];

export function getStageFromAffection(affection) {
  const val = Math.max(0, Math.min(100, affection));
  for (const { max, stage } of AFFECTION_STAGES) {
    if (val <= max) return stage;
  }
  return '热恋';
}

export function computeNpcYears(playerYear) {
  const years = {};
  for (const [name, offset] of Object.entries(YEAR_OFFSETS)) {
    years[name] = playerYear + offset;
  }
  return years;
}

export function createInitialRelationships() {
  const rel = {};
  for (const name of ROMANCE_TARGETS) {
    rel[name] = { stage: '陌生人', affection: 0 };
  }
  return rel;
}

export function createInitialState(profile) {
  const year = Number(profile.year);
  return {
    profile: {
      name: profile.name.trim(),
      house: profile.house,
      year,
      bloodStatus: profile.bloodStatus,
      appearance: profile.appearance.trim(),
      talent: (profile.talent || '').trim(),
      custom: (profile.custom || '').trim(),
      target: profile.target,
      tone: profile.tone,
    },
    time: { week: 1, weekday: year === 1 ? '周日' : '周一', season: '秋' },
    scene: { location: year === 1 ? '国王十字车站' : '霍格沃茨城堡', weather: '阴' },
    player: { mood: 70 },
    currentTarget: profile.target === '先不选' ? null : profile.target,
    relationships: createInitialRelationships(),
    npcYears: computeNpcYears(year),
    flags: {
      triwizardYear: year >= 4,
      triwizardRole: 'none',
      triwizardParticipant: false,
      yuleBallPartner: null,
      saveCedric: profile.saveCedric === true,
      eventsTriggered: [],
      ending: null,
    },
    summary: year === 1
      ? `${profile.name} 收到录取通知书，即将开启霍格沃茨第一年。`
      : `${profile.name}，${profile.house} ${year} 年级生，新学期开始。`,
    turnCount: 0,
    history: [],
    lastAction: null,
  };
}

export function mergeStateUpdate(state, update) {
  if (!update || typeof update !== 'object') return state;

  const next = structuredClone(state);

  if (update.time) next.time = { ...next.time, ...update.time };
  if (update.scene) next.scene = { ...next.scene, ...update.scene };
  if (update.player) next.player = { ...next.player, ...update.player };
  if (update.currentTarget !== undefined) next.currentTarget = update.currentTarget;
  if (update.summary) next.summary = update.summary;

  if (update.relationships) {
    for (const [name, rel] of Object.entries(update.relationships)) {
      if (!next.relationships[name]) next.relationships[name] = { affection: 0, stage: '陌生人' };
      if (rel.affection !== undefined) {
        next.relationships[name].affection = Math.max(0, Math.min(100, rel.affection));
        next.relationships[name].stage = getStageFromAffection(next.relationships[name].affection);
      }
      if (rel.stage) next.relationships[name].stage = rel.stage;
    }
  }

  if (update.flags) {
    next.flags = { ...next.flags, ...update.flags };
    if (update.flags.eventsTriggered) {
      next.flags.eventsTriggered = [
        ...new Set([...(next.flags.eventsTriggered || []), ...update.flags.eventsTriggered]),
      ];
    }
  }

  return next;
}

export function saveGame(state, slot = 0) {
  const key = slot === 0 ? STORAGE_KEY : `${SLOT_PREFIX}${slot}`;
  localStorage.setItem(key, JSON.stringify(state));
}

export function loadGame(slot = 0) {
  const key = slot === 0 ? STORAGE_KEY : `${SLOT_PREFIX}${slot}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function exportSave(state) {
  return JSON.stringify(state, null, 2);
}

export function importSave(jsonString) {
  const state = JSON.parse(jsonString);
  if (!state.profile || !state.relationships) {
    throw new Error('无效的存档格式');
  }
  return state;
}

export function listSaveSlots() {
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const state = loadGame(i);
    slots.push(state ? { slot: i, name: state.profile.name, week: state.time.week, turn: state.turnCount } : null);
  }
  return slots;
}

export function addHistoryEntry(state, action, narrative) {
  state.turnCount += 1;
  state.history.push({ turn: state.turnCount, action, narrative: narrative.slice(0, 500) });
  if (state.history.length > 10) state.history = state.history.slice(-10);
  state.lastAction = action;
  return state;
}

export { ROMANCE_TARGETS, MAX_SLOTS };
