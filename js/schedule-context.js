/** 课表时段与当前时钟对齐 — 每节课必须在规定时段内结束 */

import { parseClock, formatClock, migrateTime } from './time-system.js';
import { getTodayClasses, PERIOD_LABELS, SUBJECT_CATALOG } from './timetable.js';

/** 每节课约 90 分钟；课间 10:30–10:45、12:15–13:00 等 */
export const PERIOD_TIMES = [
  { period: 'am1', start: '09:00', end: '10:30', label: '第一节' },
  { period: 'am2', start: '10:45', end: '12:15', label: '第二节' },
  { period: 'lunch', start: '12:15', end: '13:00', label: '午餐' },
  { period: 'pm1', start: '13:00', end: '14:30', label: '第三节' },
  { period: 'pm2', start: '14:45', end: '16:15', label: '第四节' },
  { period: 'free', start: '16:15', end: '17:30', label: '课后' },
];

const CLASS_PERIODS = new Set(['am1', 'am2', 'pm1', 'pm2']);

const SUBJECT_MARKERS = {
  transfiguration: /变形(术|课|咒|教室)?|麦格教授|Transfiguration/i,
  charms: /魔咒(学|课|教室)?|弗立维|漂浮咒|Wingardium|Charms/i,
  potions: /魔药(学|课|教室)?|斯内普教授|斯拉格霍恩|坩埚|Potions/i,
  dada: /黑魔法防御|Defense Against|乌姆里奇|卢平教授|卡罗/i,
  herbology: /草药(学|课)?|斯普劳特|温室|Herbology/i,
  history: /魔法史|宾斯教授|History of Magic/i,
  flying: /飞行课|霍琦夫人|魁地奇球场.*飞/i,
  astronomy: /天文(学|课|塔)|辛尼斯塔|Astronomy/i,
};

const SUBJECT_LOCATION_MARKERS = {
  transfiguration: /变形课教室|变形课/,
  charms: /魔咒课教室|魔咒课/,
  potions: /魔药|地牢/,
  herbology: /温室/,
  history: /历史课教室|魔法史/,
  flying: /魁地奇球场/,
};

function findTimeSlot(clock) {
  const minutes = parseClock(clock);
  if (minutes == null) return null;
  return PERIOD_TIMES.find((p) => minutes >= parseClock(p.start) && minutes < parseClock(p.end)) || null;
}

function getPeriodTimes(periodId) {
  return PERIOD_TIMES.find((p) => p.period === periodId) || null;
}

/** 当前时钟对应的课表上下文 */
export function getActiveScheduleContext(state) {
  const time = migrateTime(state);
  const weekday = time.weekday ?? '周一';
  const clock = time.clock;

  if (weekday === '周六' || weekday === '周日') {
    return {
      phase: 'weekend',
      clock,
      weekday,
      currentClass: null,
      dmHint: `周末无固定正课（当前 ${clock}）。`,
    };
  }

  const slot = findTimeSlot(clock);
  if (!slot) {
    return {
      phase: 'outside_hours',
      clock,
      weekday,
      currentClass: null,
      dmHint: `当前 ${clock} 不在常规课时内（09:00–16:15）；若已宵禁勿写正课。`,
    };
  }

  const classes = getTodayClasses(state);
  const currentClass = CLASS_PERIODS.has(slot.period)
    ? classes.find((c) => c.period === slot.period) || null
    : null;

  const endedClasses = classes
    .filter((c) => {
      const pt = getPeriodTimes(c.period);
      return pt && parseClock(clock) >= parseClock(pt.end);
    })
    .map((c) => ({
      ...c,
      periodEnd: getPeriodTimes(c.period)?.end,
    }));

  const nextSlot = PERIOD_TIMES.find(
    (p) => CLASS_PERIODS.has(p.period) && parseClock(p.start) > parseClock(clock)
  );
  const nextClass = nextSlot ? classes.find((c) => c.period === nextSlot.period) : null;

  let dmHint = '';
  if (slot.period === 'lunch') {
    dmHint = `【${clock} 午餐 ${slot.start}–${slot.end}】禁止写仍在教室上正课；可写大礼堂用餐。`;
  } else if (slot.period === 'free') {
    dmHint = `【${clock} 课后 ${slot.start}–${slot.end}】正课已结束，可自习/社团/自由活动。`;
  } else if (currentClass && currentClass.subjectId !== 'free' && currentClass.subjectId !== 'study') {
    dmHint =
      `【课表 ${clock}】当前时段 ${slot.start}–${slot.end}：` +
      `${currentClass.name}（${currentClass.teacher}·${currentClass.room}）。` +
      `叙事须写本课或课间；${slot.end} 前必须下课。` +
      (endedClasses.length
        ? ` 已结束：${endedClasses.map((c) => `${c.name}(${getPeriodTimes(c.period)?.end}止)`).join('、')}，不可仍写这些课进行中。`
        : '');
  } else {
    dmHint = `【${clock} ${slot.label} ${slot.start}–${slot.end}】本节无正课（自习/自由时间）。`;
  }

  return {
    phase: slot.period === 'lunch' ? 'lunch' : slot.period === 'free' ? 'after_school' : 'class',
    clock,
    weekday,
    period: slot.period,
    periodStart: slot.start,
    periodEnd: slot.end,
    currentClass,
    nextClass,
    endedClasses,
    dmHint,
  };
}

