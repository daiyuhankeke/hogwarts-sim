/** 外貌标签与本地组合 */

export const APPEARANCE_GROUPS = [
  {
    id: 'hairStyle',
    label: '发型',
    max: 1,
    customField: 'appearanceHairStyleCustom',
    options: [
      '及肩直发', '高马尾', '松散侧辫', '齐刘海短发', '微卷长发',
      '及腰直发', '波浪长发', '低盘发', '双麻花辫', '随意扎起',
    ],
  },
  {
    id: 'hairColor',
    label: '发色',
    max: 1,
    customField: 'appearanceHairColorCustom',
    options: [
      '深棕', '乌黑', '亚麻色', '栗色', '深红', '浅金',
      '墨黑', '深褐', '红棕', '银灰挑染',
    ],
  },
  {
    id: 'eyes',
    label: '眼睛',
    max: 1,
    options: ['琥珀色', '深褐', '灰绿', '榛色', '蓝灰', '深绿', '浅褐'],
  },
  {
    id: 'build',
    label: '身形',
    max: 1,
    options: ['身形纤细', '身形匀称', '比同龄人略高', '肩背挺直', '步子很轻'],
  },
  {
    id: 'vibe',
    label: '气质（最多 2 项）',
    max: 2,
    options: [
      '气质安静', '眉眼英气', '笑容爽朗', '神情专注', '自带书卷气',
      '看起来不太好惹', '温和但不易亲近', '眼神明亮',
    ],
  },
  {
    id: 'feature',
    label: '标志特征（最多 2 项）',
    max: 2,
    options: [
      '肤白', '小麦肤色', '淡淡雀斑', '鼻梁小巧', '唇色自然偏淡',
      '左手腕旧疤', '右耳旧式银饰',
    ],
  },
];

const HAIR_STYLE_POOL = APPEARANCE_GROUPS.find((g) => g.id === 'hairStyle').options;
const HAIR_COLOR_POOL = APPEARANCE_GROUPS.find((g) => g.id === 'hairColor').options;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveTraitValue(group, checked, custom) {
  if (group.max === 1) {
    return custom || checked[0] || null;
  }
  return checked.slice(0, group.max);
}

function pickFromGroup(groupId, traits, { fillRandom }) {
  const group = APPEARANCE_GROUPS.find((g) => g.id === groupId);
  if (!group) return group?.max === 1 ? null : [];

  const raw = traits[groupId];
  if (group.max === 1) {
    if (raw) return raw;
    if (!fillRandom) return null;
    if (groupId === 'hairStyle') return pickRandom(HAIR_STYLE_POOL);
    if (groupId === 'hairColor') return pickRandom(HAIR_COLOR_POOL);
    return pickRandom(group.options);
  }

  const selected = Array.isArray(raw) ? raw.filter(Boolean) : [];
  if (selected.length || !fillRandom) return selected;
  const shuffled = [...group.options].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, group.max);
}

function formatHair(hairColor, hairStyle) {
  if (hairColor && hairStyle) return `${hairColor}的${hairStyle}`;
  if (hairStyle) return hairStyle;
  if (hairColor) return `${hairColor}头发`;
  return '及肩长发';
}

export function collectAppearanceTraits(form) {
  if (!form) {
    return {
      hairStyle: null,
      hairColor: null,
      eyes: null,
      build: null,
      vibe: [],
      feature: [],
      notes: '',
    };
  }

  const traits = { vibe: [], feature: [], notes: (form.appearanceNotes?.value || '').trim() };
  for (const group of APPEARANCE_GROUPS) {
    const checked = [...form.querySelectorAll(`input[name="appearanceTrait"][data-group="${group.id}"]:checked`)]
      .map((el) => el.value);
    const custom = group.customField
      ? (form[group.customField]?.value || '').trim()
      : '';
    traits[group.id] = resolveTraitValue(group, checked, custom);
  }
  return traits;
}

