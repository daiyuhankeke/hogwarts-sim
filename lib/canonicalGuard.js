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
        reason: `七年级第${week}周：${full}应与哈利在外逃亡狩猎魂器，不在霍格沃茨日常场景（大礼堂/课堂/图书馆等）。校内应写纳威、金妮、卢娜等；三人仅可通过传闻提及。`,
      };
    }
  }
  return null;
}

export function checkCanonicalViolations(narrative, context = {}) {
  if (!narrative || typeof narrative !== 'string') {
    return { ok: true };
  }

  const trioViolation = checkGoldenTrioAtHogwarts(narrative, context);
  if (trioViolation) return trioViolation;

  for (const { id, pattern, reason } of CHECKS) {
    if (pattern.test(narrative)) {
      return { ok: false, id, reason };
    }
  }

  return { ok: true };
}

export function buildCanonicalRetryHint(violation) {
  if (violation.id === 'golden_trio_y7_absent') {
    return (
      `【上次回复违反原著，必须重写】${violation.reason} ` +
      '请改写为：玩家与纳威/金妮/卢娜等同场，或仅听说三人校外消息。重新输出完整 JSON。'
    );
  }
  return (
    `【上次回复违反原著，必须重写】${violation.reason}。` +
    '请严格参照 characters.md：赫敏=浓密棕卷发、门牙略明显、偏瘦、吐字清楚；' +
    '用「赫敏·格兰杰」点名，禁止模糊误描。重新输出完整 JSON。'
  );
}
