import { getStageFromAffection } from './state.js';
import { getNpcScheduleContext } from './npc-schedules.js';
import { getPlaythroughHook, getClubNames, getGossipLabel, getClubAvailabilityContext } from './progression.js';
import { getTimetableContext } from './timetable.js';
import { getCanonicalPlotContext, getCanonEventsForCalendar } from './canonical-storyline.js';
import { getFamilyInteractionContext } from './family-interactions.js';
import { getFamilyPoliticalContext } from './family-background.js';
import { getCharacterLoreContext } from './character-lore.js';
import { isHousePending } from './character-config.js';
import { getTimeContext } from './time-system.js';
import { getActiveScheduleContext } from './schedule-context.js';
import { scaleWeek, WEEKS_PER_YEAR } from './calendar-config.js';

function isAtHogwarts(state) {
  const loc = state?.scene?.location ?? '';
  if (/特快|火车|9又四分之三|九又四分之三|国王十字|站台|对角巷|奥利凡德|破釜酒吧/.test(loc)) {
    return false;
  }
  return /霍格沃茨|城堡|图书馆|公共休息室|大礼堂|教室|走廊|温室|魁地奇|魔药|魔咒|变形|地窖|塔|格兰芬多|斯莱特林|拉文克劳|赫奇帕奇/.test(loc);
}

/** 一年级尚未正式入校（特快、9¾、赴校途中） */
export function isYear1PreEnrollment(state) {
  const year = state?.profile?.year ?? 1;
  if (year !== 1) return false;
  const week = state?.time?.week ?? 1;
  if (week > 1) return false;
  const loc = state?.scene?.location ?? '';
  if (/特快|火车|9又四分之三|九又四分之三|国王十字|站台/.test(loc)) return true;
  if (/对角巷|奥利凡德|破釜酒吧/.test(loc)) return true;
  return !isAtHogwarts(state);
}

function getSceneOptionHint(state, narrative = '') {
  const loc = state?.scene?.location ?? '未知';
  const weekday = state?.time?.weekday ?? '';
  const clock = state?.time?.clock ?? '';
  const year = state?.profile?.year ?? 1;
  const tail = (narrative || '').slice(-500);
  const parts = [
    `scene.location=${loc}`,
    weekday ? `weekday=${weekday}` : '',
    clock ? `clock=${clock}` : '',
    year >= 3 && weekday === '周六' ? '周六可去霍格莫德' : '',
    isAtHogwarts(state) ? '已入学，勿给出特快/国王十字/对角巷/分院前等过期选项' : '',
    isYear1PreEnrollment(state) ? '【入学途中】尚未到校上课：勿写魔药课/公共休息室等校内经历；纳威丢蟾蜍为初次，赫敏首次询问' : '',
    tail ? `narrative 末尾：…${tail.slice(-220)}` : '',
    'options 须承接 narrative 末尾正在发生的事',
  ];
  return parts.filter(Boolean).join('；');
}

