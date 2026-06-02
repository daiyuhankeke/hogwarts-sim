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
];

export function checkCanonicalViolations(narrative) {
  if (!narrative || typeof narrative !== 'string') {
    return { ok: true };
  }

  for (const { id, pattern, reason } of CHECKS) {
    if (pattern.test(narrative)) {
      return { ok: false, id, reason };
    }
  }

  return { ok: true };
}

export function buildCanonicalRetryHint(violation) {
  return (
    `【上次回复违反原著，必须重写】${violation.reason}。` +
    '请严格参照 characters.md：赫敏=浓密棕卷发、门牙略明显、偏瘦、吐字清楚；' +
    '用「赫敏·格兰杰」点名，禁止模糊误描。重新输出完整 JSON。'
  );
}
