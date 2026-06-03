/**
 * 场景感知选项 — 当 AI 返回模板化/违和选项时，按当前 location 与 narrative 替换
 */

const CAMPUS_KEYWORDS = /图书馆|公共休息室|霍格莫德|魁地奇球场|去上课|去上某一门课/;

const TEMPLATE_SNIPPETS = [
  '去图书馆复习',
  '去公共休息室休息',
  '去霍格莫德（周六限定）',
  '去魁地奇球场看训练',
];

/** @typedef {{ id: string, label: string, keywords: RegExp, build: (ctx: object) => Array<{id:string,text:string}> }} SceneDef */

const SCENE_DEFS = [
  {
    id: 'kings_cross',
    label: '国王十字车站',
    keywords: /国王十字|King's Cross|九又四分之三|9又3/i,
    build: () => [
      { id: 'A', text: '寻找九又四分之三站台，推着行李车靠近隔墙' },
      { id: 'B', text: '向站台上其他巫师家庭打听该怎么上车' },
      { id: 'C', text: '整理行李，检查魔杖与霍格沃茨来信' },
      { id: 'D', text: '观察其他新生，看看有没有眼熟的面孔' },
      { id: 'E', text: '在车站买份零食，平复紧张心情' },
      { id: 'F', text: '自定义行动（描述你想在车站做什么）' },
    ],
  },
  {
    id: 'train',
    label: '霍格沃茨特快',
    keywords: /特快|火车|站台|车厢|列车/i,
    build: (ctx) => [
      { id: 'A', text: '帮赫敏一起找纳威丢的蟾蜍' },
      { id: 'B', text: '和包厢里的同学自我介绍、闲聊' },
      { id: 'C', text: '分享零食，聊聊各自来自哪里' },
      { id: 'D', text: '望窗外风景，翻《霍格沃茨：一段校史》' },
      { id: 'E', text: '去别的车厢看看（可能遇到更多同学）' },
      { id: 'F', text: '自定义行动（描述你想在列车上做什么）' },
    ],
  },
  {
    id: 'diagon_alley',
    label: '对角巷',
    keywords: /对角巷|奥利凡德|古灵阁|丽痕书店|摩金夫人/,
    build: () => [
      { id: 'A', text: '去丽痕书店挑选课本' },
      { id: 'B', text: '在摩金夫人长袍店试穿校袍' },
      { id: 'C', text: '逛魁地奇用品店或糖果店' },
      { id: 'D', text: '去古灵阁（若有必要）' },
      { id: 'E', text: '找家小酒馆歇脚，观察巫师世界' },
      { id: 'F', text: '自定义行动' },
    ],
  },
  {
    id: 'sorting',
    label: '分院与开学',
    keywords: /分院|分院帽|开学宴|新生宴|大礼堂.*宴|Sorting/i,
    build: () => [
      { id: 'A', text: '紧张等待分院，和邻座新生搭话' },
      { id: 'B', text: '观察四大学院长桌与高年级学生' },
      { id: 'C', text: '留意哈利、罗恩、赫敏等同届生' },
      { id: 'D', text: '在心里默想最想去哪个学院' },
      { id: 'E', text: '宴会后向级长询问去公共休息室的路' },
      { id: 'F', text: '自定义行动' },
    ],
  },
  {
    id: 'hogsmeade',
    label: '霍格莫德',
    keywords: /霍格莫德|蜂蜜公爵|三把扫帚|佐科|尖叫棚屋/,
    build: () => [
      { id: 'A', text: '去蜂蜜公爵买糖果' },
      { id: 'B', text: '在三把扫帚喝一杯黄油啤酒' },
      { id: 'C', text: '逛佐科笑话商店' },
      { id: 'D', text: '约某人一起逛小镇（若已认识）' },
      { id: 'E', text: '去猪头酒吧打听传闻' },
      { id: 'F', text: '自定义行动' },
    ],
  },
  {
    id: 'quidditch',
    label: '魁地奇',
    keywords: /魁地奇.*(赛|训练|比赛|球场)|球场比赛|看台/,
    build: () => [
      { id: 'A', text: '为学院队大声加油' },
      { id: 'B', text: '在场边和熟人聊天' },
      { id: 'C', text: '留意找球手与关键球员' },
      { id: 'D', text: '赛后去公共休息室参加庆祝（或安慰）' },
      { id: 'E', text: '若会飞行，赛后在空场练扫帚' },
      { id: 'F', text: '自定义行动' },
    ],
  },
  {
    id: 'library',
    label: '图书馆',
    keywords: /图书馆|平斯夫人|禁书区/,
    build: (ctx) => [
      { id: 'A', text: '复习今日课程笔记' },
      { id: 'B', text: '查找与主线相关的资料（魔法石/密室等）' },
      { id: 'C', text: '安静角落自习，可能遇到在查资料的同学' },
      { id: 'D', text: '帮某人占座或一起写作业' },
      { id: 'E', text: '提前预习下一章内容' },
      { id: 'F', text: '自定义行动' },
    ],
  },
  {
    id: 'common_room',
    label: '公共休息室',
    keywords: /公共休息室|休息室|格兰芬多塔|地窖|拉文克劳塔|赫奇帕奇/,
    build: () => [
      { id: 'A', text: '在壁炉边休息，听同学闲聊' },
      { id: 'B', text: '和某人单独聊几句' },
      { id: 'C', text: '复习功课或写教授布置的作业' },
      { id: 'D', text: '玩噼啪爆炸牌或巫师棋' },
      { id: 'E', text: '早点休息，准备明天上课' },
      { id: 'F', text: '自定义行动' },
    ],
  },
  {
    id: 'class',
    label: '上课',
    keywords: /教室|魔咒课|变形课|魔药课|黑魔法防御|草药|温室|占卜|神奇生物|上课/,
    build: (ctx) => {
      const hint = ctx.classHint || '当前课程';
      return [
        { id: 'A', text: `认真听讲，做笔记（${hint}）` },
        { id: 'B', text: '举手回答问题，争取表现' },
        { id: 'C', text: '和同桌小声讨论（可能被教授点名）' },
        { id: 'D', text: '课后留下来问教授一个问题' },
        { id: 'E', text: '下课后去图书馆巩固今天的内容' },
        { id: 'F', text: '自定义行动' },
      ];
    },
  },
];

