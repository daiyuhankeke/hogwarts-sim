/** 检测叙事中明显的原著 OOC 描写，触发重试 */

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

function checkHorcruxSecrecy(narrative, context = {}) {
  const year = context.year ?? context.profile?.year;
  const week = context.week ?? context.time?.week ?? 1;
  if (year !== 7 || week >= 28) return null;

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

function checkGoldenTrioAtHogwarts(narrative, context = {}) {
  const year = context.year ?? context.profile?.year;
  const week = context.week ?? context.time?.week ?? 1;
  if (year !== 7 || week >= 28) return null;

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
