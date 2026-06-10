/** 角色创建默认值与可选项 */

import { normalizeFamily } from './family-background.js';

export const DEFAULT_NAME = '艾拉·格林';
export const DEFAULT_APPEARANCE = '深棕卷发，琥珀色眼睛，气质安静';

const PLAYER_HAIR = [
  '深棕卷发', '乌黑直发及肩', '亚麻色微卷长发', '栗色齐刘海短发', '深红发编成松散侧辫',
  '浅金波浪长发', '墨黑高马尾', '深褐及腰直发', '红棕挑染短发', '银灰挑染的黑发',
];

const PLAYER_EYES = [
  '琥珀色眼睛', '深褐眼睛', '灰绿眼睛', '榛色眼睛', '蓝灰眼睛', '深绿眼睛', '浅褐眼睛',
];

const PLAYER_FEATURES = [
  '肤白', '小麦肤色', '肤色偏暖', '脸颊有淡淡雀斑', '鼻梁小巧', '眉形清晰',
  '唇色自然偏淡', '下颌线柔和', '身形纤细', '身形匀称', '比同龄人略高',
];

const PLAYER_VIBES = [
  '气质安静', '眉眼英气', '笑容爽朗', '举止克制', '神情专注', '自带书卷气',
  '看起来不太好惹', '温和但不易亲近', '眼神明亮', '总像在思考什么',
];

const PLAYER_DETAILS = [
  '', '', '',
  '左手腕有小疤', '右耳戴一只旧式银饰', '常把魔杖别在袖口', '指甲修得整齐',
  '说话时习惯微微偏头', '走路步子很轻', '笑时会先抿一下唇',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 随机生成主角（女巫）外貌描述 */
export function generateRandomAppearance() {
  const parts = [
    pickRandom(PLAYER_HAIR),
    pickRandom(PLAYER_EYES),
    pickRandom(PLAYER_FEATURES),
    pickRandom(PLAYER_VIBES),
  ];
  const detail = pickRandom(PLAYER_DETAILS);
  if (detail) parts.push(detail);
  return parts.filter(Boolean).join('，');
}

export function fitAppearanceField(field = document.getElementById('player-appearance')) {
  if (!field || field.tagName !== 'TEXTAREA') return;
  field.style.height = 'auto';
  field.style.height = `${Math.max(field.scrollHeight, 44)}px`;
}

export function applyRandomAppearanceToForm(form = document.getElementById('character-form')) {
  const input = form?.appearance ?? form?.elements?.appearance;
  if (!input) return '';
  const text = generateRandomAppearance();
  input.value = text;
  fitAppearanceField(input);
  return text;
}

export const TALENT_PRESETS = [
  '魔药天才',
  '魁地奇尖子',
  '变形术高手',
  '黑魔法防御术优秀',
  '古代魔文学霸',
  '魔咒创新',
  '神奇生物亲和',
  '天文爱好者',
  '大脑封闭术天赋',
  '破咒天赋',
  '占卜直觉',
  '决斗擅长',
  '治疗咒专长',
  '傲罗家族背景',
];

/** 与玩家年级差；null 表示非年级制（教授/校外） */
export const YEAR_OFFSETS = {
  '哈利': 0,
  '德拉科': 0,
  '西奥多': 0,
  '布雷斯': 0,
  '罗恩': 0,
  '纳威': 0,
  '赫敏': 0,
  '金妮': -1,
  '卢娜': -1,
  '弗雷德': 2,
  '乔治': 2,
  '塞德里克': 3,
  '奥利弗·伍德': 3,
  '斯内普': null,
  '卢平': null,
  '小天狼星': null,
  '威克多尔·克鲁姆': null,
};

export const ROMANCE_TARGETS = Object.keys(YEAR_OFFSETS);

/** 攻略对象下拉分组 */
export const TARGET_GROUPS = [
  {
    label: '同年级',
    options: ['哈利', '德拉科', '西奥多', '布雷斯', '罗恩', '纳威', '赫敏'],
  },
  {
    label: '学妹（低一年级）',
    options: ['金妮', '卢娜'],
  },
  {
    label: '学长',
    options: ['弗雷德', '乔治', '塞德里克', '奥利弗·伍德'],
  },
  {
    label: '教授 / 校外',
    options: ['斯内普', '卢平', '小天狼星', '威克多尔·克鲁姆'],
  },
  {
    label: '暂不选定',
    options: ['先不选'],
  },
];

export function computeNpcYears(playerYear) {
  const years = {};
  for (const [name, offset] of Object.entries(YEAR_OFFSETS)) {
    if (offset === null) {
      if (name === '斯内普' || name === '卢平') years[name] = '教授';
      else if (name === '小天狼星') years[name] = '校外（教父）';
      else if (name === '威克多尔·克鲁姆') years[name] = '访客（德姆斯特朗）';
      else years[name] = '—';
    } else if (offset === -1) {
      const y = playerYear - 1;
      years[name] = y < 1 ? '尚未入学' : y;
    } else {
      years[name] = playerYear + offset;
    }
  }
  return years;
}

function splitGivenName(fullName) {
  const raw = (fullName || '').trim();
  if (!raw) return { givenName: '艾拉', surname: '格林' };
  const parts = raw.split('·');
  if (parts.length >= 2) {
    return { givenName: parts.slice(0, -1).join('·'), surname: parts[parts.length - 1] };
  }
  return { givenName: raw, surname: '' };
}

export function normalizeProfile(raw) {
  const givenName = (raw.givenName || '').trim() || splitGivenName(raw.name).givenName;
  let surname = (raw.surname || '').trim() || splitGivenName(raw.name).surname;
  const name = (raw.name || '').trim() || (surname ? `${givenName}·${surname}` : givenName) || DEFAULT_NAME;
  if (!surname && name.includes('·')) {
    surname = name.split('·').pop();
  }
  const appearance = (raw.appearance || '').trim() || generateRandomAppearance();
  const talents = Array.isArray(raw.talents)
    ? raw.talents.filter(Boolean)
    : (raw.talent || '').split(/[,，、]/).map((s) => s.trim()).filter(Boolean);

  const bloodStatus = raw.bloodStatus;
  const family = raw.family?.summary
    ? raw.family
    : normalizeFamily(raw.family, { name, house: raw.house, bloodStatus });

  return {
    name,
    givenName,
    surname,
    house: raw.house,
    year: Number(raw.year),
    bloodStatus,
    appearance,
    talents,
    custom: (raw.custom || '').trim(),
    target: raw.target,
    tone: raw.tone,
    saveCedric: raw.saveCedric === true,
    wand: raw.wand || null,
    family,
  };
}
