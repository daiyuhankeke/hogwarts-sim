/**
 * 家庭背景：神圣二十八家族、麻瓜态度、父母信息与原著关联
 */

import { pickHouseholdByOrigin, resolveDefaultOrigin, resolveOriginLabel } from './character-lore.js';

/** @typedef {'极端鄙视麻瓜'|'传统纯血主义'|'中立保守'|'改良派'|'亲麻瓜'} FamilyMuggleAttitude */

export const PLAYER_MUGGLE_ATTITUDES = [
  { value: 'inherit', label: '与家族相同（血统观念）' },
  { value: 'more_extreme', label: '比家族更极端（纯血优越）' },
  { value: 'more_open', label: '比家族更开明（尊重麻瓜）' },
  { value: 'neutral', label: '个人中立，不太关心血统' },
  { value: 'muggle_culture', label: '欣赏麻瓜文化与科技' },
  { value: 'against_voldemort', label: '反对伏地魔（或与家族黑暗立场决裂）' },
];

/** 与食死徒/黑魔法界关联较深的家族 id */
export const DARK_TIED_FAMILY_IDS = new Set([
  'avery', 'lestrange', 'rowle', 'yaxley', 'rosier', 'selwyn', 'travers',
  'malfoy', 'black', 'crabbe', 'nott', 'flint', 'gaunt',
]);

export function isDarkTiedFamily(family) {
  return DARK_TIED_FAMILY_IDS.has(family?.familyId);
}

export function resolveEffectiveBloodAttitude(family) {
  if (!family || family.bloodStatus === '麻瓜出身') return null;
  const v = family.playerMuggleAttitude;
  if (v === 'inherit' || v === 'against_voldemort') return family.familyMuggleAttitude;
  if (v === 'more_extreme') return '极端鄙视麻瓜';
  if (v === 'more_open') return '改良派';
  if (v === 'neutral') return '中立保守';
  if (v === 'muggle_culture') return '亲麻瓜';
  return family.familyMuggleAttitude;
}

/** 侧栏与 prompt 用的完整展示文案 */
export function formatPlayerAttitudeDisplay(family) {
  if (!family || family.bloodStatus === '麻瓜出身') return null;
  const v = family.playerMuggleAttitude;
  if (v === 'inherit' && family.familyMuggleAttitude) {
    return `与家族相同（${family.familyMuggleAttitude}）`;
  }
  if (v === 'against_voldemort') {
    const blood = family.familyMuggleAttitude ? `血统 ${family.familyMuggleAttitude} · ` : '';
    return `${blood}反对伏地魔`;
  }
  return resolvePlayerMuggleAttitudeLabel(v, family.bloodStatus);
}

export function enrichFamilyMetadata(family) {
  if (!family) return family;
  if (family.bloodStatus === '麻瓜出身') {
    return sanitizeMugglebornFamily(family);
  }
  family.hasDarkTies = isDarkTiedFamily(family);
  family.resolvedPlayerMuggleAttitude = resolveEffectiveBloodAttitude(family);
  family.playerMuggleAttitudeDisplay = formatPlayerAttitudeDisplay(family);
  if (family.playerMuggleAttitudeDisplay) {
    family.playerMuggleAttitudeLabel = family.playerMuggleAttitudeDisplay;
  }
  return family;
}

/** 供 AI：血统观念 vs 黑魔王政治立场 */
export function getFamilyPoliticalContext(state) {
  const family = state?.profile?.family;
  if (!family || family.bloodStatus === '麻瓜出身') {
    return {
      hasDarkTies: false,
      rules: ['玩家父母均为麻瓜，与纯血/巫师家族无血缘或商业往来；勿写马尔福家宴会、魔法部同事等巫师界关联。'],
      dmHint: '麻瓜家庭：父母不知魔法界，与巫师家族无关联；格兰杰家等同为麻瓜邻居/同事可自然提及。',
    };
  }

  const year = state?.profile?.year ?? 1;
  const attitude = family.playerMuggleAttitude;
  const dark = family.hasDarkTies ?? isDarkTiedFamily(family);
  const rules = [
    '「对麻瓜/血统态度」与「是否效忠伏地魔」是两层设定；勿混为一谈。',
  ];

  if (attitude === 'against_voldemort') {
    rules.push(
      '玩家明确反对伏地魔/可能与家族黑暗立场决裂；参与 D.A.、抵抗卡罗等符合设定。',
      dark
        ? `须偶尔提及${family.familyLabel}家族施压、监视或断绝往来，勿写成家人也支持抵抗。`
        : '按 family.summary 展开家庭线即可。',
    );
  } else if (dark && (attitude === 'inherit' || attitude === 'more_extreme')) {
    rules.push(
      `玩家血统观念与${family.familyLabel}家族一致（${family.familyMuggleAttitude}）；家族与黑魔法界关系密切。`,
    );
    if (year >= 6) {
      rules.push(
        '若参与抵抗食死徒/邓布利多军：须写秘密行动、内心撕裂、假意配合或已与家族决裂等动机；',
        '禁止写成家族不知情、毫无风险地公开练习守护神、与卢娜等人轻松搞抵抗。',
      );
    }
    if (attitude === 'inherit') {
      rules.push(`叙事须体现对麻瓜/麻瓜出身的${family.familyMuggleAttitude}态度，勿写成天然亲麻瓜。`);
    }
  } else if (dark && ['more_open', 'neutral', 'muggle_culture'].includes(attitude)) {
    rules.push(
      `玩家血统观念较${family.familyLabel}家族开明；抵抗伏地魔符合个人立场，但家族可能来信施压或表示失望。`,
    );
  } else if (attitude === 'inherit' && family.familyMuggleAttitude) {
    rules.push(`玩家对麻瓜/麻瓜出身：与家族相同（${family.familyMuggleAttitude}）。`);
  }

  return {
    hasDarkTies: dark,
    playerAttitude: attitude,
    resolvedBloodAttitude: family.resolvedPlayerMuggleAttitude || resolveEffectiveBloodAttitude(family),
    displayLabel: family.playerMuggleAttitudeDisplay || formatPlayerAttitudeDisplay(family),
    rules,
    dmHint: rules.join(' '),
  };
}

