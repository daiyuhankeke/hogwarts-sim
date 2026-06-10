import { extractJson } from './parseResponse.js';
import { callAI } from './callAI.js';
import { APPEARANCE_GROUPS } from '../js/appearance-config.js';

const HAIR_STYLES = APPEARANCE_GROUPS.find((g) => g.id === 'hairStyle').options;
const HAIR_COLORS = APPEARANCE_GROUPS.find((g) => g.id === 'hairColor').options;
const EYES = APPEARANCE_GROUPS.find((g) => g.id === 'eyes').options;
const BUILD = APPEARANCE_GROUPS.find((g) => g.id === 'build').options;
const VIBE = APPEARANCE_GROUPS.find((g) => g.id === 'vibe').options;
const FEATURES = APPEARANCE_GROUPS.find((g) => g.id === 'feature').options;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatHair(hairColor, hairStyle) {
  if (hairColor && hairStyle) return `${hairColor}的${hairStyle}`;
  if (hairStyle) return hairStyle;
  if (hairColor) return `${hairColor}头发`;
  return '及肩长发';
}

function formatTraitHints(traits) {
  if (!traits) return '';
  const lines = [];
  if (traits.hairStyle || traits.hairColor) {
    lines.push(`发型发色：${formatHair(traits.hairColor, traits.hairStyle)}`);
  }
  if (traits.eyes) lines.push(`眼睛：${traits.eyes}`);
  if (traits.build) lines.push(`身形：${traits.build}`);
  if (traits.vibe?.length) lines.push(`气质：${traits.vibe.join('、')}`);
  if (traits.feature?.length) lines.push(`标志特征：${traits.feature.join('、')}`);
  if (traits.notes) lines.push(`自拟细节：${traits.notes}`);
  return lines.length ? lines.join('\n') : '（玩家未指定标签，可自由发挥）';
}

/** 本地详细外貌（无 API） */
export function generateFallbackAppearance(profile = {}, traits = null) {
  if (traits && hasAnyTrait(traits)) {
    return {
      appearance: composeFromTraitsServer(traits, profile, { fillRandom: true }),
      generatedBy: 'fallback',
    };
  }

  const seed = hashStr(`${profile.name || ''}|${Date.now() % 9973}`);
  const pickSeeded = (arr) => arr[seed % arr.length];
  const hairStyle = pickSeeded(HAIR_STYLES);
  const hairColor = pickSeeded(HAIR_COLORS);
  const eyes = pickSeeded(EYES);
  const build = pick(BUILD);
  const vibe = pick(VIBE);
  const feature = pick(FEATURES);
  const year = profile.year || 1;

  const appearance =
    `她约莫 ${10 + year} 岁，留着${formatHair(hairColor, hairStyle)}，一双${eyes}的眼睛。` +
    `${build}，${feature}，整体给人${vibe}的印象。`;

  return { appearance, generatedBy: 'fallback' };
}

function hasAnyTrait(traits) {
  return Boolean(
    traits.hairStyle || traits.hairColor || traits.eyes || traits.build ||
    traits.vibe?.length || traits.feature?.length || traits.notes,
  );
}

function composeFromTraitsServer(traits, profile, { fillRandom }) {
  const pools = {
    hairStyle: HAIR_STYLES,
    hairColor: HAIR_COLORS,
    eyes: EYES,
    build: BUILD,
    vibe: VIBE,
    feature: FEATURES,
  };
  const pickVal = (key, max = 1) => {
    const raw = traits[key];
    if (max === 1) {
      if (raw) return raw;
      return fillRandom ? pick(pools[key]) : null;
    }
    const selected = Array.isArray(raw) ? raw.filter(Boolean) : [];
    if (selected.length || !fillRandom) return selected;
    return [...pools[key]].sort(() => Math.random() - 0.5).slice(0, max);
  };

  const hairStyle = pickVal('hairStyle');
  const hairColor = pickVal('hairColor');
  const eyes = pickVal('eyes');
  const build = pickVal('build');
  const vibes = pickVal('vibe', 2);
  const features = pickVal('feature', 2);
  const year = profile.year || 1;
  const notes = (traits.notes || '').trim();

  let text =
    `她约莫 ${10 + year} 岁，留着${formatHair(hairColor, hairStyle)}，一双${eyes || '深褐'}的眼睛。` +
    `${build ? `${build}，` : ''}${features.length ? `${features.join('，')}。` : ''}` +
    `${vibes.length ? `整体给人${vibes.join('、')}的印象。` : ''}`;
  if (notes) text += notes.endsWith('。') ? notes : `${notes}。`;
  return text.slice(0, 400);
}

export async function generateAppearanceWithAI(profile, { traits = null, mode = 'compose' } = {}) {
  if (!process.env.AI_API_KEY) {
    return generateFallbackAppearance(profile, traits);
  }

  const traitBlock = formatTraitHints(traits);
  const modeHint = mode === 'refine'
    ? '在保留玩家标签与草稿核心信息的前提下，润色成流畅段落；可微调措辞，不要删掉标签要素。'
    : '根据玩家标签撰写全新段落；未指定的部分可合理补全。';

  const systemPrompt = `你是霍格沃茨角色设定助手。为一名**尚未分院**的女巫新生撰写**详细外貌描写**（中文）。
要求：
- 150-280 字，第三人称「她」，具体可视细节：发型、发色、眼睛、肤色、五官、身形、气质
- 符合哈利波特世界观，年龄与年级匹配，不要玛丽苏式堆砌
- **不要写学院、院徽、学院色或霍格沃茨校袍**（此时尚未分院）
- 不要恋爱向描写；不要魔杖/咒语
- ${modeHint}
- 输出纯 JSON：{"appearance": "中文外貌全文"}`;

  const userPrompt = `姓名：${profile.name || '未命名'}
年级：${profile.year || 1}
血统：${profile.bloodStatus || '未知'}

玩家指定的外貌标签：
${traitBlock}

已有草稿（${mode === 'refine' ? '请在此基础上润色' : '可参考或改写'}）：
${profile.appearance || '无'}
${profile.family?.summary ? `\n家庭：${profile.family.summary.slice(0, 80)}` : ''}

请生成详细外貌。`;

  const raw = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.85, maxTokens: 900, jsonMode: true },
  );

  const parsed = extractJson(raw);
  if (!parsed?.appearance) {
    return generateFallbackAppearance(profile, traits);
  }

  return {
    appearance: String(parsed.appearance).trim().slice(0, 400),
    generatedBy: 'api',
  };
}