export function detectSceneContext(state, narrative = '') {
  const location = state?.scene?.location ?? '';
  const weekday = state?.time?.weekday ?? '';
  const year = state?.profile?.year ?? 1;
  const text = `${location} ${narrative.slice(-400)}`;

  for (const def of SCENE_DEFS) {
    if (def.keywords.test(text) || def.keywords.test(location)) {
      return { id: def.id, label: def.label, def };
    }
  }

  if (weekday === '周六' && year >= 3 && !/特快|火车|对角巷/.test(location)) {
    const hogsmeade = SCENE_DEFS.find((d) => d.id === 'hogsmeade');
    return { id: 'hogsmeade', label: hogsmeade.label, def: hogsmeade };
  }

  return { id: 'campus', label: '霍格沃茨', def: null };
}

export function isTemplateOrCampusOptions(options, state, narrative = '') {
  if (!options?.length) return true;

  const texts = options.map((o) => o.text || '').join('|');

  // 与 system-core 示例完全一致
  const templateHits = TEMPLATE_SNIPPETS.filter((s) => texts.includes(s)).length;
  if (templateHits >= 3) return true;

  const scene = detectSceneContext(state, narrative);
  if (scene.id === 'campus') return false;

  // 非校园场景却出现典型校园选项
  if (CAMPUS_KEYWORDS.test(texts)) return true;

  return false;
}

export function buildContextualOptions(state, narrative = '', classHint = '') {
  const scene = detectSceneContext(state, narrative);

  if (scene.def) {
    return scene.def.build({ state, classHint, scene: scene.id });
  }

  // 默认校园选项（按星期调整）
  const weekday = state?.time?.weekday ?? '周一';
  const year = state?.profile?.year ?? 1;
  const isWeekend = weekday === '周六' || weekday === '周日';
  const classLine = classHint || (isWeekend ? '周末·自习或休息' : '按课表上课');

  const opts = [
    { id: 'A', text: '去图书馆复习（可能遇到某男主）' },
    { id: 'B', text: '去公共休息室休息（可能触发闲聊）' },
    {
      id: 'C',
      text: weekday === '周六' && year >= 3
        ? '去霍格莫德（周六开放）'
        : '去霍格莫德（仅周六，三年级以上）',
    },
    { id: 'D', text: '去魁地奇球场看训练' },
    { id: 'E', text: `去上课或自习（今日：${classLine}）` },
    { id: 'F', text: '自定义行动' },
  ];

  return opts;
}

/** 优先 AI 选项；违和则替换为场景选项 */
export function resolveOptions(aiOptions, state, narrative = '', classHint = '') {
  const normalized = normalizeOptions(aiOptions);
  if (isTemplateOrCampusOptions(normalized, state, narrative)) {
    return buildContextualOptions(state, narrative, classHint);
  }
  return normalized.length >= 4 ? normalized : buildContextualOptions(state, narrative, classHint);
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .filter((o) => o && o.id && o.text)
    .slice(0, 6)
    .map((o) => ({ id: String(o.id).toUpperCase().slice(0, 1), text: String(o.text) }));
}

export function getSceneOptionHint(state, narrative = '') {
  const scene = detectSceneContext(state, narrative);
  return scene.id === 'campus' ? null : `当前场景：${scene.label}，选项须与此一致`;
}