/** 推进时钟时不超过当前课时结束（上课行动） */
export function capClockToSchedule(clock, state, { actionLabel = '', narrative = '' } = {}) {
  const minutes = parseClock(clock);
  if (minutes == null) return clock;

  const text = `${actionLabel} ${narrative}`;
  const inClassAction = /上课|课程|课堂|魔咒|变形|魔药|草药|黑魔法|飞行课|教授/.test(text);
  if (!inClassAction) return clock;

  const ctx = getActiveScheduleContext({ ...state, time: { ...migrateTime(state), clock } });
  if (ctx.phase !== 'class' || !ctx.periodEnd) return clock;

  const end = parseClock(ctx.periodEnd);
  if (end != null && minutes > end) return ctx.periodEnd;
  return clock;
}

/** 检测叙事/场景是否与课表时刻矛盾 */
export function checkScheduleViolation(narrative, context = {}) {
  if (!narrative || typeof narrative !== 'string') return null;

  const state = {
    profile: context.profile || { year: 1 },
    timetable: context.timetable,
    time: {
      weekday: context.weekday ?? context.time?.weekday ?? '周一',
      clock: context.clock ?? context.time?.clock ?? '09:00',
      week: context.week ?? context.time?.week ?? 1,
      season: context.season ?? '秋',
    },
  };

  const active = getActiveScheduleContext(state);
  if (active.phase === 'weekend') return null;

  const clock = state.time.clock;
  const location = context.location ?? context.scene?.location ?? '';

  // 已结束的课程仍在进行
  for (const ended of active.endedClasses || []) {
    if (ended.subjectId === 'free' || ended.subjectId === 'study') continue;
    const marker = SUBJECT_MARKERS[ended.subjectId];
    const locMarker = SUBJECT_LOCATION_MARKERS[ended.subjectId];
    const pt = getPeriodTimes(ended.period);
    const stillInClass =
      /还在|仍在|正在|尾声|课堂里|课结束前|课桌|教授.*(说|看|点|表扬|总结)|下课铃.*(还没|尚未)/.test(narrative);
    if (marker && stillInClass && marker.test(narrative)) {
      return {
        ok: false,
        id: 'schedule_class_overdue',
        reason: `${clock} 时 ${ended.name}（${pt?.start}–${pt?.end}）已结束，不可写仍在该课上课`,
      };
    }
    if (locMarker && locMarker.test(location) && active.currentClass?.subjectId !== ended.subjectId) {
      return {
        ok: false,
        id: 'schedule_location_overdue',
        reason: `${clock} 时不应在 ${ended.name} 教室（该课 ${pt?.end} 已结束）`,
      };
    }
  }

  // 当前时段上了错误的课
  const current = active.currentClass;
  if (current && current.subjectId !== 'free' && current.subjectId !== 'study' && active.phase === 'class') {
    for (const [subjectId, marker] of Object.entries(SUBJECT_MARKERS)) {
      if (subjectId === current.subjectId) continue;
      if (!marker.test(narrative)) continue;
      const inClassContext = /课(堂|上|室|结束|尾声)|教授.*(讲|说|看|点|表扬|演示|纠正)|教室|挥动魔杖.*(课|练习)/.test(narrative);
      if (inClassContext) {
        return {
          ok: false,
          id: 'schedule_wrong_class',
          reason: `${clock} 应为 ${current.name}（${active.periodStart}–${active.periodEnd}），不可写正在上 ${SUBJECT_CATALOG[subjectId]?.name || subjectId}`,
        };
      }
    }

    const wrongLoc = Object.entries(SUBJECT_LOCATION_MARKERS).find(
      ([id, pat]) => id !== current.subjectId && pat.test(location)
    );
    if (wrongLoc) {
      return {
        ok: false,
        id: 'schedule_wrong_location',
        reason: `${clock} 场景应在 ${current.room}（${current.name}），不应在 ${location}`,
      };
    }
  }

  // 午餐/课后仍写正课
  if ((active.phase === 'lunch' || active.phase === 'after_school') && /(变形|魔咒|魔药|草药|魔法史|黑魔法防御)(课|课堂|教室)/.test(narrative)) {
    if (/教授.*(讲|说|上课|演示)|课堂|课桌|下课/.test(narrative)) {
      return {
        ok: false,
        id: 'schedule_outside_class_hours',
        reason: `${clock} 为${active.phase === 'lunch' ? '午餐' : '课后'}时段，不可写正课进行中`,
      };
    }
  }

  return null;
}

export function buildScheduleRetryHint(violation) {
  return (
    `【上次回复违反课表时刻，必须重写】${violation.reason} ` +
    '请严格按 eventContext.timetable.activeSchedule / dmHint：当前时刻只写对应课时或课间/午餐；' +
    '已结束的课不可继续；stateUpdate.time.clock 不得超过课时 end。重新输出完整 JSON。'
  );
}

export { PERIOD_LABELS };