/** 神圣二十八家族（含原著麻瓜态度） */
export const SACRED_28_FAMILIES = [
  { id: 'abbott', surname: 'Abbott', label: '艾博', attitude: '中立保守', blurb: '古老纯血，低调守旧' },
  { id: 'avery', surname: 'Avery', label: '埃弗里', attitude: '极端鄙视麻瓜', blurb: '与黑魔法界关系密切' },
  { id: 'black', surname: 'Black', label: '布莱克', attitude: '极端鄙视麻瓜', blurb: '「永远纯洁」家规闻名' },
  { id: 'bulstrode', surname: 'Bulstrode', label: '布尔斯特罗德', attitude: '传统纯血主义', blurb: '重视联姻与体面' },
  { id: 'burke', surname: 'Burke', label: '博克', attitude: '传统纯血主义', blurb: '博金-博克店主一脉' },
  { id: 'crabbe', surname: 'Crabbe', label: '克拉布', attitude: '极端鄙视麻瓜', blurb: '克拉布父子所属家族' },
  { id: 'crouch', surname: 'Crouch', label: '克劳奇', attitude: '传统纯血主义', blurb: '魔法部名门，规矩严苛' },
  { id: 'fawley', surname: 'Fawley', label: '福雷', attitude: '中立保守', blurb: '古老但非一线政治家族' },
  { id: 'flint', surname: 'Flint', label: '弗林特', attitude: '极端鄙视麻瓜', blurb: '斯莱特林魁地奇弗林特所属' },
  { id: 'gaunt', surname: 'Gaunt', label: '冈特', attitude: '极端鄙视麻瓜', blurb: '萨拉查·斯莱特林后裔，日渐没落' },
  { id: 'green', surname: 'Green', label: '格林', attitude: '中立保守', blurb: '纯血名录常见姓氏' },
  { id: 'greengrass', surname: 'Greengrass', label: '格林格拉斯', attitude: '传统纯血主义', blurb: '德拉科·马尔福联姻对象家族' },
  { id: 'lestrange', surname: 'Lestrange', label: '莱斯特兰奇', attitude: '极端鄙视麻瓜', blurb: '食死徒核心家族' },
  { id: 'longbottom', surname: 'Longbottom', label: '隆巴顿', attitude: '改良派', blurb: '纳威·隆巴顿家族，立场开明' },
  { id: 'macmillan', surname: 'Macmillan', label: '麦克米兰', attitude: '中立保守', blurb: '赫奇帕奇纯血同学所属' },
  { id: 'malfoy', surname: 'Malfoy', label: '马尔福', attitude: '极端鄙视麻瓜', blurb: '卢修斯·马尔福一脉，纯血政治代表' },
  { id: 'nott', surname: 'Nott', label: '诺特', attitude: '极端鄙视麻瓜', blurb: '古老家族，西奥多·诺特所属' },
  { id: 'ollivander', surname: 'Ollivander', label: '奥利凡德', attitude: '亲麻瓜', blurb: '魔杖匠人，对血统并不偏执' },
  { id: 'parkinson', surname: 'Parkinson', label: '帕金森', attitude: '传统纯血主义', blurb: '潘西·帕金森所属' },
  { id: 'prewett', surname: 'Prewett', label: '普威特', attitude: '改良派', blurb: '莫丽·韦斯莱娘家，凤凰社成员' },
  { id: 'rosier', surname: 'Rosier', label: '罗齐尔', attitude: '极端鄙视麻瓜', blurb: '与黑魔法界交缠的古老姓氏' },
  { id: 'rowle', surname: 'Rowle', label: '罗尔', attitude: '极端鄙视麻瓜', blurb: '食死徒家族' },
  { id: 'selwyn', surname: 'Selwyn', label: '塞尔温', attitude: '极端鄙视麻瓜', blurb: '伏地魔时代效忠家族' },
  { id: 'slughorn', surname: 'Slughorn', label: '斯拉格霍恩', attitude: '中立保守', blurb: '人脉型教授，重才能与关系' },
  { id: 'smith', surname: 'Smith', label: '史密斯', attitude: '中立保守', blurb: '赫奇帕奇常见纯血姓' },
  { id: 'travers', surname: 'Travers', label: '特拉弗斯', attitude: '极端鄙视麻瓜', blurb: '食死徒家族' },
  { id: 'weasley', surname: 'Weasley', label: '韦斯莱', attitude: '改良派', blurb: '「血统叛徒」但受尊重的开明派' },
  { id: 'yaxley', surname: 'Yaxley', label: '亚克斯利', attitude: '极端鄙视麻瓜', blurb: '魔法部与食死徒双重身份代表' },
];

