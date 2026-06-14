/** 检测叙事中明显的原著 OOC 描写，触发重试 */

import { checkScheduleViolation, buildScheduleRetryHint } from '../js/schedule-context.js';
import { HARRY_RETURNS_WEEK, WEEKS_PER_YEAR } from '../js/calendar-config.js';

const CHECKS = [
  {
    id: 'hermione_fat',
    pattern: /赫敏[^。；！？\n]{0,40}(胖乎乎|胖墩|微胖|圆润|婴儿肥|肉感|丰腴|矮胖)/,
    reason: '赫敏外貌 OOC：原著中为棕卷发散乱、偏瘦，不得写胖',
  },
  {
    id: 'hermione_fat_vague',
    pattern: /(胖乎乎|微胖|圆润)的(女孩|女生|女巫)[^。；！？\n]{0,50}(蟾蜍|莱福|纳威)/,
    reason: '火车上找蟾蜍的是赫敏，且赫敏不是「胖乎乎」',
  },
  {
    id: 'hermione_nasal',
    pattern: /赫敏[^。；！？\n]{0,30}鼻音/,
    reason: '赫敏没有「鼻音很重」的原著设定',
  },
  {
    id: 'penelope_wrong_house',
    pattern: /佩内洛[^。；！？\n]{0,20}(格兰芬多|斯莱特林|赫奇帕奇)/,
    reason: '佩内洛·克里瓦特是拉文克劳学生',
  },
  {
    id: 'harry_glasses',
    pattern: /哈利[^。；！？\n]{0,25}(没戴|不戴|摘下)眼镜/,
    reason: '哈利几乎始终戴圆框眼镜',
  },
];

const ON_CAMPUS_MARKERS = /大礼堂|早餐|午餐|晚餐|格兰芬多长桌|斯莱特林长桌|公共休息室|课堂上|同桌|变形课|魔药课|魔咒课|图书馆里|门厅壁龛|走廊里[^。]{0,20}(遇到|看见|找到|走向)/;

const GOLDEN_TRIO = [
  { name: '赫敏', full: '赫敏·格兰杰' },
  { name: '哈利', full: '哈利·波特' },
  { name: '罗恩', full: '罗恩·韦斯莱' },
];

function checkYear1PreEnrollment(narrative, context = {}) {
  const year = context.year ?? context.profile?.year;
  if (year !== 1) return null;

  const week = context.week ?? context.time?.week ?? 1;
  const loc = context.location ?? context.scene?.location ?? '';
  const onExpress = /特快|火车/.test(loc);
  const preEnrollment = week <= 1 && (onExpress || /9又四分之三|九又四分之三|国王十字|站台|对角巷/.test(loc));

  if (!preEnrollment) return null;

  const patterns = [
    {
      pattern: /(上(一|回)次|之前|以前).{0,40}(魔药|变形|魔咒|飞行|草药|黑魔法|公共休息室|大礼堂|魁地奇|课堂|地下室|地窖)/,
      reason: '一年级特快/入学途中：尚未在校上课，不可写「上次/以前」的霍格沃茨课堂或校内经历',
    },
    {
      pattern: /(魔药课|魔药教室).{0,20}(地下室|地窖)/,
      reason: '一年级赴校途中：尚未入学，不可提及魔药课地下室等地牢场景',
    },
    {
      pattern: /(蟾蜍|莱福).{0,50}(魔药|地下室|地窖|课堂)/,
      reason: '纳威的蟾蜍：火车上应为初次丢失莱福，不可写已有校内丢失/找回经历',
    },
    {
      pattern: /上(一|回)次(也是)?这么(说|讲)/,
      reason: '特快上三初遇：赫敏/罗恩尚未与玩家或彼此有过找蟾蜍的「上次」，不可写重复对话',
    },
    {
      pattern: /(已经|早就).{0,20}(上过|去过).{0,20}(魔药|变形|魔咒|公共休息室|大礼堂)/,
      reason: '入学途中不可写已经上过课或去过校内场所',
    },
  ];

  if (onExpress) {
    patterns.push({
      pattern: /(魔药课|变形课|魔咒课|飞行课|草药课|公共休息室|学院杯|魁地奇训练|宵禁)/,
      reason: '霍格沃茨特快上：新生尚未入学，不可写已发生的校内课程或常规活动',
    });
  }

  for (const { pattern, reason } of patterns) {
    if (pattern.test(narrative)) {
      return { ok: false, id: 'year1_pre_enrollment', reason };
    }
  }
  return null;
}

