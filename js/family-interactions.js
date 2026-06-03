/**
 * 家庭 NPC 关联、互动节拍与侧栏数据
 */

import { isExtremePurebloodFamily, CANON_CONNECTION_OPTIONS } from './family-background.js';

/** 家族 → 可能产生互动的 NPC */
const FAMILY_NPC_MAP = {
  malfoy: [
    { npc: '德拉科', tone: 'complex', relation: '同族', hint: '马尔福家期望、纯血政治、卢修斯施压' },
  ],
  weasley: [
    { npc: '罗恩', tone: 'friendly', relation: '远亲/同族', hint: '韦斯莱式热情、陋居来信' },
    { npc: '金妮', tone: 'friendly', relation: '族亲', hint: '姐妹般的家庭感' },
  ],
  prewett: [
    { npc: '罗恩', tone: 'friendly', relation: '姻亲', hint: '通过韦斯莱一脉的联系' },
  ],
  longbottom: [
    { npc: '纳威', tone: 'friendly', relation: '同族', hint: '隆巴顿家坚韧、圣芒戈往事' },
  ],
  black: [
    { npc: '小天狼星', tone: 'complex', relation: '姻亲/族亲', hint: '布莱克家谱、断绝关系或秘密' },
    { npc: '德拉科', tone: 'hostile', relation: '世仇', hint: '布莱克与马尔福的纯血圈分歧' },
  ],
  lestrange: [
    { npc: '德拉科', tone: 'neutral', relation: '纯血同盟', hint: '黑魔法家族阴影，谨慎提及' },
  ],
  greengrass: [
    { npc: '德拉科', tone: 'neutral', relation: '联姻圈', hint: '纯血社交舞会、家族相亲压力' },
  ],
  parkinson: [
    { npc: '德拉科', tone: 'neutral', relation: '斯莱特林同盟', hint: '纯血女生圈舆论' },
  ],
  nott: [
    { npc: '西奥多', tone: 'neutral', relation: '同族', hint: '古老家族、沉默寡言的默契' },
    { npc: '德拉科', tone: 'neutral', relation: '斯莱特林同盟', hint: '' },
  ],
  ollivander: [
    { npc: '哈利', tone: 'friendly', relation: '魔杖界', hint: '奥利凡德对「命定之杖」的八卦' },
  ],
  slughorn: [
    { npc: '哈利', tone: 'neutral', relation: '俱乐部人脉', hint: '斯拉格霍恩可能因家族旧识注意到你' },
  ],
  crouch: [
    { npc: '哈利', tone: 'complex', relation: '魔法部旧闻', hint: '克劳奇家规与世界杯阴影' },
  ],
};

/** 原著关联 → 额外 NPC 纽带 */
const CONNECTION_NPC_MAP = {
  potter: [{ npc: '哈利', tone: 'friendly', relation: '世交', hint: '父母与波特夫妇的渊源' }],
  weasley: [{ npc: '罗恩', tone: 'friendly', relation: '世交', hint: '亚瑟·韦斯莱或莫丽的旧识' }],
  granger: [{ npc: '赫敏', tone: 'friendly', relation: '父母相识', hint: '麻瓜父母圈子里的交集' }],
  malfoy: [{ npc: '德拉科', tone: 'complex', relation: '家族往来', hint: '宴会、商业或政见冲突' }],
  longbottom: [{ npc: '纳威', tone: 'friendly', relation: '父母相识', hint: '圣芒戈或凤凰社圈子' }],
  order: [{ npc: '小天狼星', tone: 'friendly', relation: '凤凰社', hint: '父辈的秘密联系' }],
  dark: [{ npc: '德拉科', tone: 'hostile', relation: '黑魔法牵连', hint: '家族讳言，可能被利用' }],
};

const TONE_LABELS = {
  friendly: '友好',
  hostile: '紧张',
  neutral: '中立',
  complex: '复杂',
};

const ATTITUDE_CLASS = {
  '极端鄙视麻瓜': 'attitude-extreme',
  '传统纯血主义': 'attitude-traditional',
  '中立保守': 'attitude-neutral',
  '改良派': 'attitude-reform',
  '亲麻瓜': 'attitude-open',
  '不适用（麻瓜家庭）': 'attitude-muggle',
};

export function deriveFamilyNpcTies(family) {
  if (!family) return [];

  const ties = [];
  const seen = new Set();

  const add = (entry) => {
    const key = entry.npc;
    if (seen.has(key)) return;
    seen.add(key);
    ties.push(entry);
  };

  if (family.familyId && FAMILY_NPC_MAP[family.familyId]) {
    for (const t of FAMILY_NPC_MAP[family.familyId]) {
      add(family.estrangedFromFamily
        ? { ...t, tone: t.npc === '德拉科' ? 'hostile' : 'complex', hint: `已被${family.familyLabel}除名；${t.hint || ''}` }
        : { ...t });
    }
  }

  for (const connLabel of family.canonConnections || []) {
    const opt = CANON_CONNECTION_OPTIONS.find((c) => c.label === connLabel);
    for (const tag of opt?.tags || []) {
      for (const entry of CONNECTION_NPC_MAP[tag] || []) {
        add({ ...entry });
      }
    }
  }

  if (family.bloodStatus === '麻瓜出身') {
    add({ npc: '赫敏', tone: 'friendly', relation: '同类', hint: '麻瓜出身的互相理解' });
  }

  if (isExtremePurebloodFamily(family) && family.playerMuggleAttitude === 'more_open') {
    add({ npc: '赫敏', tone: 'complex', relation: '价值观', hint: '家族期望与个人态度的撕裂' });
  }

  return ties.slice(0, 6);
}

