/** 霍格沃茨课表 — 按年级生成，贴近原著教授与作息 */

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const PERIOD_LABELS = {
  am1: '09:00',
  am2: '10:45',
  pm1: '13:00',
  pm2: '14:45',
};

export const SUBJECT_CATALOG = {
  transfiguration: { name: '变形术', room: '变形课教室' },
  charms: { name: '魔咒学', room: '魔咒课教室' },
  potions: { name: '魔药学', room: '地牢·魔药教室' },
  dada: { name: '黑魔法防御', room: '黑魔法防御课教室' },
  herbology: { name: '草药学', room: '温室' },
  history: { name: '魔法史', room: '历史课教室' },
  astronomy: { name: '天文学', room: '天文塔', evening: true },
  flying: { name: '飞行课', room: '魁地奇球场', yearMax: 1 },
  care: { name: '神奇生物', room: '禁林边缘', elective: true },
  divination: { name: '占卜学', room: '北塔占卜课教室', elective: true },
  arithmancy: { name: '算术占卜', room: '算术占卜课教室', elective: true },
  runes: { name: '古代魔文', room: '古代魔文课教室', elective: true },
  study: { name: '自习', room: '图书馆/公共休息室' },
  free: { name: '自由时间', room: '—' },
};

const ELECTIVE_POOL = ['care', 'divination', 'arithmancy', 'runes'];

/** 各学年黑魔法防御课教授（与原著时间线对齐） */
function getDadaTeacher(year) {
  const map = {
    1: '奇洛教授',
    2: '洛哈特教授',
    3: '卢平教授',
    4: '穆迪教授',
    5: '乌姆里奇教授',
    6: '斯内普教授',
    7: '阿米库斯·卡罗教授',
  };
  return map[year] || '黑魔法防御课教授';
}

export function getTeachersForYear(year) {
  const potions = year >= 6 ? '斯拉格霍恩教授' : '斯内普教授';
  return {
    transfiguration: '麦格教授',
    charms: '弗立维教授',
    potions,
    dada: getDadaTeacher(year),
    herbology: '斯普劳特教授',
    history: '宾斯教授',
    astronomy: '辛尼斯塔教授',
    flying: '霍琦夫人',
    care: '海格',
    divination: '特里劳妮教授',
    arithmancy: '维克托教授',
    runes: '巴思老教授',
    study: '—',
    free: '—',
  };
}

/** 三年级起选修两门 */
export function pickElectives(profile) {
  const year = profile.year ?? 1;
  if (year < 3) return [];

  const talents = profile.talents ?? [];
  const clubs = profile.clubs ?? [];
  const chosen = [];

  if (clubs.includes('creature') || talents.includes('神奇生物亲和')) {
    chosen.push('care');
  }
  if (talents.includes('占卜直觉')) {
    chosen.push('divination');
  }
  if (clubs.includes('library') || talents.includes('古代魔文学霸')) {
    if (!chosen.includes('arithmancy')) chosen.push('arithmancy');
    if (!chosen.includes('runes') && chosen.length < 2) chosen.push('runes');
  }

  for (const id of ELECTIVE_POOL) {
    if (chosen.length >= 2) break;
    if (!chosen.includes(id)) chosen.push(id);
  }
  return chosen.slice(0, 2);
}

function resolveSlot(slotId, year, electives) {
  if (slotId === '_flying') return year <= 1 ? 'flying' : null;
  if (slotId === '_elective1') return electives[0] || 'study';
  if (slotId === '_elective2') return electives[1] || 'study';
  return slotId;
}

/** 每周课表模板（四节/day，周六日无课） */
const WEEK_TEMPLATE = {
  周一: ['transfiguration', 'charms', 'potions', 'history'],
  周二: ['herbology', 'dada', 'charms', '_flying'],
  周三: ['potions', 'transfiguration', 'dada', 'herbology'],
  周四: ['history', 'charms', '_elective1', '_elective2'],
  周五: ['dada', 'transfiguration', 'herbology', 'charms'],
};

const PERIODS = ['am1', 'am2', 'pm1', 'pm2'];

function buildClass(subjectId, period, teachers) {
  const meta = SUBJECT_CATALOG[subjectId] || { name: subjectId, room: '—' };
  return {
    period,
    time: PERIOD_LABELS[period],
    subjectId,
    name: meta.name,
    teacher: teachers[subjectId] || '—',
    room: meta.room,
    evening: meta.evening ?? false,
    elective: meta.elective ?? false,
  };
}