function checkHorcruxSecrecy(narrative, context = {}) {
  const year = context.year ?? context.profile?.year;
  const week = context.week ?? context.time?.week ?? 1;
  if (year !== 7 || week >= HARRY_RETURNS_WEEK) return null;

  const patterns = [
    { pattern: /魂器|Horcrux|horcrux/i, reason: '七年级第1–27周：魂器任务对霍格沃茨保密，叙事中不可出现「魂器」' },
    { pattern: /狩猎魂器|猎.*魂器|寻找魂器|搜寻魂器|找.*魂器|魂器 hunt/i, reason: '不可写哈利等人在搜寻魂器（校内角色不应知晓）' },
    { pattern: /(哈利|罗恩|赫敏)[^。；！？\n]{0,40}(在找|寻找|搜寻| hunt)[^。；！？\n]{0,30}(某|重要|东西|物品|那)/i, reason: '不可写校内角色知晓哈利三人「在找某物/重要东西」等任务细节' },
    { pattern: /(金妮|卢娜|纳威)[^。；！？\n]{0,50}(哈利|他们)[^。；！？\n]{0,40}(找到|寻找|在找|重要)/, reason: '金妮/卢娜/纳威不应向玩家透露哈利任务进展或推测任务内容' },
    { pattern: /推测[^。；！？\n]{0,20}(哈利|他们)[^。；！？\n]{0,30}(在找|寻找)/, reason: '不可提供「推测哈利在找什么」类选项或对话' },
  ];

  for (const { pattern, reason } of patterns) {
    if (pattern.test(narrative)) {
      return { ok: false, id: 'horcrux_secrecy_y7', reason };
    }
  }
  return null;
}

function checkUnsortedHouse(narrative, context = {}) {
  const house = context.profile?.house ?? context.house;
  const year = context.year ?? context.profile?.year;
  if (house || year !== 1) return null;

  const loc = context.location ?? context.scene?.location ?? '';
  const atSorting = /大礼堂|分院|分院帽/.test(`${loc}${narrative.slice(0, 200)}`);

  const patterns = [
    {
      pattern: /(回到|走进|前往|位于|在).{0,12}(格兰芬多|斯莱特林|拉文克劳|赫奇帕奇).{0,10}公共休息室/,
      reason: '尚未分院：不可写已进入某学院公共休息室',
    },
    {
      pattern: /(你|她)的(格兰芬多|斯莱特林|拉文克劳|赫奇帕奇)/,
      reason: '尚未分院：不可写「你的某学院」归属',
    },
    {
      pattern: /(身为|作为).{0,8}(格兰芬多|斯莱特林|拉文克劳|赫奇帕奇).{0,8}(学生|新生)/,
      reason: '尚未分院：不可写已归属某学院',
    },
    {
      pattern: /(格兰芬多|斯莱特林|拉文克劳|赫奇帕奇)长桌旁.{0,20}(你|她)/,
      reason: '尚未分院：不可写坐在某学院长桌',
    },
  ];

  for (const { pattern, reason } of patterns) {
    if (pattern.test(narrative)) {
      return { ok: false, id: 'unsorted_house', reason };
    }
  }

  if (!atSorting && /(格兰芬多|斯莱特林|拉文克劳|赫奇帕奇)学院袍/.test(narrative)) {
    return { ok: false, id: 'unsorted_robes', reason: '尚未分院：不可写已穿上某学院院袍' };
  }

  return null;
}

