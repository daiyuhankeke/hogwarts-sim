import { MAGIC_SUBJECTS, mergeMagicUpdate } from './magic-system.js';

/**
 * 从剧情叙事推断学科/咒语成长（AI 未返回 stateUpdate.magic 时的补充）
 * 例：变形术练习、魔药搅拌、被指导纠正等
 */
const SUBJECT_RULES = [
  {
    id: 'transfiguration',
    name: '变形术',
    keywords: /变形术|变形课|变形咒|Transfiguration|把.{0,12}变成|变成.{0,16}(鹰|猫|鼠|针|火柴|高脚杯|动物|形状)|餐巾|napkin|一比划.*变形|变形.*魔杖/,
    practice: /尝试|模仿|练习|挥动魔杖|比划|失败|成功|纠正|指导|教|指点|诀窍|手势|意念/,
    spellIds: ['wingardium_leviosa'],
  },
  {
    id: 'charms',
    name: '魔咒学',
    keywords: /魔咒|Charms|荧光闪烁|漂浮咒|开锁咒|咒语课|弗立维/,
    practice: /练习|施咒|念咒|挥杖|成功|失败|纠正|指导/,
    spellIds: ['lumos', 'wingardium_leviosa', 'alohomora'],
  },
  {
    id: 'potions',
    name: '魔药学',
    keywords: /魔药|魔药学|Potions|坩埚|搅拌|切|斯内普|斯拉格霍恩/,
    practice: /尝试|调配|熬制|失败|成功|指导|配方|材料/,
    spellIds: [],
    knowledgeIds: ['witchs_brew', 'polyjuice'],
  },
  {
    id: 'dada',
    name: '黑魔法防御',
    keywords: /黑魔法防御|Defense|博格特|滑稽咒|守护神|决斗|除你武器/,
    practice: /练习|施咒|对抗|成功|失败|指导|训练/,
    spellIds: ['expelliarmus', 'riddikulus', 'expecto_patronum'],
  },
  {
    id: 'herbology',
    name: '草药学',
    keywords: /草药|Herbology|曼德拉草|温室|斯普劳特/,
    practice: /学习|识别|处理|移植|练习/,
    spellIds: [],
    knowledgeIds: ['herbology_basics', 'mandrake'],
  },
  {
    id: 'care',
    name: '神奇生物',
    keywords: /神奇生物|Care of Magical|海格|鹰头马身|护树罗锅/,
    practice: /接近|学习|照顾|观察|练习/,
    spellIds: [],
    knowledgeIds: ['buckbeak'],
  },
  {
    id: 'divination',
    name: '占卜学',
    keywords: /占卜|Trelawney|特里劳妮|茶叶|水晶球/,
    practice: /解读|练习|预测|观察/,
    spellIds: [],
  },
  {
    id: 'astronomy',
    name: '天文学',
    keywords: /天文|Astronomy|星图|望远镜/,
    practice: /观测|学习|记录|练习/,
    spellIds: [],
  },
];

function hasTutor(text) {
  return /指导|教|纠正|指点|诀窍|示范|耐心|解释|赫敏|佩内洛|麦格|教授/.test(text);
}

function hasPracticeAttempt(text) {
  return /尝试|模仿|练习|挥动|施咒|念咒|调配|搅拌|失败|没成功|只/.test(text);
}

/**
 * @returns {{ subject: string, subjectName: string, delta: number, spellIds?: string[], reason: string }[]}
 */
export function inferMagicGains(narrative, action = '', magicBefore, magicAfter) {
  if (!narrative || typeof narrative !== 'string') return [];

  const text = `${narrative} ${action}`;
  const gains = [];

  for (const rule of SUBJECT_RULES) {
    if (!rule.keywords.test(text)) continue;

    const beforeVal = magicBefore?.subjects?.[rule.id] ?? 0;
    const afterVal = magicAfter?.subjects?.[rule.id] ?? beforeVal;
    const aiDelta = afterVal - beforeVal;
    if (aiDelta >= 2) continue;

    const practiced = rule.practice.test(text);
    if (!practiced && !hasPracticeAttempt(text)) continue;

    let delta = 1;
    let reason = `${rule.name}练习`;
    if (hasTutor(text)) {
      delta = 2;
      reason = `${rule.name}受教`;
    }
    if (/成功|准确|稳定|像模像样|有起色/.test(text)) {
      delta = Math.min(3, delta + 1);
      reason = `${rule.name}进步`;
    }
    if (/失败|没成功|皱巴巴|一团|无效|只/.test(text) && hasTutor(text)) {
      delta = Math.max(delta, 2);
      reason = `${rule.name}初学（虽败犹进）`;
    }

    delta = Math.min(3, delta - Math.max(0, aiDelta));

    if (delta <= 0) continue;

    const entry = { subject: rule.id, subjectName: rule.name, delta, reason };
    if (rule.spellIds?.length) {
      entry.spellIds = rule.spellIds.filter((id) => text.includes(getSpellKeyword(id)));
    }
    gains.push(entry);
  }

  return gains.slice(0, 3);
}

function getSpellKeyword(spellId) {
  const map = {
    wingardium_leviosa: '漂浮',
    lumos: '荧光',
    alohomora: '开锁',
    expelliarmus: '除你武器',
    riddikulus: '滑稽',
    expecto_patronum: '守护神',
  };
  return map[spellId] || spellId;
}

export function applyInferredMagicGains(magic, gains) {
  if (!gains.length) return { magic, applied: [] };

  const subjectUpdate = {};
  const spellsImproved = [];
  const applied = [];

  for (const g of gains) {
    subjectUpdate[g.subject] = (magic.subjects?.[g.subject] ?? 20) + g.delta;
    applied.push(g);
    if (g.spellIds?.length) {
      for (const id of g.spellIds) {
        spellsImproved.push({ id, delta: Math.min(4, g.delta + 1) });
      }
    }
  }

  const next = mergeMagicUpdate(magic, {
    subjects: subjectUpdate,
    spellsImproved: spellsImproved.length ? spellsImproved : undefined,
  });

  return { magic: next, applied };
}

export { MAGIC_SUBJECTS };