export function createTimetable(profile) {
  const year = profile.year ?? 1;
  const electives = pickElectives(profile);
  const teachers = getTeachersForYear(year);
  const schedule = {};

  for (const day of WEEKDAYS.slice(0, 5)) {
    const slots = WEEK_TEMPLATE[day];
    schedule[day] = PERIODS.map((period, i) => {
      const raw = slots[i];
      const subjectId = resolveSlot(raw, year, electives);
      if (!subjectId) {
        return buildClass('free', period, teachers);
      }
      return buildClass(subjectId, period, teachers);
    });
  }

  const evening = [];
  if (year >= 1) {
    for (const day of ['周三', '周五']) {
      evening.push({
        weekday: day,
        time: '23:00',
        ...buildClass('astronomy', 'night', teachers),
      });
    }
  }

  return {
    year,
    electives,
    schedule,
    evening,
    swaps: [],
    notes: year <= 1 ? '一年级含飞行课（周二下午）' : year >= 3 ? `选修：${electives.map((id) => SUBJECT_CATALOG[id]?.name).join('、')}` : '',
  };
}

export function migrateTimetable(state) {
  const year = state.profile?.year ?? 1;
  if (state.timetable?.schedule && state.timetable.year === year) {
    return normalizeTimetable(state.timetable);
  }
  return createTimetable(state.profile || { year: 1 });
}

function normalizeTimetable(timetable) {
  return {
    year: timetable.year,
    electives: timetable.electives || [],
    schedule: timetable.schedule || {},
    evening: timetable.evening || [],
    swaps: timetable.swaps || [],
    notes: timetable.notes || '',
  };
}

export function mergeTimetableUpdate(current, update) {
  if (!update) return current;
  const next = normalizeTimetable(structuredClone(current));

  if (update.swaps) {
    for (const swap of update.swaps) {
      next.swaps.push({
        weekday: swap.weekday,
        period: swap.period,
        subjectId: swap.subjectId,
        reason: swap.reason || '',
        week: swap.week ?? null,
      });
    }
    next.swaps = next.swaps.slice(-8);
  }

  if (update.notes) next.notes = update.notes;
  return next;
}

/** 获取某天的有效课表（含临时调课） */
export function getClassesForWeekday(timetable, weekday, week = null) {
  if (!timetable?.schedule?.[weekday]) return [];
  const base = timetable.schedule[weekday];
  if (!week || !timetable.swaps?.length) return base;

  return base.map((cls) => {
    const swap = timetable.swaps.find(
      (s) => s.weekday === weekday && s.period === cls.period && (s.week === null || s.week === week)
    );
    if (!swap) return cls;
    const teachers = getTeachersForYear(timetable.year);
    return { ...buildClass(swap.subjectId, cls.period, teachers), swapped: true, swapReason: swap.reason };
  });
}

export function getTodayClasses(state) {
  const weekday = state?.time?.weekday;
  if (!weekday || weekday === '周六' || weekday === '周日') return [];
  const timetable = state.timetable || migrateTimetable(state);
  return getClassesForWeekday(timetable, weekday, state.time?.week);
}

export function getTodayEveningClasses(state) {
  const weekday = state?.time?.weekday;
  const timetable = state.timetable || migrateTimetable(state);
  return (timetable.evening || []).filter((c) => c.weekday === weekday);
}

export function formatTodayClassHint(state) {
  const classes = getTodayClasses(state);
  if (!classes.length) {
    if (state?.time?.weekday === '周六') return '周末·霍格莫德或自习';
    if (state?.time?.weekday === '周日') return '周末·自习或休息';
    return '无固定课程';
  }
  const names = [...new Set(classes.filter((c) => c.subjectId !== 'free' && c.subjectId !== 'study').map((c) => c.name))];
  return names.slice(0, 4).join('、') || '自习';
}

export function getTimetableContext(state) {
  const timetable = state.timetable || migrateTimetable(state);
  const weekday = state?.time?.weekday ?? '周一';
  const today = getTodayClasses(state);
  const evening = getTodayEveningClasses(state);

  return {
    weekday,
    isWeekend: weekday === '周六' || weekday === '周日',
    todayClasses: today.map((c) => ({
      time: c.time,
      name: c.name,
      teacher: c.teacher,
      room: c.room,
      subjectId: c.subjectId,
    })),
    eveningClasses: evening.map((c) => ({ time: c.time, name: c.name, teacher: c.teacher })),
    electives: (timetable.electives || []).map((id) => SUBJECT_CATALOG[id]?.name || id),
    notes: timetable.notes,
    dmHint: today.length
      ? `今日(${weekday})课程：${today.map((c) => `${c.time}${c.name}(${c.teacher})`).join('；')}`
      : `${weekday}无固定课时，可安排社团/自习/自由活动`,
  };
}