const RANDOM_ATTITUDES = ['中立保守', '传统纯血主义', '改良派'];

export const CANON_CONNECTION_OPTIONS = [
  { id: 'potter_school', label: '父/母与詹姆·波特或莉莉·伊万斯同届霍格沃茨', tags: ['potter'] },
  { id: 'potter_order', label: '亲属曾参加凤凰社，与波特家交好', tags: ['potter', 'order'] },
  { id: 'potter_work', label: '父/母与波特夫妇在魔法部/傲罗办公室共事', tags: ['potter'] },
  { id: 'weasley_kin', label: '与韦斯莱家族有远亲或联姻关系', tags: ['weasley'] },
  { id: 'weasley_ministry', label: '父/母与亚瑟·韦斯莱在魔法部同部门', tags: ['weasley'] },
  { id: 'weasley_friend', label: '父母与韦斯莱夫妇私交甚笃', tags: ['weasley'] },
  { id: 'granger_colleague', label: '父母与格兰杰夫妇在同城行医/任教', tags: ['granger'] },
  { id: 'granger_neighbor', label: '在伦敦/郊区与格兰杰家为邻或同学会旧识', tags: ['granger'] },
  { id: 'malfoy_social', label: '家族宴会或与马尔福家有商业往来', tags: ['malfoy'] },
  { id: 'malfoy_rival', label: '父/母与卢修斯·马尔福政见相左，曾公开冲突', tags: ['malfoy'] },
  { id: 'longbottom_ally', label: '与隆巴顿夫妇在圣芒戈/凤凰社圈子相识', tags: ['longbottom', 'order'] },
  { id: 'black_kin', label: '与布莱克家族有姻亲（可能已断绝来往）', tags: ['black'] },
  { id: 'snape_school', label: '父/母与斯内普、莉莉同代在霍格沃茨', tags: ['potter'] },
  { id: 'order_member', label: '父或母为凤凰社外围或知情支持者', tags: ['order'] },
  { id: 'deatheater_tie', label: '远房亲戚涉及黑魔法（家族讳莫如深）', tags: ['dark'] },
  { id: 'none', label: '无特殊关联（普通家庭）', tags: [] },
];

const WIZARD_JOBS = [
  '魔法部神奇动物管理控制司职员',
  '魔法部魔法法律执行司傲罗',
  '魔法部魔法交通司职员',
  '霍格沃茨魔咒课助教',
  '圣芒戈魔法伤病医院治疗师',
  '预言家日报记者',
  '古灵阁巫师顾问',
  '对角巷魔药店主',
  '家族庄园管理者',
  '独立魔咒研究者',
  '威森加摩顾问',
  '魁地奇联盟登记员',
];

const MUGGLE_JOBS = [
  '牙医',
  '外科医生',
  '律师',
  '大学讲师',
  '中学教师',
  '软件工程师',
  '建筑师',
  '会计师',
  '记者',
  '图书馆管理员',
  '护士',
  '小企业主',
];

const PERSONALITIES = [
  '温和耐心', '严厉寡言', '幽默健谈', '理性冷静', '护短务实',
  '浪漫理想', '工作狂', '社交达人', '书本型，好读书', '冒险敢为',
];

const APPEARANCES = [
  '高瘦，灰眸，常穿深色长袍',
  '矮壮，红鼻，笑声洪亮',
  '金发齐肩，绿眼睛，仪态优雅',
  '黑发盘起，眼镜，气质干练',
  '雀斑，乱发，手上有墨水渍',
  '魁梧，络腮胡，声音低沉',
  '清秀，薄唇，举止克制',
  '麦色皮肤，卷发，笑容温暖',
];

