import {
  ROMANCE_TARGETS,
  YEAR_OFFSETS,
  computeNpcYears,
  normalizeProfile,
  HOUSES,
} from './character-config.js';
import { createInitialMagic, migrateMagic, mergeMagicUpdate } from './magic-system.js';
import { createFallbackWand } from './wand-system.js';
import { createInitialProgression, migrateProgression, mergeProgressionUpdate, processAfterTurn } from './progression.js';
import { createTimetable, migrateTimetable, mergeTimetableUpdate } from './timetable.js';
import { migrateCanonPlot, mergeCanonPlotUpdate } from './canonical-storyline.js';
import { migrateTime } from './time-system.js';
import { migrateGameWeek } from './calendar-config.js';
import { enrichFamilyMetadata } from './family-background.js';
import { resolveDefaultOrigin } from './character-lore.js';

const STORAGE_KEY = 'hogwarts-sim-save';
const SLOT_PREFIX = 'hogwarts-sim-slot-';
const MAX_SLOTS = 3;
const MAX_HISTORY = 10;
/** 发给 AI 的历史 narrative 截断上限（存档保留完整 narrative） */
const HISTORY_AI_NARRATIVE_LIMIT = 1500;

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

export function createInitialRelationships() {
  const rel = {};
  for (const name of ROMANCE_TARGETS) {
    rel[name] = { stage: '陌生人', affection: 0 };
  }
  return rel;
}

/** 旧存档兼容：补全新增攻略对象 */
export function migrateRelationships(relationships) {
  const rel = { ...relationships };
  for (const name of ROMANCE_TARGETS) {
    if (!rel[name]) rel[name] = { stage: '陌生人', affection: 0 };
  }
  return rel;
}

/** 旧存档兼容：移除已废弃的 player.mood */
function stripLegacyPlayerFields(state) {
  if (!state?.player || state.player.mood === undefined) return;
  const { mood, ...rest } = state.player;
  state.player = rest;
}

/** 统一存档/导入后的状态迁移与补全 */
export function normalizeLoadedState(state) {
  if (!state?.profile) return state;

  stripLegacyPlayerFields(state);

  if (state.profile?.target === '双子夹心') {
    state.profile.target = '先不选';
  }
  state.currentTarget = null;

  if (state.relationships) state.relationships = migrateRelationships(state.relationships);
  if (state.profile?.year) {
    state.npcYears = { ...computeNpcYears(state.profile.year), ...(state.npcYears || {}) };
  }
  if (state.profile?.talent && !state.profile.talents) {
    state.profile.talents = state.profile.talent.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  }
  state.magic = migrateMagic(state);
  state.progression = migrateProgression(state);
  state.timetable = migrateTimetable(state);
  state.time = migrateTime(state);
  if (!state.flags) state.flags = {};
  state.flags.canonPlot = migrateCanonPlot(state);
  if (!state.profile.wand && state.profile.name) {
    state.profile.wand = createFallbackWand(state.profile);
  }
  if (state.profile && !state.profile.family?.summary) {
    state.profile = normalizeProfile(state.profile);
  }
  if (state.profile?.family) {
    state.profile.family = enrichFamilyMetadata(state.profile.family);
  }
  if (state.profile && !state.profile.originBackground) {
    state.profile.originBackground = state.profile.family?.originBackground
      || resolveDefaultOrigin(state.profile.bloodStatus);
  }
  if (state.profile && !state.profile.storyPath) {
    state.profile.storyPath = 'everyday';
  }
  if (state.profile?.year === 1 && state.profile.house === undefined) {
    state.profile.house = null;
  }
  if (state.profile?.year > 1 && !state.profile.house) {
    state.profile.house = '格兰芬多';
  }
  delete state.career;
  if (state.flags?.graduated !== undefined) delete state.flags.graduated;

  const lastHist = state.history?.[state.history.length - 1];
  if (!state.lastNarrative && lastHist?.narrative) {
    state.lastNarrative = lastHist.narrative;
  }
  if (!Array.isArray(state.lastOptions)) {
    state.lastOptions = null;
  }

  return state;
}