const EVENT_CALENDAR = [
  { id: 'opening_feast', week: scaleWeek(1), label: '开学宴会' },
  { id: 'halloween', week: scaleWeek(8), label: '万圣节晚宴' },
  { id: 'goblet_of_fire', week: scaleWeek(8), label: '火焰杯选勇士', requiresFlag: 'triwizardYear' },
  { id: 'beauxbatons_arrival', week: scaleWeek(9), label: '布斯巴顿抵达', requiresFlag: 'triwizardYear' },
  { id: 'durmstrang_arrival', week: scaleWeek(9), label: '德姆斯特朗抵达', requiresFlag: 'triwizardYear' },
  { id: 'triwizard_task1', week: scaleWeek(11), label: '三强赛第一项·斗龙', requiresFlag: 'triwizardYear' },
  { id: 'yule_ball', week: scaleWeek(14), label: '圣诞舞会', minYear: 4 },
  { id: 'triwizard_task2', week: scaleWeek(18), label: '三强赛第二项·黑湖', requiresFlag: 'triwizardYear' },
  { id: 'valentine', week: scaleWeek(20), label: '情人节' },
  { id: 'quidditch_final', week: scaleWeek(30), label: '魁地奇杯决赛' },
  { id: 'triwizard_task3', week: scaleWeek(32), label: '三强赛第三项·迷宫', requiresFlag: 'triwizardYear' },
  { id: 'final_exams', week: scaleWeek(33), label: '期末考试' },
  { id: 'end_feast', week: WEEKS_PER_YEAR, label: '学年末宴会' },
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

export function checkEnding() {
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
  const hook = getPlaythroughHook(state.profile?.year ?? 1);
  const npcSchedule = getNpcScheduleContext(state);
  const prog = state.progression;
  const timetable = getTimetableContext(state);
  const activeSchedule = getActiveScheduleContext(state);
  const canonPlot = getCanonicalPlotContext(state);
  const familyInteraction = getFamilyInteractionContext(state);
  const familyPolitical = getFamilyPoliticalContext(state);
  const characterLore = getCharacterLoreContext(state.profile);
  const timeContext = getTimeContext(state);
  const sortingPending = isHousePending(state.profile);
  const lastNarrative = state.lastNarrative || state.history?.[state.history.length - 1]?.narrative || '';

  return {
    upcomingEvents: upcoming.map((e) => e.label),
    hogsmeadeAvailable: canVisitHogsmeade(state),
    triwizardEligible: canBeTriwizardChampion(state),
    playthroughHook: hook,
    npcSchedule,
    timetable: {
      ...timetable,
      activeSchedule: {
        clock: activeSchedule.clock,
        period: activeSchedule.period,
        periodStart: activeSchedule.periodStart,
        periodEnd: activeSchedule.periodEnd,
        currentClass: activeSchedule.currentClass
          ? {
              name: activeSchedule.currentClass.name,
              teacher: activeSchedule.currentClass.teacher,
              room: activeSchedule.currentClass.room,
              subjectId: activeSchedule.currentClass.subjectId,
            }
          : null,
        endedClasses: (activeSchedule.endedClasses || []).map((c) => ({
          name: c.name,
          end: c.periodEnd,
        })),
        dmHint: activeSchedule.dmHint,
      },
    },
    time: timeContext,
    canonPlot,
    housePoints: prog?.housePoints ?? 0,
    gossipLevel: prog?.gossip?.level ?? 0,
    gossipLabel: getGossipLabel(prog?.gossip?.level ?? 0),
    clubs: getClubNames(prog?.clubs ?? []),
    clubAvailability: getClubAvailabilityContext(state),
    eventPrep: prog?.eventPrep?.active ? prog.eventPrep : null,
    examWeek: prog?.exams?.active ?? false,
    patronusProgress: prog?.patronusCeremony?.progress ?? 0,
    wandAffinity: prog?.wandNotes || state.profile?.wand?.affinity || '',
    family: state.profile?.family
      ? {
          summary: state.profile.family.summary,
          familyLabel: state.profile.family.familyLabel,
          familyMuggleAttitude: state.profile.family.familyMuggleAttitude,
          playerMuggleAttitude: state.profile.family.playerMuggleAttitudeDisplay
            || state.profile.family.playerMuggleAttitudeLabel,
          hasDarkTies: state.profile.family.hasDarkTies,
          canonConnections: state.profile.family.canonConnections || [],
        }
      : null,
    familyInteraction,
    familyPolitical,
    characterLore,
    sorting: sortingPending
      ? {
          pending: true,
          dmHint: '玩家尚未分院：禁止写学院公共休息室、学院长桌「我们的学院」、为某学院加分；分院帽唱毕宣布学院时须写 stateUpdate.profile.house 为四学院之一。',
        }
      : { pending: false, house: state.profile?.house || null },
    sceneOptionHint: getSceneOptionHint(state, lastNarrative),
    atHogwarts: isAtHogwarts(state),
    year1PreEnrollment: isYear1PreEnrollment(state),
    dmReminder: '每 5 回合须推进至少一项：学业/学院事件/魔法/社团/原著主线/家庭线。大事件准备期请给准备阶段选项。主线须对齐 canonPlot。options 必须与本回合 narrative 末尾场景一致，见 sceneOptionHint。本作为霍格沃茨日常模拟，勿主动推进恋爱线或特殊恋爱结局。'
      + (isYear1PreEnrollment(state)
        ? ' 【一年级·入学途中】特快/9¾：禁止写已上过魔药课、公共休息室等校内经历；纳威丢蟾蜍为初次，赫敏首次出场询问，不可写「上次」重复或魔药课地下室。'
        : '')
      + (familyInteraction.familyPrompt ? ` ${familyInteraction.familyPrompt}` : '')
      + (familyPolitical.dmHint ? ` ${familyPolitical.dmHint}` : '')
      + (characterLore.dmHint ? ` ${characterLore.dmHint}` : '')
      + (sortingPending ? ' 【待分院】禁止写学院专属场所/已归属某学院；分院完成时写 stateUpdate.profile.house。' : '')
      + (activeSchedule.dmHint ? ` ${activeSchedule.dmHint}` : '')
  };
}

export { EVENT_CALENDAR };