const MUGGLE_APPEARANCES = [
  '高瘦，灰眸，常穿休闲西装',
  '矮壮，红鼻，笑声洪亮',
  '金发齐肩，绿眼睛，举止得体',
  '黑发盘起，戴细框眼镜，气质干练',
  '雀斑，乱发，手上有咖啡渍',
  '魁梧，络腮胡，声音低沉',
  '清秀，薄唇，衣着整洁',
  '麦色皮肤，卷发，笑容温暖',
];

/** 麻瓜出身家庭仅允许与麻瓜世界/同类家庭相关的关联 */
const MUGGLEBORN_CONNECTION_IDS = new Set(['granger_colleague', 'granger_neighbor', 'none']);

export function getCanonConnectionsForBlood(bloodStatus) {
  if (bloodStatus === '麻瓜出身') {
    return CANON_CONNECTION_OPTIONS.filter((c) => MUGGLEBORN_CONNECTION_IDS.has(c.id));
  }
  return CANON_CONNECTION_OPTIONS;
}

export function sanitizeMugglebornFamily(family) {
  if (!family || family.bloodStatus !== '麻瓜出身') return family;

  family.canonConnections = (family.canonConnections || []).filter((label) => {
    const opt = CANON_CONNECTION_OPTIONS.find((c) => c.label === label);
    return opt && MUGGLEBORN_CONNECTION_IDS.has(opt.id) && opt.id !== 'none';
  });

  for (const role of ['father', 'mother']) {
    const parent = family[role];
    if (!parent) continue;
    if (/长袍|魔杖|巫师/.test(parent.appearance || '')) {
      parent.appearance = pick(makeRng(hashStr(`${parent.name}|fix`)), MUGGLE_APPEARANCES);
    }
    parent.bloodStatus = '麻瓜';
  }

  return family;
}