function checkGoldenTrioAtHogwarts(narrative, context = {}) {
  const year = context.year ?? context.profile?.year;
  const week = context.week ?? context.time?.week ?? 1;
  if (year !== 7 || week >= HARRY_RETURNS_WEEK) return null;

  for (const { name, full } of GOLDEN_TRIO) {
    const onCampus = new RegExp(`${name}[^。；！？\n]{0,100}${ON_CAMPUS_MARKERS.source}|${ON_CAMPUS_MARKERS.source}[^。；！？\n]{0,100}${name}`);
    if (onCampus.test(narrative)) {
      return {
        ok: false,
        id: 'golden_trio_y7_absent',
        reason: `七年级第${week}周：${full}不在霍格沃茨日常场景（大礼堂/课堂/图书馆等）。校内应写纳威、金妮、卢娜等；三人仅可通过模糊传闻提及，且不得泄露魂器任务。`,
      };
    }
  }
  return null;
}

export function checkCanonicalViolations(narrative, context = {}, options = []) {
  if (!narrative || typeof narrative !== 'string') {
    return { ok: true };
  }

  const year1Violation = checkYear1PreEnrollment(narrative, context);
  if (year1Violation) return year1Violation;

  const scheduleViolation = checkScheduleViolation(narrative, context);
  if (scheduleViolation) return scheduleViolation;

  const unsortedViolation = checkUnsortedHouse(narrative, context);
  if (unsortedViolation) return unsortedViolation;

  const horcruxViolation = checkHorcruxSecrecy(narrative, context);
  if (horcruxViolation) return horcruxViolation;

  const trioViolation = checkGoldenTrioAtHogwarts(narrative, context);
  if (trioViolation) return trioViolation;

  for (const { id, pattern, reason } of CHECKS) {
    if (pattern.test(narrative)) {
      return { ok: false, id, reason };
    }
  }

  for (const opt of options || []) {
    const text = typeof opt === 'string' ? opt : opt?.text || '';
    if (!text) continue;
    const optYear1 = checkYear1PreEnrollment(text, context);
    if (optYear1) return { ...optYear1, reason: `${optYear1.reason}（选项：${text.slice(0, 40)}…）` };
    const optSchedule = checkScheduleViolation(text, context);
    if (optSchedule) return { ...optSchedule, reason: `${optSchedule.reason}（选项：${text.slice(0, 40)}…）` };
    const optHorcrux = checkHorcruxSecrecy(text, context);
    if (optHorcrux) return { ...optHorcrux, reason: `${optHorcrux.reason}（选项：${text.slice(0, 40)}…）` };
    const optTrio = checkGoldenTrioAtHogwarts(text, context);
    if (optTrio) return optTrio;
  }

  return { ok: true };
}

export function buildCanonicalRetryHint(violation) {
  if (violation.id === 'golden_trio_y7_absent') {
    return (
      `【上次回复违反原著，必须重写】${violation.reason} ` +
      '请改写为：玩家与纳威/金妮/卢娜等同场，或仅听说三人失踪/逃亡等模糊消息（不知魂器任务）。重新输出完整 JSON。'
    );
  }
  if (violation.id === 'year1_pre_enrollment') {
    return (
      `【上次回复违反原著时间线，必须重写】${violation.reason} ` +
      '请改写为：特快上的初次相遇——赫敏首次询问是否见过纳威的蟾蜍莱福，罗恩/哈利尚未与她熟络；' +
      '禁止提及魔药课、地下室、公共休息室或「上次」的校内经历。重新输出完整 JSON。'
    );
  }
  if (violation.id?.startsWith('schedule_')) {
    return buildScheduleRetryHint(violation);
  }
  if (violation.id === 'horcrux_secrecy_y7') {
    return (
      `【上次回复违反原著，必须重写】${violation.reason} ` +
      '哈利/罗恩/赫敏的任务对霍格沃茨绝对保密：不可写魂器、不可写金妮/卢娜透露哈利在找某物、不可让玩家推测任务。' +
      '可改为：讨论校内抵抗、卡罗暴行、或仅知三人失踪/被通缉。重新输出完整 JSON。'
    );
  }
  return (
    `【上次回复违反原著，必须重写】${violation.reason}。` +
    '请严格参照 characters.md：赫敏=浓密棕卷发、门牙略明显、偏瘦、吐字清楚；' +
    '用「赫敏·格兰杰」点名，禁止模糊误描。重新输出完整 JSON。'
  );
}