export function createInitialState(rawProfile) {
  const profile = normalizeProfile(rawProfile);
  const year = profile.year;

  return {
    profile,
    time: {
      week: 1,
      weekday: year === 1 ? '周日' : '周一',
      season: '秋',
      clock: year === 1 ? '10:30' : '07:45',
    },
    scene: { location: year === 1 ? '国王十字车站' : '霍格沃茨城堡', weather: '阴' },
    player: {},
    currentTarget: null,
    relationships: createInitialRelationships(),
    npcYears: computeNpcYears(year),
    flags: {
      triwizardYear: year >= 4,
      triwizardRole: 'none',
      triwizardParticipant: false,
      yuleBallPartner: null,
      saveCedric: profile.saveCedric === true,
      houseSorted: !!profile.house,
      eventsTriggered: [],
      ending: null,
      canonPlot: migrateCanonPlot({ profile, flags: {} }),
    },
    summary: year === 1
      ? `${profile.name} 收到录取通知书，即将开启霍格沃茨第一年。`
      : `${profile.name}，${profile.house} ${year} 年级生，新学期开始。`,
    turnCount: 0,
    history: [],
    lastAction: null,
    lastNarrative: null,
    lastOptions: null,
    magic: createInitialMagic(profile),
    progression: createInitialProgression(profile),
    timetable: createTimetable(profile),
  };
}

export function mergeStateUpdate(state, update) {
  if (!update || typeof update !== 'object') return state;

  const next = structuredClone(state);

  if (update.time) next.time = migrateTime({ ...next, time: { ...next.time, ...update.time } });
  if (update.scene) next.scene = { ...next.scene, ...update.scene };
  if (update.summary) next.summary = update.summary;

  if (update.relationships) {
    next.relationships = migrateRelationships(next.relationships);
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
    const { canonPlot: canonPlotUpdate, ...restFlags } = update.flags;
    next.flags = { ...next.flags, ...restFlags };
    if (update.flags.eventsTriggered) {
      next.flags.eventsTriggered = [
        ...new Set([...(next.flags.eventsTriggered || []), ...update.flags.eventsTriggered]),
      ];
    }
    if (canonPlotUpdate) {
      next.flags.canonPlot = mergeCanonPlotUpdate(
        next.flags.canonPlot || migrateCanonPlot(next),
        canonPlotUpdate,
        next.profile?.year ?? 1
      );
    }
    next.flags.canonPlot = migrateCanonPlot(next);
  }

  if (update.magic) {
    next.magic = mergeMagicUpdate(next.magic || migrateMagic(next), update.magic);
  }

  if (update.progression) {
    next.progression = mergeProgressionUpdate(next.progression || migrateProgression(next), update.progression);
  }

  if (update.timetable) {
    next.timetable = mergeTimetableUpdate(next.timetable || migrateTimetable(next), update.timetable);
  }

  if (update.profile?.house && HOUSES.includes(update.profile.house)) {
    next.profile = { ...next.profile, house: update.profile.house };
    next.flags = { ...next.flags, houseSorted: true };
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
    return normalizeLoadedState(JSON.parse(raw));
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
  return normalizeLoadedState(state);
}

export function listSaveSlots() {
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const state = loadGame(i);
    slots.push(state
      ? {
          slot: i,
          name: state.profile.name,
          house: state.profile.house || '待分院',
          year: state.profile.year,
          week: state.time.week,
          turn: state.turnCount,
        }
      : null);
  }
  return slots;
}

/** 供 API history 使用的 narrative 截断（存档内保留完整文本） */
export function narrativeForAI(narrative) {
  if (!narrative) return '';
  if (narrative.length <= HISTORY_AI_NARRATIVE_LIMIT) return narrative;
  return `${narrative.slice(0, HISTORY_AI_NARRATIVE_LIMIT)}…（已截断）`;
}

export function addHistoryEntry(state, action, narrative) {
  const next = structuredClone(state);
  next.turnCount += 1;
  next.history.push({
    turn: next.turnCount,
    action,
    narrative,
  });
  if (next.history.length > MAX_HISTORY) {
    next.history = next.history.slice(-MAX_HISTORY);
  }
  next.lastAction = action;
  next.lastNarrative = narrative;
  return next;
}

export { ROMANCE_TARGETS, MAX_SLOTS, YEAR_OFFSETS, computeNpcYears, processAfterTurn };
