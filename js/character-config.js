/** 角色创建默认值与可选项 */

import { normalizeFamily } from './family-background.js';

export const DEFAULT_NAME = '艾拉·格林';
export const DEFAULT_APPEARANCE = '深棕卷发，琥珀色眼睛，气质安静';

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
    label: '特殊',
    options: ['双子夹心', '先不选'],
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
  const appearance = (raw.appearance || '').trim() || DEFAULT_APPEARANCE;
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
    clubs: Array.isArray(raw.clubs) ? raw.clubs.slice(0, 3) : [],
    family,
  };
}