export function createInitialFamilyTrack(family) {
  return {
    recentEvents: [],
    lastBeatWeek: 0,
    lettersReceived: 0,
    npcTies: deriveFamilyNpcTies(family),
  };
}

export function migrateFamilyTrack(state) {
  const family = state.profile?.family;
  const existing = state.progression?.familyTrack;
  const base = createInitialFamilyTrack(family);
  if (!existing) return base;
  return {
    ...base,
    ...existing,
    recentEvents: (existing.recentEvents || []).slice(0, 8),
    npcTies: existing.npcTies?.length ? existing.npcTies : base.npcTies,
  };
}

export function getSuggestedFamilyBeats(state) {
  const week = state.time?.week ?? 1;
  const track = migrateFamilyTrack(state);
  const family = state.profile?.family;
  const beats = [];
  const weeksSince = week - (track.lastBeatWeek || 0);

  if (weeksSince >= 4) {
    beats.push({
      type: 'owl_letter',
      priority: weeksSince >= 6 ? 'high' : 'medium',
      label: '父母/家族来信',
      hint: '猫头鹰捎来家常、叮嘱或纯血压力',
    });
  }

  if (state.time?.season === '冬' && state.time?.weekday !== '周六') {
    beats.push({
      type: 'holiday',
      priority: 'medium',
      label: '节日家庭戏',
      hint: '圣诞/复活节前后可写回家或家人来访',
    });
  }

  if (state.time?.weekday === '周六' && state.profile?.year >= 1) {
    beats.push({
      type: 'hogsmeade_family',
      priority: 'low',
      label: '霍格莫德偶遇亲属',
      hint: '父母/叔辈偶发来校探望（需合理）',
    });
  }

  for (const tie of track.npcTies || []) {
    const aff = state.relationships?.[tie.npc]?.affection ?? 0;
    if (aff >= 21 && aff < 61) {
      beats.push({
        type: 'npc_family_hook',
        priority: 'medium',
        npc: tie.npc,
        label: `${tie.npc}提及你的家族`,
        hint: tie.hint || `${tie.relation}关系可推进一条对话`,
      });
    }
  }

  if (family?.familyId === 'malfoy' && state.relationships?.['德拉科']?.affection >= 41) {
    beats.push({
      type: 'lucius_pressure',
      priority: 'high',
      npc: '德拉科',
      label: '马尔福家政治压力',
      hint: '卢修斯来信或德拉科转述家族期望',
    });
  }

  return beats.slice(0, 4);
}

export function getFamilyInteractionContext(state) {
  const family = state.profile?.family;
  const track = migrateFamilyTrack(state);
  const beats = getSuggestedFamilyBeats(state);
  const weeksSince = (state.time?.week ?? 1) - (track.lastBeatWeek || 0);

  return {
    npcTies: track.npcTies,
    recentEvents: track.recentEvents.slice(0, 3),
    suggestedBeats: beats,
    weeksSinceLastBeat: weeksSince,
    shouldPromptFamilyBeat: weeksSince >= 5,
    familyPrompt: weeksSince >= 5
      ? '距上次家庭/家族 NPC 互动已较久：本回合或下回合优先安排猫头鹰来信、同学提及你的家族、或一位关联 NPC 的家庭线对话（简短即可）。'
      : null,
  };
}

const FAMILY_NARRATIVE_PATTERNS = [
  { re: /猫头鹰.*(信|来信|包裹)|来信|家书|母亲.*写|父亲.*写/, type: 'letter', title: '家书' },
  { re: /(父亲|母亲|父母|家族|卢修斯|亚瑟·韦斯莱|莫丽·韦斯莱|弗兰克·隆巴顿).{0,20}(来信|来访|提到|说|叮嘱|期望)/, type: 'family', title: '家族' },
  { re: /(德拉科|罗恩|赫敏|纳威|小天狼星).{0,30}(家族|父母|马尔福|韦斯莱|麻瓜出身|纯血)/, type: 'npc_family', title: 'NPC·家族' },
];

export function processFamilyAfterTurn(state, narrative = '') {
  const track = migrateFamilyTrack(state);
  const week = state.time?.week ?? 1;
  let updated = false;

  for (const pat of FAMILY_NARRATIVE_PATTERNS) {
    if (pat.re.test(narrative)) {
      const snippet = narrative.match(pat.re)?.[0]?.slice(0, 40) || pat.title;
      track.recentEvents.unshift({
        week,
        type: pat.type,
        title: pat.title,
        text: snippet + (narrative.length > 40 ? '…' : ''),
      });
      track.lastBeatWeek = week;
      if (pat.type === 'letter') track.lettersReceived += 1;
      updated = true;
      break;
    }
  }

  track.recentEvents = track.recentEvents.slice(0, 8);
  return updated ? track : null;
}

export function getAttitudeClass(attitude) {
  return ATTITUDE_CLASS[attitude] || 'attitude-neutral';
}

export function getToneLabel(tone) {
  return TONE_LABELS[tone] || tone;
}

export function formatParentLine(parent) {
  if (!parent) return '';
  return `${parent.name} · ${parent.occupation}`;
}
