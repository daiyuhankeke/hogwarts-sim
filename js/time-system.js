/** 霍格沃茨一日时钟 — 行动消耗时间，跨日推进 weekday/week */

import { WEEKDAYS } from './timetable.js';

export const CURFEW_CLOCK = '21:00';
const DAY_MINUTES = 24 * 60;

export const DAY_PHASES = [
  { from: 0, label: '深夜' },
  { from: 7 * 60 + 30, label: '早餐' },
  { from: 9 * 60, label: '上午课' },
  { from: 12 * 60 + 30, label: '午餐' },
  { from: 13 * 60, label: '下午课' },
  { from: 17 * 60 + 30, label: '晚餐' },
  { from: 19 * 60, label: '晚间活动' },
  { from: 21 * 60, label: '宵禁后' },
];

export function parseClock(clock) {
  if (clock == null) return null;
  if (typeof clock === 'number' && Number.isFinite(clock)) {
    return Math.max(0, Math.min(DAY_MINUTES - 1, Math.floor(clock)));
  }
  const m = String(clock).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function formatClock(minutes) {
  const m = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function getDayPhase(clock) {
  const mins = parseClock(clock);
  if (mins == null) return '';
  let phase = DAY_PHASES[0].label;
  for (const p of DAY_PHASES) {
    if (mins >= p.from) phase = p.label;
  }
  return phase;
}

export function isAfterCurfew(clock) {
  const mins = parseClock(clock);
  const curfew = parseClock(CURFEW_CLOCK);
  return mins != null && curfew != null && mins >= curfew;
}

function nextWeekday(current) {
  const idx = WEEKDAYS.indexOf(current);
  if (idx < 0) return { weekday: '周一', weekDelta: 0 };
  if (idx === WEEKDAYS.length - 1) return { weekday: '周一', weekDelta: 1 };
  return { weekday: WEEKDAYS[idx + 1], weekDelta: 0 };
}

export function addMinutesToTime(time, minutes) {
  const base = parseClock(time?.clock) ?? parseClock('08:00');
  let total = base + Math.max(0, minutes);
  let weekday = time?.weekday ?? '周一';
  let week = time?.week ?? 1;
  const season = time?.season ?? '秋';

  while (total >= DAY_MINUTES) {
    total -= DAY_MINUTES;
    const next = nextWeekday(weekday);
    weekday = next.weekday;
    week += next.weekDelta;
  }

  return {
    ...time,
    weekday,
    week,
    season,
    clock: formatClock(total),
  };
}

export function getDefaultClock(state) {
  const weekday = state?.time?.weekday ?? '周一';
  const year = state?.profile?.year ?? 1;
  const loc = state?.scene?.location ?? '';
  if (year === 1 && /国王十字|九又四分之三|车站/.test(loc)) return '10:30';
  if (weekday === '周六' || weekday === '周日') return '09:00';
  return '07:45';
}

export function migrateTime(state) {
  const time = { ...(state?.time || {}) };
  if (!time.clock || parseClock(time.clock) == null) {
    time.clock = getDefaultClock(state);
  } else {
    time.clock = formatClock(parseClock(time.clock));
  }
  if (!time.week) time.week = 1;
  if (!time.weekday) time.weekday = '周一';
  if (!time.season) time.season = '秋';
  return time;
}

export function inferMinutesForAction(actionLabel = '', narrative = '') {
  const text = `${actionLabel} ${narrative.slice(-300)}`;
  if (/睡觉|入眠|就寝|入睡|一觉|醒来/.test(text)) return 480;
  if (/霍格莫德|Hogsmeade/.test(text)) return 180;
  if (/魁地奇|训练赛|友谊赛/.test(text)) return 120;
  if (/上课|课程|课堂|魔咒|变形|魔药|草药|黑魔法防御|飞行课|天文学/.test(text)) return 90;
  if (/大礼堂|早餐|午餐|晚餐|宴会|下午茶/.test(text)) return 60;
  if (/图书馆|自习|复习|写作业|论文/.test(text)) return 75;
  if (/有求必应屋|D\.A\.|社团|训练/.test(text)) return 90;
  if (/谈话|聊天|闲聊|碰面|遇见/.test(text)) return 30;
  return 45;
}

/** 回合结束后合并 AI 时间更新，并在未指定 clock 时按行动自动推进 */
export function applyTimeAfterTurn(currentTime, aiTimeUpdate, state, { actionLabel = '', narrative = '' } = {}) {
  const base = migrateTime({ ...state, time: { ...currentTime } });
  const aiSetClock = aiTimeUpdate?.clock != null && parseClock(aiTimeUpdate.clock) != null;
  const weekdayChanged = aiTimeUpdate?.weekday && aiTimeUpdate.weekday !== base.weekday;
  const weekChanged = aiTimeUpdate?.week != null && aiTimeUpdate.week !== base.week;

  let time = { ...base, ...(aiTimeUpdate || {}) };

  if (aiSetClock) {
    time.clock = formatClock(parseClock(aiTimeUpdate.clock));
  } else if (weekdayChanged || weekChanged) {
    time.clock = getDefaultClock({ ...state, time });
  } else {
    time = addMinutesToTime(time, inferMinutesForAction(actionLabel, narrative));
  }

  if (aiTimeUpdate?.weekday) time.weekday = aiTimeUpdate.weekday;
  if (aiTimeUpdate?.week != null) time.week = aiTimeUpdate.week;
  if (aiTimeUpdate?.season) time.season = aiTimeUpdate.season;

  return migrateTime({ ...state, time });
}

/** 判断当前时刻是否落在一节课时段内（约 90 分钟） */
export function isDuringClass(clock, classStartTime) {
  const now = parseClock(clock);
  const start = parseClock(classStartTime);
  if (now == null || start == null) return false;
  return now >= start && now < start + 90;
}

export function getTimeContext(state) {
  const time = migrateTime(state);
  const phase = getDayPhase(time.clock);
  const afterCurfew = isAfterCurfew(time.clock);
  return {
    clock: time.clock,
    dayPhase: phase,
    afterCurfew,
    curfew: CURFEW_CLOCK,
    dmHint:
      `当前 ${time.clock}（${phase}）` +
      (afterCurfew ? '；已过宵禁 21:00，校外游荡可能扣学院分' : '') +
      '。每回合行动消耗约 30–120 分钟，须在 stateUpdate.time.clock 中体现结束时刻。',
  };
}

export function formatTimeInStatus(state) {
  const time = migrateTime(state);
  const phase = getDayPhase(time.clock);
  return `${time.clock}${phase ? ` · ${phase}` : ''}`;
}