export function formatTraitsSummary(traits) {
  const parts = [];
  const hair = formatHair(traits.hairColor, traits.hairStyle);
  if (traits.hairColor || traits.hairStyle) parts.push(hair);
  for (const group of APPEARANCE_GROUPS) {
    if (group.id === 'hairStyle' || group.id === 'hairColor') continue;
    const val = traits[group.id];
    if (group.max === 1 && val) parts.push(val);
    else if (Array.isArray(val) && val.length) parts.push(...val);
  }
  if (traits.notes) parts.push(traits.notes);
  return parts.length ? parts.join('、') : '无（将随机补全）';
}

export function composeAppearanceFromTraits(traits = {}, profile = {}, { fillRandom = true } = {}) {
  const hairStyle = pickFromGroup('hairStyle', traits, { fillRandom });
  const hairColor = pickFromGroup('hairColor', traits, { fillRandom });
  const eyes = pickFromGroup('eyes', traits, { fillRandom });
  const build = pickFromGroup('build', traits, { fillRandom });
  const vibes = pickFromGroup('vibe', traits, { fillRandom });
  const features = pickFromGroup('feature', traits, { fillRandom });
  const year = profile.year || 1;

  const hairText = formatHair(hairColor, hairStyle);
  const eyeText = eyes ? `一双${eyes}的眼睛` : '一双清澈的眼睛';
  const vibeText = vibes.length ? `整体给人${vibes.join('、')}的印象` : '举止自然';
  const featureParts = features.filter(Boolean);
  const detailText = featureParts.length ? featureParts.join('，') : '';
  const notes = (traits.notes || '').trim();

  let text =
    `她约莫 ${10 + year} 岁，留着${hairText}，${eyeText}。` +
    `${build ? `${build}，` : ''}${detailText ? `${detailText}。` : ''}${vibeText}。`;

  if (notes) text += notes.endsWith('。') ? notes : `${notes}。`;

  return text.slice(0, 400);
}

export function renderAppearanceTraitGroups(container) {
  if (!container) return;
  container.innerHTML = APPEARANCE_GROUPS.map(
    (group) => `
      <div class="appearance-trait-group" data-group="${group.id}">
        <span class="appearance-trait-label">${group.label}</span>
        <div class="talent-grid appearance-trait-grid">
          ${group.options.map(
            (opt) =>
              `<label class="talent-chip appearance-trait-chip">
                <input type="checkbox" name="appearanceTrait" data-group="${group.id}" value="${opt}">
                <span>${opt}</span>
              </label>`,
          ).join('')}
        </div>
        ${group.customField
          ? `<input type="text" name="${group.customField}" class="appearance-trait-custom" placeholder="或自拟${group.label}" maxlength="24">`
          : ''}
      </div>`,
  ).join('');
}

export function bindAppearanceTraitLimits(form, onChange) {
  if (!form) return;
  form.querySelectorAll('input[name="appearanceTrait"]').forEach((input) => {
    input.addEventListener('change', () => {
      const groupId = input.dataset.group;
      const group = APPEARANCE_GROUPS.find((g) => g.id === groupId);
      if (!group || group.max !== 1 || !input.checked) {
        onChange?.();
        return;
      }
      form.querySelectorAll(`input[name="appearanceTrait"][data-group="${groupId}"]`).forEach((el) => {
        if (el !== input) el.checked = false;
      });
      onChange?.();
    });
  });
  form.appearanceNotes?.addEventListener('input', onChange);
  form.querySelectorAll('.appearance-trait-custom').forEach((input) => {
    input.addEventListener('input', onChange);
  });
}

export function clearAppearanceTraitInputs(form) {
  if (!form) return;
  form.querySelectorAll('input[name="appearanceTrait"]').forEach((el) => { el.checked = false; });
  form.querySelectorAll('.appearance-trait-custom').forEach((el) => { el.value = ''; });
  if (form.appearanceNotes) form.appearanceNotes.value = '';
}
