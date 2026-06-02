/** 霍格沃茨魔法系统 — 咒语库、学科、初始状态 */

export const MAGIC_SUBJECTS = [
  { id: 'charms', name: '魔咒学', owl: true },
  { id: 'transfiguration', name: '变形术', owl: true },
  { id: 'potions', name: '魔药学', owl: true },
  { id: 'dada', name: '黑魔法防御', owl: true },
  { id: 'herbology', name: '草药学', owl: true },
  { id: 'care', name: '神奇生物', owl: true },
  { id: 'divination', name: '占卜学', owl: true },
  { id: 'astronomy', name: '天文学', owl: true },
];

/** O.W.L. 考试科目（含魔法史） */
export const OWL_EXAM_SUBJECTS = [
  { id: 'charms', name: '魔咒学' },
  { id: 'transfiguration', name: '变形术' },
  { id: 'potions', name: '魔药学' },
  { id: 'dada', name: '黑魔法防御' },
  { id: 'herbology', name: '草药学' },
  { id: 'care', name: '神奇生物' },
  { id: 'history', name: '魔法史' },
  { id: 'astronomy', name: '天文学' },
];

export const OWL_GRADES = ['O', 'E', 'A', 'P', 'D', 'T'];
export const OWL_GRADE_NAMES = {
  O: '杰出',
  E: '超出预期',
  A: '合格',
  P: '糟糕',
  D: '恶劣',
  T: '巨怪',
};

/** 常见守护神形态（原著风格） */
export const PATRONUS_FORMS = [
  '水獭', '牝鹿', '牡鹿', '猎犬', '白鼬', '野兔', '天鹅', '马', '猫', '狐狸',
  '狼', '鹰', '獾', '刺猬', '海豚', '凤凰', '猞猁', '猫头鹰', '蛇', '虎',
];

export function skillToOWLGrade(skill) {
  const s = skill ?? 0;
  if (s >= 88) return 'O';
  if (s >= 78) return 'E';
  if (s >= 68) return 'A';
  if (s >= 52) return 'P';
  if (s >= 38) return 'D';
  return 'T';
}

/** 根据学科能力推算 O.W.L. 成绩，含考试意外波动 */
export function computeOWLResults(subjects, year, profile = {}) {
  const seed = hashForExam(`${profile.name}|owl`);
  let accidentCount = 0;

  const results = {};
  for (const sub of OWL_EXAM_SUBJECTS) {
    let skill;
    if (sub.id === 'history') {
      skill = (
        (subjects.charms ?? 0) + (subjects.transfiguration ?? 0) + (subjects.dada ?? 0)
      ) / 3 - 5;
    } else if (sub.id === 'care') {
      skill = subjects.care ?? 0;
    } else {
      skill = subjects[sub.id] ?? 0;
    }

    // 五年级考试时能力略低于当前（回溯一年）
    const yearsSinceExam = Math.max(0, year - 5);
    skill = Math.max(20, skill - yearsSinceExam * 2);

    let grade = skillToOWLGrade(skill);
    const roll = (seed + sub.id.charCodeAt(0) * 17) % 100;

    // ~12% 单科考试意外：发挥失常降 1 级
    if (roll < 12) {
      grade = dropGrade(grade);
      accidentCount += 1;
    }
    // ~8% 超常发挥升 1 级
    else if (roll > 92) {
      grade = raiseGrade(grade);
    }

    results[sub.id] = grade;
  }

  return { results, accidents: accidentCount };
}

function dropGrade(g) {
  const i = OWL_GRADES.indexOf(g);
  return OWL_GRADES[Math.min(i + 1, OWL_GRADES.length - 1)];
}

function raiseGrade(g) {
  const i = OWL_GRADES.indexOf(g);
  return OWL_GRADES[Math.max(i - 1, 0)];
}

