/**
 * 角色创建设定：血统风味、出身背景、叙事路线、录取通知书
 */

export const BLOOD_STATUS_LORE = {
  麻瓜出身: {
    title: '麻瓜出身',
    text: '你出生于一个对魔法一无所知的麻瓜家庭。一切都是崭新的、令人惊奇的，但也意味着你需要独自面对某些来自纯血家族的傲慢目光。你的魔法天赋，本身就是对「伟大不看出身」的最好证明。',
  },
  混血: {
    title: '混血',
    text: '你的一位父母是麻瓜或麻瓜出身者。你在两个世界的交界处长大学会了变通，对麻瓜世界的了解是你的独特优势，也可能成为某些人攻击你的借口。',
  },
  纯血: {
    title: '纯血',
    text: '你的家族世代都是巫师。在子世代，这或许不再意味着必须向黑魔王屈膝，但纯血二十八圣族的古老荣光与挥之不去的偏见，依然是你需要背负的课题。你是家族的骄傲，还是一个叛逆者？',
  },
};

export const ORIGIN_BACKGROUNDS = [
  {
    id: 'ancient',
    label: '古老巫师家庭',
    tagline: '自幼熟悉魔法，对角巷了如指掌',
    forBlood: ['纯血', '混血'],
    text: '你在如马尔福庄园般华贵、或如陋居般温暖却拥挤的巫师环境中长大，自幼浸润魔法。收到霍格沃茨录取通知书只是走个形式，童年时你已对对角巷每家店铺了如指掌。',
  },
  {
    id: 'ordinary',
    label: '普通巫师家庭',
    tagline: '巫师界中产，录取通知书是大喜事',
    forBlood: ['纯血', '混血'],
    text: '你的家属于巫师界普通、稳定的中产阶层——没有显赫家谱，也没有极端意识形态。对你和家人而言，收到录取通知书是邻里间最大的喜事；去对角巷采购一次，就足够兴奋一整周。',
  },
  {
    id: 'muggle',
    label: '麻瓜家庭',
    tagline: '猫头鹰前不知霍格沃茨，一切从零开始',
    forBlood: ['麻瓜出身'],
    text: '你在麻瓜公寓或独栋住宅中长大。直到猫头鹰撞进窗户，你才第一次听说「霍格沃茨」。一切都要从零学起，但麻瓜世界带来的逻辑与视角，常常是破解复杂魔法难题的「魔法钥匙」。',
  },
];

export const STORY_PATHS = [
  {
    id: 'everyday',
    label: '普通巫师之路',
    tagline: '校园日常为主，大事件以旁观者视角经历',
    text: '沉浸式霍格沃茨校园生活：熬夜赶魔药论文、在魁地奇场呐喊、在蜂蜜公爵流连忘返。原著大事件发生时，你是普通学生——万圣节巨怪闯入时被级长护送回宿舍；密室开启时在公共休息室听传闻与传说。这不是救世主的故事，而是你在魔法世界找到属于自己的平凡与珍贵。',
    rules: [
      '大事件以目击者/普通学生视角参与，勿写成与哈利并肩闯关的核心英雄。',
      '万圣节巨怪、密室、三强赛等：优先写被保护、听传闻、课堂议论、学院日常受影响。',
      '每 3–5 回合至少一项校园质感：作业截止、魁地奇、霍格莫德、公共休息室、学院分、社团。',
      '禁止天选之女、预言选中、替代哈利完成关键任务。',
    ],
  },
  {
    id: 'legend',
    label: '英雄/传奇之路',
    tagline: '深度参与主线，但仍不可替代哈利完成使命',
    text: '你的天赋或命运会把你拉进时代风暴的中心——与哈利同期，在关键节点有机会深度参与，但仍不可替代哈利完成预言或击败伏地魔。',
    rules: [
      '可在 canon beat 中担任重要配角或局部关键参与者，须有合理动机与代价。',
      '仍禁止替代哈利完成预言、摧毁魂器、最终击败伏地魔。',
      '传奇参与须与 profile.talents、学院、家族立场一致；黑暗家族背景须有秘密/决裂/风险。',
      '平衡个人高光与校园日常，勿每回合都是世界级危机。',
    ],
  },
];

export function resolveDefaultOrigin(bloodStatus) {
  if (bloodStatus === '麻瓜出身') return 'muggle';
  return 'ordinary';
}

export function resolveOriginLabel(id) {
  return ORIGIN_BACKGROUNDS.find((o) => o.id === id)?.label || id;
}