const HOUSEHOLDS = {
  pureblood_manor: ['威尔特郡庄园', '约克郡古老宅邸', '苏格兰高地城堡', '伦敦纯血社区联排别墅'],
  wizard_ordinary: ['英格兰乡村巫师小屋', '小汉格顿附近巫师宅', '苏格兰巫师小镇住宅', '伦敦魔法社区中层联排'],
  wizard_urban: ['伦敦魔法社区公寓', '对角巷附近联排', '霍格莫德周末屋'],
  muggle_suburb: ['伦敦郊区', '曼彻斯特', '伯明翰', '爱丁堡'],
  muggle_urban: ['伦敦肯辛顿', '伦敦克拉彭', '布里斯托'],
};

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function makeRng(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function getFamilyById(id) {
  return SACRED_28_FAMILIES.find((f) => f.id === id) || null;
}

export function resolvePlayerMuggleAttitudeLabel(value, bloodStatus) {
  if (bloodStatus === '麻瓜出身' || !value) return null;
  return PLAYER_MUGGLE_ATTITUDES.find((a) => a.value === value)?.label || value;
}

export function resolveFamilyAttitude(familyDef, customAttitude) {
  if (customAttitude) return customAttitude;
  if (!familyDef) return pick(makeRng(42), RANDOM_ATTITUDES);
  if (familyDef.attitude === 'random') return pick(makeRng(hashStr(familyDef.id)), RANDOM_ATTITUDES);
  return familyDef.attitude;
}

function pickFamily(seed, familyId) {
  if (familyId && familyId !== 'random' && familyId !== 'custom') {
    return getFamilyById(familyId);
  }
  const rng = makeRng(seed);
  return SACRED_28_FAMILIES[Math.floor(rng() * SACRED_28_FAMILIES.length)];
}

function pickCanonConnections(rng, bloodStatus, familyDef, manualIds) {
  if (bloodStatus === '麻瓜出身') {
    const allowed = CANON_CONNECTION_OPTIONS.filter((c) => MUGGLEBORN_CONNECTION_IDS.has(c.id) && c.id !== 'none');
    if (manualIds?.length) {
      return manualIds
        .map((id) => allowed.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => c.label);
    }
    const count = rng() > 0.45 ? (rng() > 0.75 ? 2 : 1) : 0;
    const chosen = [];
    const shuffled = [...allowed].sort(() => rng() - 0.5);
    for (const c of shuffled) {
      if (chosen.length >= count) break;
      if (!chosen.includes(c.label)) chosen.push(c.label);
    }
    return chosen;
  }

  if (manualIds?.length) {
    return manualIds
      .map((id) => CANON_CONNECTION_OPTIONS.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => c.label);
  }

  const pool = CANON_CONNECTION_OPTIONS.filter((c) => c.id !== 'none');
  const tags = [];
  if (familyDef?.id === 'malfoy') tags.push('malfoy');
  if (familyDef?.id === 'weasley' || familyDef?.id === 'prewett') tags.push('weasley');
  if (familyDef?.id === 'longbottom') tags.push('longbottom');
  if (familyDef?.id === 'black') tags.push('black');
  if (['avery', 'lestrange', 'rowle', 'yaxley', 'rosier'].includes(familyDef?.id)) tags.push('dark');

  let candidates = pool;
  if (tags.length) {
    const tagged = pool.filter((c) => c.tags.some((t) => tags.includes(t)));
    if (tagged.length) candidates = tagged;
  }

  const count = rng() > 0.35 ? (rng() > 0.7 ? 2 : 1) : 0;
  const chosen = [];
  const shuffled = [...candidates].sort(() => rng() - 0.5);
  for (const c of shuffled) {
    if (chosen.length >= count) break;
    if (!chosen.includes(c.label)) chosen.push(c.label);
  }
  return chosen;
}

function buildParent(rng, role, bloodStatus, familyDef, overrides = {}) {
  const isWizardSide = overrides.isWizardSide === true;
  const isWizard = bloodStatus === '纯血' || (bloodStatus === '混血' && isWizardSide);
  const jobs = isWizard ? WIZARD_JOBS : MUGGLE_JOBS;

  const familySurname = familyDef?.label || familyDef?.surname || pick(rng, ['布朗', '克拉克', '伊万斯', '怀特', '陈', '格林', '伍德']);
  const surname = overrides.surname
    || (isWizardSide && familyDef ? familySurname : pick(rng, ['Brown', 'Clark', 'Evans', 'White', 'Chen', 'Green', 'Wood']));

  const defaultName = role === 'father'
    ? `${pick(rng, ['威廉', '亨利', '爱德华', '托马斯', '乔治', '理查德', '亚瑟'])}·${surname}`
    : `${pick(rng, ['玛丽', '艾琳', '凯瑟琳', '海伦', '朱莉亚', '安娜', '莫丽'])}·${overrides.maidenName || surname}`;

  let parentBloodStatus = '麻瓜';
  if (isWizard) {
    parentBloodStatus = '纯血';
  } else if (bloodStatus === '混血') {
    parentBloodStatus = overrides.muggleParentBlood || (rng() < 0.35 ? '麻瓜出身' : '麻瓜');
  } else if (bloodStatus === '麻瓜出身') {
    parentBloodStatus = '麻瓜';
  }

  return {
    role,
    name: (overrides.name || '').trim() || defaultName,
    bloodStatus: overrides.bloodStatus || parentBloodStatus,
    appearance: (overrides.appearance || '').trim() || pick(rng, isWizard ? APPEARANCES : MUGGLE_APPEARANCES),
    personality: (overrides.personality || '').trim() || pick(rng, PERSONALITIES),
    occupation: (overrides.occupation || '').trim() || pick(rng, jobs),
    alive: overrides.alive !== false,
    expelledFromFamily: overrides.expelledFromFamily === true,
    familyRelation: overrides.familyRelation || null,
  };
}

function applyHalfBloodEstrangement(family, rng) {
  if (family.bloodStatus !== '混血' || !isFamilyDespisesMuggles(family.familyMuggleAttitude)) {
    family.estrangedFromFamily = false;
    family.familyStanding = family.bloodStatus === '纯血' ? 'member' : 'mixed';
    return;
  }

  const wizardSide = family.wizardParentSide === 'mother' ? 'mother' : 'father';
  const muggleSide = wizardSide === 'father' ? 'mother' : 'father';
  const wizardParent = family[wizardSide];
  const muggleParent = family[muggleSide];
  if (!wizardParent || !muggleParent) return;

  const muggleLabel = muggleParent.bloodStatus === '麻瓜出身' ? '麻瓜出身巫师' : '麻瓜';

  family.estrangedFromFamily = true;
  family.familyStanding = 'expelled';
  family.household = pick(rng, [...HOUSEHOLDS.wizard_urban, ...HOUSEHOLDS.muggle_suburb, ...HOUSEHOLDS.muggle_urban]);

  wizardParent.expelledFromFamily = true;
  wizardParent.familyRelation = `已被${family.familyLabel}家族除名`;
  muggleParent.familyRelation = `与${family.familyLabel}家族无血缘；因联姻/结合，巫师侧已被除名`;

  family.estrangementNote =
    `${wizardParent.name}（${family.familyLabel}一脉）因与${muggleLabel}${muggleParent.name}结合，`
    + `被${family.familyLabel}家族驱逐除名；`
    + `家庭现居${family.household}，与${family.familyLabel}本家断绝正式往来。`;
}

/**
 * @param {object} input
 * @param {string} input.bloodStatus
 * @param {string} input.name - player name for seed
 * @param {string} [input.wizardFamilyId]
 * @param {string} [input.customFamilySurname]
 * @param {string} [input.wizardParentSide] - father|mother
 * @param {string} [input.playerMuggleAttitude]
 * @param {boolean} [input.autoGenerate]
 * @param {object} [input.manual]
 */
export function buildFamilyBackground(input) {
  const {
    bloodStatus,
    name = 'player',
    house = '',
    wizardFamilyId = 'random',
    customFamilySurname = '',
    wizardParentSide = 'father',
    playerMuggleAttitude = 'inherit',
    originBackground = resolveDefaultOrigin(bloodStatus),
    autoGenerate = true,
    manual = {},
  } = input;

  const seed = hashStr(`${name}|${house}|${bloodStatus}|${wizardFamilyId}|${customFamilySurname}`);
  const rng = makeRng(seed);

  /** @type {object} */
  const family = {
    bloodStatus,
    playerMuggleAttitude,
    playerMuggleAttitudeLabel: resolvePlayerMuggleAttitudeLabel(playerMuggleAttitude, bloodStatus),
    sacred28: false,
    familyId: null,
    surname: null,
    familyLabel: null,
    familyMuggleAttitude: null,
    originBackground,
    household: null,
    wizardParentSide: bloodStatus === '混血' ? wizardParentSide : null,
    father: null,
    mother: null,
    canonConnections: [],
    estrangedFromFamily: false,
    familyStanding: null,
    estrangementNote: null,
    summary: '',
  };

  if (bloodStatus === '麻瓜出身') {
    family.playerMuggleAttitude = null;
    family.playerMuggleAttitudeLabel = null;
    family.household = pickHouseholdByOrigin(originBackground, bloodStatus, rng, HOUSEHOLDS);
    family.familyMuggleAttitude = '不适用（麻瓜家庭）';

    if (autoGenerate) {
      family.father = buildParent(rng, 'father', bloodStatus, null, manual.father);
      family.mother = buildParent(rng, 'mother', bloodStatus, null, {
        ...manual.mother,
        maidenName: manual.mother?.maidenName || pick(rng, ['Granger', 'Evans', 'Wilson', 'Taylor', 'Thomas']),
      });
    } else {
      family.father = buildParent(rng, 'father', bloodStatus, null, { ...manual.father, ...manual.father });
      family.mother = buildParent(rng, 'mother', bloodStatus, null, manual.mother);
    }

    family.canonConnections = pickCanonConnections(rng, bloodStatus, null, manual.canonConnectionIds);
    family.summary = `麻瓜出身，成长于${family.household}。父：${family.father.name}（${family.father.occupation}）；母：${family.mother.name}（${family.mother.occupation}）。`;
    return sanitizeMugglebornFamily(family);
  }

  let familyDef = null;
  if (bloodStatus === '纯血' || bloodStatus === '混血') {
    if (wizardFamilyId === 'custom' && customFamilySurname.trim()) {
      const customAttitude = pick(rng, RANDOM_ATTITUDES);
      familyDef = {
        id: 'custom',
        surname: customFamilySurname.trim(),
        label: customFamilySurname.trim(),
        attitude: customAttitude,
        blurb: '自拟纯血家族',
      };
    } else {
      familyDef = pickFamily(seed, wizardFamilyId);
    }
  }

  if (bloodStatus === '纯血' || bloodStatus === '混血') {
    family.sacred28 = wizardFamilyId !== 'custom' && !!getFamilyById(familyDef?.id);
    family.familyId = familyDef?.id || null;
    family.surname = familyDef?.surname || null;
    family.familyLabel = familyDef?.label || familyDef?.surname || null;
    family.familyMuggleAttitude = resolveFamilyAttitude(familyDef);
  }

  if (bloodStatus === '纯血') {
    family.household = pickHouseholdByOrigin(originBackground, bloodStatus, rng, HOUSEHOLDS);
  } else if (bloodStatus === '混血') {
    family.household = pickHouseholdByOrigin(originBackground, bloodStatus, rng, HOUSEHOLDS);
  }

  const wizardSide = wizardParentSide === 'mother' ? 'mother' : 'father';
  const muggleSide = wizardSide === 'father' ? 'mother' : 'father';

  if (autoGenerate) {
    if (bloodStatus === '纯血') {
      family.father = buildParent(rng, 'father', '纯血', familyDef, {
        isWizardSide: true,
        surname: familyDef.surname,
        ...(manual.father || {}),
      });
      family.mother = buildParent(rng, 'mother', '纯血', familyDef, {
        isWizardSide: true,
        maidenName: pick(rng, ['布莱克', '罗齐尔', '格林格拉斯', '麦克米兰', familyDef?.label || familyDef?.surname]),
        ...(manual.mother || {}),
      });
    } else {
      family[wizardSide] = buildParent(rng, wizardSide, bloodStatus, familyDef, {
        isWizardSide: true,
        surname: familyDef.label || familyDef.surname,
        ...(manual[wizardSide] || {}),
      });
      family[muggleSide] = buildParent(rng, muggleSide, bloodStatus, familyDef, {
        isWizardSide: false,
        muggleParentBlood: manual.muggleParentBlood,
        ...(manual[muggleSide] || {}),
      });
    }
  } else {
    family.father = buildParent(rng, 'father', bloodStatus, familyDef, {
      isWizardSide: bloodStatus === '纯血' || wizardSide === 'father',
      surname: familyDef.surname,
      ...(manual.father || {}),
    });
    family.mother = buildParent(rng, 'mother', bloodStatus, familyDef, {
      isWizardSide: bloodStatus === '纯血' || wizardSide === 'mother',
      ...(manual.mother || {}),
    });
  }

  family.canonConnections = pickCanonConnections(rng, bloodStatus, familyDef, manual.canonConnectionIds);

  if (bloodStatus === '混血') {
    applyHalfBloodEstrangement(family, rng);
    if (family.estrangedFromFamily) {
      family.canonConnections = family.canonConnections.filter(
        (c) => !/宴会|商业往来|同族/.test(c)
      );
      if (!family.canonConnections.length) {
        family.canonConnections.push(`与${family.familyLabel}本家关系已断`);
      }
    }
  }

  if (bloodStatus === '纯血' || bloodStatus === '混血') {
    const s28 = family.sacred28 ? '神圣二十八家族' : '纯血家族';
    family.summary = `${bloodStatus}，${s28}「${family.familyLabel}（${family.surname}）」一脉，家族对麻瓜态度：${family.familyMuggleAttitude}。`;
    if (bloodStatus === '混血') {
      const ws = family.wizardParentSide === 'mother' ? '母亲' : '父亲';
      const ms = family.wizardParentSide === 'mother' ? '父亲' : '母亲';
      family.summary += `${ws}为纯血巫师（${family.familyLabel}），${ms}为${family[ms === '父亲' ? 'father' : 'mother'].bloodStatus}。`;
    }
    if (family.estrangementNote) {
      family.summary += `玩家个人态度：${family.playerMuggleAttitudeLabel}。${family.estrangementNote}`;
    } else {
      family.summary += `玩家个人态度：${family.playerMuggleAttitudeLabel}。居于${family.household}。`;
    }
    family.summary += `父：${family.father.name}（${family.father.bloodStatus}，${family.father.occupation}）；`
      + `母：${family.mother.name}（${family.mother.bloodStatus}，${family.mother.occupation}）。`;
  }

  return enrichFamilyMetadata(family);
}

export function normalizeFamily(raw, profileBasics = {}) {
  if (!raw || typeof raw !== 'object') {
    return buildFamilyBackground({
      bloodStatus: profileBasics.bloodStatus || '混血',
      name: profileBasics.name,
      house: profileBasics.house,
    });
  }
  const merged = buildFamilyBackground({
    bloodStatus: raw.bloodStatus || profileBasics.bloodStatus,
    name: profileBasics.name,
    house: profileBasics.house,
    wizardFamilyId: raw.familyId || raw.wizardFamilyId || 'random',
    customFamilySurname: raw.surname || raw.customFamilySurname || '',
    wizardParentSide: raw.wizardParentSide || 'father',
    originBackground: raw.originBackground || resolveDefaultOrigin(raw.bloodStatus || profileBasics.bloodStatus),
    playerMuggleAttitude: raw.playerMuggleAttitude || 'inherit',
    autoGenerate: raw.autoGenerate !== false,
    manual: raw.manual || {},
  });

  if (raw.father?.name) merged.father = { ...merged.father, ...raw.father };
  if (raw.mother?.name) merged.mother = { ...merged.mother, ...raw.mother };
  if (raw.canonConnections?.length) merged.canonConnections = raw.canonConnections;
  if (raw.summary) merged.summary = raw.summary;
  if (raw.estrangementNote) merged.estrangementNote = raw.estrangementNote;
  if (raw.estrangedFromFamily !== undefined) merged.estrangedFromFamily = raw.estrangedFromFamily;
  if (raw.familyStanding) merged.familyStanding = raw.familyStanding;
  return enrichFamilyMetadata(merged);
}

export function formatFamilyForPrompt(family) {
  if (!family) return '';
  let text = `【家庭背景】${family.summary || ''}\n`;
  if (family.originBackground) {
    text += `出身背景：${resolveOriginLabel(family.originBackground)}\n`;
  }
  if (family.father) {
    text += `父亲：${family.father.name}，${family.father.appearance}，性格${family.father.personality}，${family.father.occupation}（${family.father.bloodStatus}）\n`;
  }
  if (family.mother) {
    text += `母亲：${family.mother.name}，${family.mother.appearance}，性格${family.mother.personality}，${family.mother.occupation}（${family.mother.bloodStatus}）\n`;
  }
  if (family.familyMuggleAttitude && family.bloodStatus !== '麻瓜出身') {
    const display = family.playerMuggleAttitudeDisplay || family.playerMuggleAttitudeLabel || family.playerMuggleAttitude;
    text += `家族对麻瓜/麻瓜出身态度：${family.familyMuggleAttitude}；玩家个人：${display}\n`;
  }
  if (family.hasDarkTies && family.playerMuggleAttitude === 'against_voldemort') {
    text += '玩家政治立场：反对伏地魔，可能与家族黑暗传统对立。\n';
  } else if (family.hasDarkTies && family.playerMuggleAttitude === 'inherit') {
    text += `【叙事约束】${family.familyLabel}与黑魔法界关系密切；玩家血统观与家族相同。若写抵抗食死徒须有机密/决裂/内心冲突，勿写成无代价的正义主角。\n`;
  }
  if (family.estrangedFromFamily && family.estrangementNote) {
    text += `家族除名：${family.estrangementNote}\n`;
  }
  if (family.canonConnections?.length) {
    text += `与原著人物/家族可能关联：${family.canonConnections.join('；')}\n`;
  }
  text += '（以上关联仅供参考，叙事中可自然展开，勿强行编造矛盾设定）';
  return text;
}

export function resolveRandomSacred28Family(givenName, house, bloodStatus) {
  const seed = hashStr(`${givenName}|${house}|${bloodStatus}|random`);
  const rng = makeRng(seed);
  return SACRED_28_FAMILIES[Math.floor(rng() * SACRED_28_FAMILIES.length)];
}

export function resolveRandomSacred28Label(givenName, house, bloodStatus) {
  return resolveRandomSacred28Family(givenName, house, bloodStatus).label;
}

/** 根据表单血统与家族选择解析玩家姓氏 */
export function resolvePlayerSurname(form) {
  const bloodStatus = form.bloodStatus?.value || '混血';
  const surnameInput = (form.surname?.value || '').trim();

  if (bloodStatus === '麻瓜出身') {
    return surnameInput || '格林';
  }

  const familyId = form.wizardFamily?.value || 'random';
  if (familyId === 'custom') {
    return surnameInput;
  }
  if (familyId !== 'random') {
    return getFamilyById(familyId)?.label || surnameInput;
  }

  const givenName = (form.givenName?.value || '').trim() || '艾拉';
  return resolveRandomSacred28Label(givenName, form.house?.value || '', bloodStatus);
}

export function resolveWizardFamilyIdFromForm(form) {
  const bloodStatus = form.bloodStatus?.value || '混血';
  if (bloodStatus === '麻瓜出身') return null;
  const familyId = form.wizardFamily?.value || 'random';
  if (familyId === 'custom') return 'custom';
  if (familyId !== 'random') return familyId;
  const givenName = (form.givenName?.value || '').trim() || '艾拉';
  return resolveRandomSacred28Family(givenName, form.house?.value || '', bloodStatus).id;
}

export function resolvePlayerNameFromForm(form) {
  const givenName = (form.givenName?.value || form.name?.value || '').trim() || '艾拉';
  const surname = resolvePlayerSurname(form);
  const name = surname ? `${givenName}·${surname}` : givenName;
  return { givenName, surname, name };
}

export function isSacred28FamilySelection(form) {
  const bloodStatus = form.bloodStatus?.value;
  if (bloodStatus === '麻瓜出身') return false;
  const familyId = form.wizardFamily?.value;
  return familyId && familyId !== 'custom';
}

export function formatFamilyPreview(family) {
  return formatFamilyForPrompt(family).replace(/\n/g, '\n');
}

export function collectFamilyFromForm(form) {
  const bloodStatus = form.bloodStatus?.value || '混血';
  const { name } = resolvePlayerNameFromForm(form);
  const playerMuggleAttitude = bloodStatus === '麻瓜出身'
    ? null
    : (form.playerMuggleAttitude?.value || 'inherit');

  const wizardFamilyId = resolveWizardFamilyIdFromForm(form);
  const customFamilySurname = wizardFamilyId === 'custom' ? resolvePlayerSurname(form) : '';

  const manual = {
    father: {
      name: form.fatherName?.value,
      appearance: form.fatherAppearance?.value,
      personality: form.fatherPersonality?.value,
      occupation: form.fatherOccupation?.value,
    },
    mother: {
      name: form.motherName?.value,
      appearance: form.motherAppearance?.value,
      personality: form.motherPersonality?.value,
      occupation: form.motherOccupation?.value,
    },
    canonConnectionIds: [...form.querySelectorAll('input[name="canonConnection"]:checked')].map((el) => el.value),
  };

  return buildFamilyBackground({
    bloodStatus,
    name,
    house: form.house?.value,
    wizardFamilyId,
    customFamilySurname,
    wizardParentSide: form.wizardParentSide?.value || 'father',
    originBackground: form.originBackground?.value || resolveDefaultOrigin(bloodStatus),
    playerMuggleAttitude,
    autoGenerate: form.familyAutoGenerate?.checked === true,
    manual,
  });
}

export function isExtremePurebloodFamily(family) {
  const att = family?.familyMuggleAttitude;
  return att === '极端鄙视麻瓜' || att === '传统纯血主义';
}

/** 家族会因与麻瓜/麻瓜出身结合而除名的态度 */
export function isFamilyDespisesMuggles(attitude) {
  return attitude === '极端鄙视麻瓜' || attitude === '传统纯血主义';
}
