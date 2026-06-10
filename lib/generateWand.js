import { extractJson } from './parseResponse.js';
import { callAI } from './callAI.js';

const WAND_WOODS = [
  '山楂木', '柳木', '樱桃木', '黑胡桃木', '葡萄藤木', '冬青木', '赤杨木',
  '白蜡木', '桦木', '黑檀木', '紫杉木', '榆木', '杉木', '松木', '桃花心木',
  '鹅耳枥', '常春藤', '槭木', '橡木',
];

const WAND_CORES = [
  { id: 'unicorn', name: '独角兽毛', desc: '最难驯服，但最忠实' },
  { id: 'phoenix', name: '凤凰羽毛', desc: '最挑剔，潜力最大' },
  { id: 'dragon', name: '龙心弦', desc: '力量最强，易学恶咒' },
];

const FLEXIBILITIES = ['坚硬', '略硬', '柔韧', '相当柔韧', '易弯曲', '非常易弯曲'];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildWandAppearanceText(wand, profile = {}) {
  const { wood, length, flexibility } = wand;
  const house = profile.house;
  let text = `杖身由${wood}制成，长约${length}，触感${flexibility}。杖身呈深木色调，杖柄处可见自然木纹，杖尖收敛细长。`;
  if (house) text += `整体风格与${house}的气质隐约相合。`;
  return text;
}

function pickWoodColor(wood) {
  const woodColors = {
    山楂木: '#8B4513', 柳木: '#C4A574', 冬青木: '#2F4F2F', 紫杉木: '#4A3728',
    橡木: '#A0522D', 白蜡木: '#DEB887', 樱桃木: '#722F37', 黑胡桃木: '#3D2314',
  };
  return woodColors[wood] || '#6B4423';
}

function finalizeWand(wand, profile, generatedBy) {
  return {
    ...wand,
    appearance: buildWandAppearanceText(wand, profile),
    generatedBy,
  };
}

/** 无 API 时的本地魔杖（确定性，基于姓名） */
export function generateFallbackWand(profile) {
  const seed = hashStr(`${profile.name}|${profile.house}|${profile.bloodStatus}`);
  const wood = WAND_WOODS[seed % WAND_WOODS.length];
  const core = WAND_CORES[seed % WAND_CORES.length];
  const lengthIn = 9 + (seed % 21) / 4;
  const whole = Math.min(14, Math.floor(lengthIn));
  const length = `${whole}${whole < 14 ? ['', '¼', '½', '¾'][seed % 4] : ''}英寸`;
  const flexibility = FLEXIBILITIES[seed % FLEXIBILITIES.length];

  return finalizeWand({
    wood,
    core: core.name,
    coreId: core.id,
    length,
    flexibility,
    affinity: `${wood}与${core.name}的组合——${core.desc}。`,
    color: pickWoodColor(wood),
  }, profile, 'fallback');
}

export async function generateWandWithAI(profile) {
  if (!process.env.AI_API_KEY) {
    return generateFallbackWand(profile);
  }

  const systemPrompt = `你是奥利凡德魔杖店的店主。根据女巫信息挑选「选择她的那根」魔杖。
规则：
- 贴近哈利波特世界观，木材与杖芯来自原著常见组合（如冬青+凤凰羽毛、柳木+独角兽毛、葡萄藤+龙心弦等）
- 长度 9-14 英寸，可带 ¼ 分数
- 输出纯 JSON，不要 markdown

JSON 结构：
{
  "wood": "木材中文名",
  "core": "杖芯中文名（独角兽毛/凤凰羽毛/龙心弦）",
  "coreId": "unicorn|phoenix|dragon",
  "length": "如 10¾英寸",
  "flexibility": "柔韧度描述",
  "affinity": "一句魔杖与巫师相性说明（50字内）",
  "color": "hex color for wood e.g. #8B4513"
}`;

  const userPrompt = `女巫信息：
姓名：${profile.name}
学院：${profile.house}
血统：${profile.bloodStatus}
外貌：${profile.appearance || '未描述'}
特殊才能：${(profile.talents || []).join('、') || '无'}
年级：${profile.year || 1}
${profile.family?.summary ? `家庭背景：${profile.family.summary}` : ''}

请为她选择魔杖。`;

  const raw = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.9, maxTokens: 600 },
  );
  const parsed = extractJson(raw);
  if (!parsed?.wood || !parsed?.core) {
    return generateFallbackWand(profile);
  }

  return finalizeWand({
    wood: parsed.wood,
    core: parsed.core,
    coreId: parsed.coreId || 'unicorn',
    length: parsed.length || '11英寸',
    flexibility: parsed.flexibility || '柔韧',
    affinity: parsed.affinity || '',
    color: parsed.color || pickWoodColor(parsed.wood),
  }, profile, 'api');
}
