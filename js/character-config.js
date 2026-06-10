/** 角色创建默认值与可选项 */

import { normalizeFamily } from './family-background.js';
import {
  composeAppearanceFromTraits,
  collectAppearanceTraits,
} from './appearance-config.js';

export const DEFAULT_NAME = '艾拉·格林';
export const DEFAULT_APPEARANCE = '深棕卷发，琥珀色眼睛，气质安静';

export function fitAppearanceField(field = document.getElementById('player-appearance')) {
  if (!field || field.tagName !== 'TEXTAREA') return;
  field.style.height = 'auto';
  field.style.height = `${Math.max(field.scrollHeight, 44)}px`;
}

export function applyComposedAppearanceToForm(form = document.getElementById('character-form'), { fillRandom = true } = {}) {
  const input = form?.appearance ?? form?.elements?.appearance;
  if (!input) return '';
  const traits = collectAppearanceTraits(form);
  const profile = {
    house: form.house?.value,
    year: Number(form.year?.value || 1),
  };
  const text = composeAppearanceFromTraits(traits, profile, { fillRandom });
  input.value = text;
  fitAppearanceField(input);
  return text;
}

/** @deprecated 使用 applyComposedAppearanceToForm */
export function applyRandomAppearanceToForm(form) {
  return applyComposedAppearanceToForm(form, { fillRandom: true });
}

/** @deprecated 使用 composeAppearanceFromTraits */
export function generateDetailedFallbackAppearance(profile = {}) {
  return composeAppearanceFromTraits({}, profile, { fillRandom: true });
}

/** @deprecated */
export function generateRandomAppearance(profile = {}) {
  return generateDetailedFallbackAppearance(profile);
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

/** 同校 NPC 年级差；null 表示非年级制（教授/校外） */
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
  const appearance = (raw.appearance || '').trim() || composeAppearanceFromTraits({}, raw, { fillRandom: true });
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
    target: '先不选',
    tone: raw.tone,
    saveCedric: raw.saveCedric === true,
    wand: raw.wand || null,
    family,
  };
}