function hashForExam(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function createInitialPatronus(year, talents) {
  if (year < 3) {
    return { form: null, status: 'unknown', note: '尚未学习守护神咒' };
  }
  if (year === 3) {
    return { form: null, status: 'learning', note: '正在卢平教授指导下学习' };
  }
  // 四年级以上若已有守护神咒，可能已有形态或 glimpsed
  const hasPatronusTalent = talents.includes('黑魔法防御术优秀') || talents.includes('决斗擅长');
  if (year >= 4 && hasPatronusTalent) {
    return { form: null, status: 'glimpsed', note: '曾瞥见银白身影，形态尚不清晰' };
  }
  return { form: null, status: 'unknown', note: '尚未成功召唤有形守护神' };
}

function createInitialOWLs(subjects, year, profile) {
  if (year < 5) return { status: null, results: null, accidents: 0, takenYear: null };
  if (year === 5) return { status: 'preparing', results: null, accidents: 0, takenYear: null };
  const { results, accidents } = computeOWLResults(subjects, year, profile);
  return { status: 'completed', results, accidents, takenYear: 5 };
}

/** 才能 → 学科加成 */
const TALENT_BONUSES = {
  '魔药天才': { potions: 18 },
  '变形术高手': { transfiguration: 18 },
  '黑魔法防御术优秀': { dada: 18 },
  '魔咒创新': { charms: 18 },
  '神奇生物亲和': { care: 15, herbology: 8 },
  '天文爱好者': { astronomy: 15 },
  '占卜直觉': { divination: 12 },
  '决斗擅长': { dada: 10, charms: 8 },
  '治疗咒专长': { charms: 10 },
  '破咒天赋': { dada: 12 },
  '大脑封闭术天赋': { dada: 8 },
  '古代魔文学霸': { charms: 8, transfiguration: 6 },
  '魁地奇尖子': {},
  '傲罗家族背景': { dada: 8, charms: 6 },
};

/**
 * 咒语目录（贴近原著，按最低年级划分）
 * subject: charms | transfiguration | potions | dada | herbology | care | divination | astronomy | utility
 */
export const SPELL_CATALOG = [
  // —— 一年级 ——
  { id: 'lumos', name: '荧光闪烁', incantation: 'Lumos', subject: 'charms', minYear: 1, tier: '初阶', desc: '杖尖亮起微光，照亮黑暗' },
  { id: 'nox', name: '熄灭如初', incantation: 'Nox', subject: 'charms', minYear: 1, tier: '初阶', desc: '熄灭 Lumos 的光芒' },
  { id: 'wingardium_leviosa', name: '漂浮咒', incantation: 'Wingardium Leviosa', subject: 'charms', minYear: 1, tier: '初阶', desc: '使物体悬浮飘动' },
  { id: 'alohomora', name: '开锁咒', incantation: 'Alohomora', subject: 'charms', minYear: 1, tier: '初阶', desc: '打开未受魔法保护的锁' },
  { id: 'vermillious', name: '红色火花', incantation: 'Vermillious', subject: 'charms', minYear: 1, tier: '初阶', desc: '杖尖迸出红色火花，可作信号' },
  { id: 'witchs_brew', name: '疥疮药水', incantation: '—', subject: 'potions', minYear: 1, tier: '初阶', desc: '一年级魔药入门，治疗疥疮' },
  { id: 'herbology_basics', name: '白鲜与曼德拉草', incantation: '—', subject: 'herbology', minYear: 1, tier: '初阶', desc: '识别基础药用植物' },

  // —— 二年级 ——
  { id: 'expelliarmus', name: '除你武器', incantation: 'Expelliarmus', subject: 'dada', minYear: 2, tier: '中阶', desc: '击飞对手魔杖，经典决斗咒' },
  { id: 'rictusempra', name: '痒痒咒', incantation: 'Rictusempra', subject: 'charms', minYear: 2, tier: '初阶', desc: '使目标无法控制地发痒大笑' },
  { id: 'tarantallegra', name: '锁腿咒', incantation: 'Tarantallegra', subject: 'charms', minYear: 2, tier: '初阶', desc: '使双腿不受控地跳起踢踏舞' },
  { id: 'fumos', name: '烟雾咒', incantation: 'Fumos', subject: 'charms', minYear: 2, tier: '初阶', desc: '杖尖喷出浓烟掩护' },
  { id: 'petrificus_totalus', name: '石化咒', incantation: 'Petrificus Totalus', subject: 'dada', minYear: 2, tier: '中阶', desc: '使全身僵硬倒地，如同石化' },
  { id: 'polyjuice', name: '复方汤剂', incantation: '—', subject: 'potions', minYear: 2, tier: '中阶', desc: '饮用后可变成他人样貌，需严格配方' },
  { id: 'mandrake', name: '曼德拉草处理', incantation: '—', subject: 'herbology', minYear: 2, tier: '初阶', desc: '佩戴耳罩处理尖叫的曼德拉草' },

  // —— 三年级 ——
  { id: 'riddikulus', name: '滑稽咒', incantation: 'Riddikulus', subject: 'dada', minYear: 3, tier: '中阶', desc: '将博格特变成可笑之物，驱散恐惧' },
  { id: 'lumos_maxima', name: '强光闪烁', incantation: 'Lumos Maxima', subject: 'charms', minYear: 3, tier: '中阶', desc: '释放耀眼强光，照亮大片区域' },
  { id: 'expecto_patronum', name: '守护神咒', incantation: 'Expecto Patronum', subject: 'dada', minYear: 3, tier: '高阶', desc: '召唤银白色守护神，驱散摄魂怪' },
  { id: 'animagus_theory', name: '阿尼马格斯理论', incantation: '—', subject: 'transfiguration', minYear: 3, tier: '高阶', desc: '变形术高阶理论，非一般学生可掌握' },
  { id: 'buckbeak', name: '鹰头马身有翼兽', incantation: '—', subject: 'care', minYear: 3, tier: '初阶', desc: '接近与鞠躬礼仪，海格教授' },

  // —— 四年级 ——
  { id: 'stupefy', name: '昏迷咒', incantation: 'Stupefy', subject: 'dada', minYear: 4, tier: '中阶', desc: '红光击中目标使其昏迷' },
  { id: 'accio', name: '召唤咒', incantation: 'Accio', subject: 'charms', minYear: 4, tier: '中阶', desc: '从远处召唤物体飞来' },
  { id: 'repello', name: '铁甲咒', incantation: 'Protego', subject: 'dada', minYear: 4, tier: '中阶', desc: '制造魔法护盾抵挡咒语' },
  { id: 'bubble_head', name: '泡头咒', incantation: 'Bubble-Head Charm', subject: 'charms', minYear: 4, tier: '中阶', desc: '头部周围形成空气泡，水下呼吸' },
  { id: 'gillyweed', name: '鳃囊草', incantation: '—', subject: 'care', minYear: 4, tier: '中阶', desc: '食用后在水中获得鳃和蹼' },

  // —— 五年级 ——
  { id: 'silencio', name: '无声咒', incantation: 'Silencio', subject: 'charms', minYear: 5, tier: '中阶', desc: '使目标无法发声' },
  { id: 'reducto', name: '粉碎咒', incantation: 'Reducto', subject: 'dada', minYear: 5, tier: '中阶', desc: '粉碎固体障碍物' },
  { id: 'occlumency', name: '大脑封闭术', incantation: '—', subject: 'dada', minYear: 5, tier: '高阶', desc: '封闭心灵，抵御摄神取念' },
  { id: 'levicorpus', name: '倒挂金钟', incantation: 'Levicorpus', subject: 'charms', minYear: 5, tier: '中阶', desc: '将目标倒吊在空中（混血王子笔记）' },
  { id: 'sectumsempra', name: '神锋无影', incantation: 'Sectumsempra', subject: 'dada', minYear: 5, tier: '禁忌', desc: '混血王子发明，造成深可见骨的切割伤' },

  // —— 六年级 ——
  { id: 'confundo', name: '混淆咒', incantation: 'Confundo', subject: 'charms', minYear: 6, tier: '中阶', desc: '使目标 confused，行动失误' },
  { id: 'incendio', name: '烈火咒', incantation: 'Incendio', subject: 'charms', minYear: 6, tier: '中阶', desc: '从杖尖射出火焰' },
  { id: 'aguamenti', name: '清水如泉', incantation: 'Aguamenti', subject: 'charms', minYear: 6, tier: '中阶', desc: '杖尖涌出清澈水流' },
  { id: 'felix_felicis', name: '福灵剂', incantation: '—', subject: 'potions', minYear: 6, tier: '高阶', desc: '液态幸运，斯拉格霍恩教授，极难 brew' },

  // —— 七年级 ——
  { id: 'reparo', name: '修复咒', incantation: 'Reparo', subject: 'charms', minYear: 7, tier: '中阶', desc: '修复被损坏的物品' },
  { id: 'impedimenta', name: '障碍咒', incantation: 'Impedimenta', subject: 'dada', minYear: 7, tier: '中阶', desc: '减缓或绊住冲来的目标' },
  { id: 'finite', name: '通用反咒', incantation: 'Finite Incantatem', subject: 'charms', minYear: 2, tier: '初阶', desc: '终止大多数持续性魔咒效果' },
];

export function getSpellById(id) {
  return SPELL_CATALOG.find((s) => s.id === id);
}

export function getMasteryLabel(mastery) {
  const m = Math.max(0, Math.min(100, mastery ?? 0));
  if (m >= 95) return '大师';
  if (m >= 80) return '精通';
  if (m >= 60) return '熟练';
  if (m >= 30) return '入门';
  return '初学';
}

export function getOverallMagicLabel(avgSkill) {
  const s = avgSkill ?? 0;
  if (s >= 85) return '杰出女巫';
  if (s >= 70) return '优秀巫师';
  if (s >= 55) return '合格巫师';
  if (s >= 35) return '魔法学徒';
  return '魔法初学者';
}

function baseSubjectSkills(year) {
  const base = 18 + (year - 1) * 8;
  const skills = {};
  MAGIC_SUBJECTS.forEach((sub, i) => {
    const jitter = (i % 3) - 1;
    skills[sub.id] = Math.min(82, base + jitter);
  });
  return skills;
}

function applyTalentBonuses(skills, talents = []) {
  const next = { ...skills };
  for (const talent of talents) {
    const bonus = TALENT_BONUSES[talent];
    if (!bonus) continue;
    for (const [key, val] of Object.entries(bonus)) {
      next[key] = Math.min(95, (next[key] ?? 0) + val);
    }
  }
  return next;
}

/** 根据年级推算应已掌握的咒语及熟练度 */
function initialSpells(year, talents = []) {
  const eligible = SPELL_CATALOG.filter((s) => s.minYear <= year && s.incantation !== '—');
  const spells = [];

  for (const spell of eligible) {
    const yearsHeld = year - spell.minYear;
    let mastery = 25 + yearsHeld * 12;

    // 高年级起始更熟练
    if (yearsHeld >= 3) mastery += 10;
    if (spell.tier === '高阶') mastery -= 15;
    if (spell.tier === '禁忌') mastery -= 25;

    // 才能加成
    if (talents.includes('魔咒创新') && spell.subject === 'charms') mastery += 8;
    if (talents.includes('黑魔法防御术优秀') && spell.subject === 'dada') mastery += 8;
    if (talents.includes('决斗擅长') && ['dada', 'charms'].includes(spell.subject)) mastery += 5;

    // 守护神咒特殊：三年级刚学，默认较低
    if (spell.id === 'expecto_patronum' && year <= 4) mastery = Math.min(mastery, 35);
    if (spell.id === 'sectumsempra') mastery = Math.min(mastery, 20);

    mastery = Math.max(15, Math.min(88, mastery));

    spells.push({
      id: spell.id,
      mastery,
      learnedWeek: null,
    });
  }

  return spells;
}

/** 魔药/草药等非咒语技能条目 */
function initialKnowledge(year) {
  const knowledge = [];
  const nonIncantation = SPELL_CATALOG.filter((s) => s.incantation === '—' && s.minYear <= year);
  for (const item of nonIncantation) {
    const yearsHeld = year - item.minYear;
    let mastery = 30 + yearsHeld * 10;
    if (item.tier === '高阶') mastery -= 10;
    mastery = Math.max(20, Math.min(85, mastery));
    knowledge.push({ id: item.id, mastery, learnedWeek: null });
  }
  return knowledge;
}

export function createInitialMagic(profile) {
  const year = profile.year ?? 1;
  const talents = profile.talents ?? [];
  const subjects = applyTalentBonuses(baseSubjectSkills(year), talents);
  const spells = initialSpells(year, talents);
  const knowledge = initialKnowledge(year);

  const avgSkill = Object.values(subjects).reduce((a, b) => a + b, 0) / MAGIC_SUBJECTS.length;

  return {
    rank: getOverallMagicLabel(avgSkill),
    subjects,
    spells,
    knowledge,
    notable: buildNotableNotes(talents, year),
    patronus: createInitialPatronus(year, talents),
    owls: createInitialOWLs(subjects, year, profile),
  };
}

function buildNotableNotes(talents, year) {
  const notes = [];
  if (talents.includes('魁地奇尖子')) notes.push('飞行天赋出众');
  if (talents.includes('大脑封闭术天赋')) notes.push('对封闭心灵有天然直觉');
  if (talents.includes('古代魔文学霸')) notes.push('识读古代如尼文');
  if (year >= 5 && year < 6) notes.push('O.W.L. 备考中');
  if (year >= 6) notes.push('O.W.L. 已考完');
  if (year >= 7) notes.push('N.E.W.T. 冲刺阶段');
  return notes;
}

/** 旧存档迁移 */
export function migrateMagic(state) {
  if (state.magic?.subjects && state.magic?.spells) {
    const normalized = normalizeMagic(state.magic);
    if (!normalized.patronus?.status) {
      normalized.patronus = createInitialPatronus(state.profile?.year ?? 1, state.profile?.talents ?? []);
    }
    if (normalized.owls?.status === undefined || (state.profile?.year >= 6 && !normalized.owls?.results)) {
      normalized.owls = createInitialOWLs(
        normalized.subjects,
        state.profile?.year ?? 1,
        state.profile ?? {}
      );
    }
    return normalized;
  }
  return createInitialMagic(state.profile || { year: 1, talents: [] });
}

function normalizeMagic(magic) {
  const subjects = { ...magic.subjects };
  for (const sub of MAGIC_SUBJECTS) {
    if (subjects[sub.id] === undefined) subjects[sub.id] = 20;
    subjects[sub.id] = Math.max(0, Math.min(100, subjects[sub.id]));
  }

  const spells = (magic.spells || []).map((s) => ({
    id: s.id,
    mastery: Math.max(0, Math.min(100, s.mastery ?? 20)),
    learnedWeek: s.learnedWeek ?? null,
  }));

  const knowledge = (magic.knowledge || []).map((k) => ({
    id: k.id,
    mastery: Math.max(0, Math.min(100, k.mastery ?? 20)),
    learnedWeek: k.learnedWeek ?? null,
  }));

  const avgSkill = Object.values(subjects).reduce((a, b) => a + b, 0) / MAGIC_SUBJECTS.length;

  return {
    rank: magic.rank || getOverallMagicLabel(avgSkill),
    subjects,
    spells,
    knowledge,
    notable: magic.notable || [],
    patronus: magic.patronus || { form: null, status: 'unknown', note: '' },
    owls: magic.owls || { status: null, results: null, accidents: 0, takenYear: null },
  };
}

/** 合并 AI 返回的 magic 更新 */
export function mergeMagicUpdate(current, update) {
  if (!update) return current;
  const next = normalizeMagic(structuredClone(current));

  if (update.subjects) {
    for (const [key, val] of Object.entries(update.subjects)) {
      if (typeof val === 'number') {
        const old = next.subjects[key] ?? 20;
        const delta = Math.sign(val - old) * Math.min(Math.abs(val - old), 5);
        next.subjects[key] = Math.max(0, Math.min(100, old + delta));
      }
    }
  }

  if (update.rank) next.rank = update.rank;

  if (update.notable) {
    next.notable = [...new Set([...(next.notable || []), ...update.notable])].slice(0, 6);
  }

  if (update.spellsLearned) {
    for (const entry of update.spellsLearned) {
      const id = typeof entry === 'string' ? entry : entry.id;
      const catalog = getSpellById(id);
      if (!catalog) continue;
      const existing = next.spells.find((s) => s.id === id);
      const mastery = typeof entry === 'object' ? (entry.mastery ?? 30) : 30;
      if (existing) {
        existing.mastery = Math.max(existing.mastery, Math.min(100, mastery));
      } else {
        next.spells.push({
          id,
          mastery: Math.max(20, Math.min(60, mastery)),
          learnedWeek: entry.learnedWeek ?? null,
        });
      }
    }
  }

  if (update.spellsImproved) {
    for (const entry of update.spellsImproved) {
      const id = typeof entry === 'string' ? entry : entry.id;
      const delta = typeof entry === 'object' ? (entry.delta ?? 5) : 5;
      const existing = next.spells.find((s) => s.id === id);
      if (existing) {
        existing.mastery = Math.max(0, Math.min(100, existing.mastery + Math.min(delta, 10)));
      }
    }
  }

  if (update.knowledgeLearned) {
    for (const entry of update.knowledgeLearned) {
      const id = typeof entry === 'string' ? entry : entry.id;
      const existing = next.knowledge.find((k) => k.id === id);
      const mastery = typeof entry === 'object' ? (entry.mastery ?? 35) : 35;
      if (existing) {
        existing.mastery = Math.max(existing.mastery, Math.min(100, mastery));
      } else {
        next.knowledge.push({ id, mastery: Math.max(25, Math.min(65, mastery)), learnedWeek: null });
      }
    }
  }

  if (update.patronus) {
    next.patronus = { ...next.patronus, ...update.patronus };
  }

  if (update.owls) {
    if (update.owls.status) next.owls.status = update.owls.status;
    if (update.owls.results) {
      next.owls.results = { ...(next.owls.results || {}), ...update.owls.results };
      next.owls.status = 'completed';
      next.owls.takenYear = update.owls.takenYear ?? next.owls.takenYear ?? 5;
    }
    if (update.owls.accidents !== undefined) next.owls.accidents = update.owls.accidents;
  }

  const avgSkill = Object.values(next.subjects).reduce((a, b) => a + b, 0) / MAGIC_SUBJECTS.length;
  next.rank = getOverallMagicLabel(avgSkill);

  return next;
}

export function getMagicSummary(magic) {
  const spellCount = magic.spells?.length ?? 0;
  const mastered = (magic.spells || []).filter((s) => s.mastery >= 80).length;
  return { spellCount, mastered, rank: magic.rank };
}