export function resolveStoryPathLabel(id) {
  return STORY_PATHS.find((p) => p.id === id)?.label || id;
}

export function getAvailableOrigins(bloodStatus) {
  return ORIGIN_BACKGROUNDS.filter((o) => o.forBlood.includes(bloodStatus));
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatAcceptanceLetter(profile) {
  const name = profile?.givenName || profile?.name?.split('·')[0] || '女巫';
  return [
    '霍格沃茨魔法学校',
    '（英国）',
    '',
    '校长：阿不思·邓布利多',
    '（国际巫师联合会会长、梅林爵士团一级大魔法师、威森加摩首席巫师）',
    '',
    `亲爱的 ${name}：`,
    '',
    '我们愉快地通知您，您已获准在霍格沃茨魔法学校就读。随信附上所需书籍及装备一览表。',
    '',
    '学期定于九月一日开始。我们期待您的来信，且不得迟于七月三十一日。',
    '',
    '您忠诚的，',
    '',
    '副校长 米勒娃·麦格',
  ].join('\n');
}

/** 创角页录取通知书预览（HTML） */
export function renderAcceptanceLetterHtml(profile) {
  const name = escapeHtml(profile?.givenName || profile?.name?.split('·')[0] || '女巫');
  return `<article class="acceptance-letter-parchment">
  <div class="acceptance-letter-wax" aria-hidden="true"></div>
  <header class="acceptance-letter-head">
    <div class="acceptance-letter-crest" aria-hidden="true">H</div>
    <h3 class="acceptance-letter-school">霍格沃茨魔法学校</h3>
    <p class="acceptance-letter-locale">Hogwarts School of Witchcraft and Wizardry</p>
    <p class="acceptance-letter-locale-sub">（英国）</p>
  </header>
  <div class="acceptance-letter-divider" aria-hidden="true"></div>
  <p class="acceptance-letter-headmaster">校长：阿不思·邓布利多</p>
  <p class="acceptance-letter-titles">（国际巫师联合会会长、梅林爵士团一级大魔法师、威森加摩首席巫师）</p>
  <p class="acceptance-letter-salute">亲爱的 <em>${name}</em>：</p>
  <p class="acceptance-letter-body">我们愉快地通知您，您已获准在霍格沃茨魔法学校就读。随信附上所需书籍及装备一览表。</p>
  <p class="acceptance-letter-body">学期定于<strong>九月一日</strong>开始。我们期待您的来信，且不得迟于<strong>七月三十一日</strong>。</p>
  <footer class="acceptance-letter-sign">
    <p class="acceptance-letter-closing">您忠诚的，</p>
    <p class="acceptance-letter-signature">米勒娃·麦格</p>
    <p class="acceptance-letter-sign-title">副校长</p>
  </footer>
</article>`;
}

export function getCharacterLoreContext(profile) {
  const blood = profile?.bloodStatus || '混血';
  const origin = profile?.originBackground || resolveDefaultOrigin(blood);
  const path = profile?.storyPath || 'everyday';
  const bloodLore = BLOOD_STATUS_LORE[blood];
  const originLore = ORIGIN_BACKGROUNDS.find((o) => o.id === origin);
  const pathLore = STORY_PATHS.find((p) => p.id === path);

  return {
    bloodStatus: blood,
    bloodFlavor: bloodLore?.text || '',
    originBackground: origin,
    originLabel: originLore?.label || resolveOriginLabel(origin),
    originFlavor: originLore?.text || '',
    storyPath: path,
    storyPathLabel: pathLore?.label || resolveStoryPathLabel(path),
    storyPathRules: pathLore?.rules || [],
    dmHint: [
      bloodLore?.text ? `血统：${bloodLore.text}` : '',
      originLore?.text ? `出身：${originLore.text}` : '',
      pathLore ? `叙事路线「${pathLore.label}」：${pathLore.rules?.join(' ')}` : '',
    ].filter(Boolean).join(' '),
  };
}

export function pickHouseholdByOrigin(originBackground, bloodStatus, rng, households) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  if (bloodStatus === '麻瓜出身' || originBackground === 'muggle') {
    return pick([...households.muggle_suburb, ...households.muggle_urban]);
  }
  if (originBackground === 'ancient') {
    return pick(households.pureblood_manor);
  }
  if (bloodStatus === '纯血') {
    return pick(households.wizard_ordinary || households.wizard_urban);
  }
  return pick([...(households.wizard_ordinary || households.wizard_urban), ...households.muggle_suburb]);
}
