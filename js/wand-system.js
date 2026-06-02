/** 魔杖 UI 辅助 — SVG 预览与本地 fallback */

const WAND_WOODS = [
  '山楂木', '柳木', '樱桃木', '黑胡桃木', '葡萄藤木', '冬青木', '赤杨木',
  '白蜡木', '桦木', '黑檀木', '紫杉木', '榆木', '杉木', '松木', '桃花心木', '鹅耳枥', '槭木', '橡木',
];

const WAND_CORES = [
  { id: 'unicorn', name: '独角兽毛' },
  { id: 'phoenix', name: '凤凰羽毛' },
  { id: 'dragon', name: '龙心弦' },
];

const FLEXIBILITIES = ['坚硬', '略硬', '柔韧', '相当柔韧', '易弯曲', '非常易弯曲'];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 浏览器端 fallback（旧存档迁移 / 离线） */
export function createFallbackWand(profile) {
  const seed = hashStr(`${profile.name}|${profile.house}|${profile.bloodStatus}`);
  const wood = WAND_WOODS[seed % WAND_WOODS.length];
  const core = WAND_CORES[seed % WAND_CORES.length];
  const lengthIn = 9 + (seed % 21) / 4;
  const whole = Math.min(14, Math.floor(lengthIn));
  const length = `${whole}${whole < 14 ? ['', '¼', '½', '¾'][seed % 4] : ''}英寸`;
  const flexibility = FLEXIBILITIES[seed % FLEXIBILITIES.length];
  const woodColors = {
    山楂木: '#8B4513', 柳木: '#C4A574', 冬青木: '#2F4F2F', 紫杉木: '#4A3728',
    橡木: '#A0522D', 白蜡木: '#DEB887', 樱桃木: '#722F37', 黑胡桃木: '#3D2314',
  };
  const color = woodColors[wood] || '#6B4423';
  return {
    wood,
    core: core.name,
    coreId: core.id,
    length,
    flexibility,
    affinity: `${wood}与${core.name}的组合，适合意志坚定的小女巫。`,
    appearance: `杖身由${wood}制成，长约${length}，触感${flexibility}。杖身呈深木色调，杖柄处可见自然木纹，杖尖收敛细长。`,
    color,
    generatedBy: 'fallback',
    imageUrl: null,
  };
}

const CORE_GLOW = {
  unicorn: '#e8e8ff',
  phoenix: '#ff9944',
  dragon: '#cc3333',
};

export function renderWandSvg(wand) {
  if (!wand) return '';
  const color = wand.color || '#6B4423';
  const glow = CORE_GLOW[wand.coreId] || '#d4af37';
  const woodLight = lightenColor(color, 30);

  return `<svg class="wand-svg" viewBox="0 0 120 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="wandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${woodLight}"/>
        <stop offset="50%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${darkenColor(color, 20)}"/>
      </linearGradient>
      <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="120" height="320" fill="#1a1208" rx="8"/>
    <path d="M58 280 Q56 200 54 120 Q52 60 50 30 L70 30 Q68 60 66 120 Q64 200 62 280 Z" fill="url(#wandGrad)" stroke="${darkenColor(color, 30)}" stroke-width="0.5"/>
    <ellipse cx="60" cy="42" rx="14" ry="6" fill="${darkenColor(color, 15)}"/>
    <circle cx="60" cy="38" r="5" fill="url(#coreGlow)"/>
    <path d="M52 90 Q60 88 68 90" fill="none" stroke="${woodLight}" stroke-width="0.8" opacity="0.6"/>
    <path d="M53 150 Q60 148 67 150" fill="none" stroke="${woodLight}" stroke-width="0.8" opacity="0.5"/>
  </svg>`;
}

function lightenColor(hex, pct) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + pct);
  const g = Math.min(255, ((num >> 8) & 0xff) + pct);
  const b = Math.min(255, (num & 0xff) + pct);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darkenColor(hex, pct) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - pct);
  const g = Math.max(0, ((num >> 8) & 0xff) - pct);
  const b = Math.max(0, (num & 0xff) - pct);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function formatWandSummary(wand) {
  if (!wand) return '';
  return `${wand.wood} · ${wand.core} · ${wand.length}`;
}
