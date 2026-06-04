import { getStageFromAffection, ROMANCE_TARGETS } from './state.js';
import { getNpcScheduleContext } from './npc-schedules.js';
import { getPlaythroughHook, getClubNames, getGossipLabel } from './progression.js';
import { getTimetableContext } from './timetable.js';
import { getCanonicalPlotContext, getCanonEventsForCalendar } from './canonical-storyline.js';
import { getFamilyInteractionContext } from './family-interactions.js';
import { getSceneOptionHint, detectSceneContext, isAtHogwarts } from './contextual-options.js';
import { getCareerContext } from './career-system.js';

const EVENT_CALENDAR = [
  { id: 'opening_feast', week: 1, label: '开学宴会' },
  { id: 'halloween', week: 8, label: '万圣节晚宴' },
  { id: 'goblet_of_fire', week: 8, label: '火焰杯选勇士', requiresFlag: 'triwizardYear' },
  { id: 'beauxbatons_arrival', week: 9, label: '布斯巴顿抵达', requiresFlag: 'triwizardYear' },
  { id: 'durmstrang_arrival', week: 9, label: '德姆斯特朗抵达', requiresFlag: 'triwizardYear' },
  { id: 'triwizard_task1', week: 11, label: '三强赛第一项·斗龙', requiresFlag: 'triwizardYear' },
  { id: 'yule_ball', week: 14, label: '圣诞舞会', minYear: 4 },
  { id: 'triwizard_task2', week: 18, label: '三强赛第二项·黑湖', requiresFlag: 'triwizardYear' },
  { id: 'valentine', week: 20, label: '情人节' },
  { id: 'quidditch_final', week: 30, label: '魁地奇杯决赛' },
  { id: 'triwizard_task3', week: 32, label: '三强赛第三项·迷宫', requiresFlag: 'triwizardYear' },
  { id: 'final_exams', week: 33, label: '期末考试' },
  { id: 'end_feast', week: 34, label: '学年末宴会' },
];

export function getUpcomingEvents(state) {
  const week = state.time.week;
  const year = state.profile.year;
  const generic = EVENT_CALENDAR.filter((ev) => {
    if (ev.minYear && year < ev.minYear) return false;
    if (ev.requiresFlag === 'triwizardYear' && !state.flags.triwizardYear) return false;
    return ev.week >= week && ev.week <= week + 4;
  });
  const canon = getCanonEventsForCalendar(state);
  return [...canon, ...generic].sort((a, b) => a.week - b.week);
}

export function checkEnding(state) {
  const rel = state.relationships;
  const allAffections = ROMANCE_TARGETS.map((n) => rel[n]?.affection ?? 0);

  if (allAffections.every((a) => a >= 85)) {
    return { type: 'HE_万人迷', label: '万人迷结局已解锁' };
  }

  const fred = rel['弗雷德']?.affection ?? 0;
  const george = rel['乔治']?.affection ?? 0;
  if (fred >= 75 && george >= 75) {
    return { type: 'HE_双子', label: '双子夹心结局可触发' };
  }

  for (const name of ROMANCE_TARGETS) {
    const r = rel[name];
    if (r && r.affection >= 91 && r.stage === '热恋') {
      return { type: 'HE_公开', label: `与${name}的热恋 HE 可触发`, target: name };
    }
    if (r && r.affection >= 76 && r.stage === '确认关系') {
      return { type: 'HE_隐秘', label: `与${name}的隐秘恋爱进行中`, target: name };
    }
  }

  return null;
}

export function validateAffectionChange(oldAffection, newAffection, maxDelta = 10) {
  const delta = newAffection - oldAffection;
  if (Math.abs(delta) > maxDelta + 5) {
    return oldAffection + Math.sign(delta) * maxDelta;
  }
  return newAffection;
}

export function clampRelationships(stateUpdate, currentState) {
  if (!stateUpdate?.relationships) return stateUpdate;
  const fixed = { ...stateUpdate, relationships: {} };
  for (const [name, rel] of Object.entries(stateUpdate.relationships)) {
    const old = currentState.relationships[name]?.affection ?? 0;
    let affection = rel.affection ?? old;
    affection = validateAffectionChange(old, affection);
    affection = Math.max(0, Math.min(100, affection));
    fixed.relationships[name] = {
      affection,
      stage: getStageFromAffection(affection),
    };
  }
  return fixed;
}

export function canVisitHogsmeade(state) {
  return state.time.weekday === '周六' && state.profile.year >= 3;
}

export function canBeTriwizardChampion(state) {
  return state.profile.year >= 6;
}

export function buildEventContext(state) {
  const upcoming = getUpcomingEvents(state);
  const ending = checkEnding(state);
  const hook = getPlaythroughHook(state.profile?.year ?? 1);
  const npcSchedule = getNpcScheduleContext(state);
  const prog = state.progression;
  const timetable = getTimetableContext(state);
  const canonPlot = getCanonicalPlotContext(state);
  const familyInteraction = getFamilyInteractionContext(state);
  const lastNarrative = state.history?.[state.history.length - 1]?.narrative || '';
  const sceneCtx = detectSceneContext(state, lastNarrative);

  return {
    upcomingEvents: upcoming.map((e) => e.label),
    endingHint: ending?.label ?? null,
    hogsmeadeAvailable: canVisitHogsmeade(state),
    triwizardEligible: canBeTriwizardChampion(state),
    playthroughHook: hook,
    npcSchedule,
    timetable,
    canonPlot,
    housePoints: prog?.housePoints ?? 0,
    gossipLevel: prog?.gossip?.level ?? 0,
    gossipLabel: getGossipLabel(prog?.gossip?.level ?? 0),
    clubs: getClubNames(prog?.clubs ?? []),
    eventPrep: prog?.eventPrep?.active ? prog.eventPrep : null,
    examWeek: prog?.exams?.active ?? false,
    patronusProgress: prog?.patronusCeremony?.progress ?? 0,
    wandAffinity: prog?.wandNotes || state.profile?.wand?.affinity || '',
    family: state.profile?.family
      ? {
          summary: state.profile.family.summary,
          familyLabel: state.profile.family.familyLabel,
          familyMuggleAttitude: state.profile.family.familyMuggleAttitude,
          playerMuggleAttitude: state.profile.family.playerMuggleAttitudeLabel,
          canonConnections: state.profile.family.canonConnections || [],
        }
      : null,
    familyInteraction,
    career: getCareerContext(state),
    sceneOptionHint: getSceneOptionHint(state, lastNarrative),
    detectedScene: sceneCtx.label,
    atHogwarts: isAtHogwarts(state, lastNarrative),
    dmReminder: '每 5 回合须推进至少一项：学业/感情/学院事件/魔法/社团/原著主线/家庭线。大事件准备期请给准备阶段选项。主线须对齐 canonPlot。options 必须与本回合 narrative 末尾场景一致，见 sceneOptionHint。'
      + (familyInteraction.familyPrompt ? ` ${familyInteraction.familyPrompt}` : ''),
  };
}

export { EVENT_CALENDAR };
