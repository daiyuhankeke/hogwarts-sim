/**
 * 场景感知选项 — 按 narrative 阶段生成/校验选项，AI 违和则替换
 */

const CAMPUS_KEYWORDS = /图书馆|公共休息室|霍格莫德|魁地奇球场|去上课|去上某一门课/;

const POST_SORTING_RE =
  /(?:已被|已经|刚被|被).{0,10}分(?:入|到|进)|欢迎加入(?:格兰芬多|斯莱特林|拉文克劳|赫奇帕奇)|坐在.{0,16}(?:格兰芬多|斯莱特林|拉文克劳|赫奇帕奇).{0,10}(?:长表|长桌|桌|餐桌)|走向.{0,12}(?:格兰芬多|斯莱特林|拉文克劳|赫奇帕奇).{0,8}(?:长桌|桌)|分院帽.{0,24}(?:摘下|离开|滑|取走|被取走)|帽.{0,8}(?:高唱|喊|宣布).{0,20}(?:格兰芬多|斯莱特林|拉文克劳|赫奇帕奇)/;

const PRE_SORTING_OPTION_RE =
  /紧张等待分院|默想最想去哪个学院|等待分院|还没.*分院|分院帽戴|即将分院/;

const TRAIN_OPTION_RE =
  /车厢|列车上|包厢|蟾蜍|Trevor|换.*车厢|望窗外|霍格沃茨特快|分享零食.*来自哪里/;

const STATION_OPTION_RE = /九又四分之三|国王十字|推起推车|隔墙|站台.*上车/;

const TRAVEL_SCENE_IDS = new Set(['kings_cross', 'train', 'diagon_alley']);

const TEMPLATE_SNIPPETS = [
  '去图书馆复习',
  '去公共休息室休息',
  '去霍格莫德（周六限定）',
  '去魁地奇球场看训练',
  '帮赫敏一起找纳威丢的蟾蜍',
  '和包厢里的同学自我介绍',
  '去别的车厢看看',
];

/** @typedef {{ id: string, label: string, keywords: RegExp, narrativeKeywords?: RegExp, build: Function, travelOnly?: boolean }} SceneDef */

const SCENE_DEFS = [
  {
    id: 'kings_cross',
    label: '国王十字车站',
    keywords: /国王十字|King's Cross|九又四分之三|9又3/i,
    travelOnly: true,
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
    travelOnly: true,
    build: () => [
      { id: 'A', text: '帮赫敏一起找纳威丢的蟾蜍' },
      { id: 'B', text: '和包厢里的同学自我介绍、闲聊' },
      { id: 'C', text: '分享零食，聊聊各自来自哪里' },
      { id: 'D', text: '望窗外苏格兰高地风景，翻翻课本' },
      { id: 'E', text: '去别的车厢看看（可能遇到更多同学）' },
      { id: 'F', text: '自定义行动（描述你想在列车上做什么）' },
    ],
  },
  {
    id: 'diagon_alley',
    label: '对角巷',
    keywords: /对角巷|奥利凡德|古灵阁|丽痕书店|摩金夫人/,
    travelOnly: true,
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
    travelOnly: true,
    build: (ctx) => (ctx.phase === 'post_sorting' ? buildPostSortingOptions(ctx) : buildPreSortingOptions()),
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
    keywords: /图书馆|平斯夫人|禁书区/i,
    narrativeKeywords: /《霍格沃茨|霍格沃茨.*校史|一段校史|借阅|书架|自习.*书|翻.*书|阅读.*书|平斯/i,
    build: (ctx) => buildLibraryOptions(ctx),
  },
  {
    id: 'common_room',
    label: '公共休息室',
    keywords: /公共休息室|休息室|格兰芬多塔|地窖|拉文克劳塔|赫奇帕奇/i,
    build: (ctx) => buildCommonRoomOptions(ctx),
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
  {
    id: 'castle',
    label: '霍格沃茨城堡',
    keywords: /城堡|走廊|楼梯|门厅|肖像|幽灵|三楼|四楼|五楼|六楼|七楼/i,
    narrativeKeywords: /邓布利多.*警告|禁止.*进入|713|古灵阁.*失窃|古灵阁.*被盗|剪报|密道|隐藏通道/i,
    build: (ctx) => buildCastleExploreOptions(ctx),
  },
];

function buildPreSortingOptions() {
  return [
    { id: 'A', text: '紧张等待分院，和邻座新生搭话' },
    { id: 'B', text: '观察四大学院长桌与高年级学生' },
    { id: 'C', text: '留意哈利、罗恩、赫敏等同届生' },
    { id: 'D', text: '在心里默想最想去哪个学院' },
    { id: 'E', text: '深呼吸，回想对角巷与国王十字的经历' },
    { id: 'F', text: '自定义行动' },
  ];
}

function buildPostSortingOptions(ctx) {
  const house = ctx.state?.profile?.house || '学院';
  return [
    { id: 'A', text: '和同桌新生（哈利、罗恩、赫敏等）聊天自我介绍' },
    { id: 'B', text: '享用宴会上的食物，听高年级学生与幽灵说话' },
    { id: 'C', text: `观察${house}长桌上的同学，记住几张面孔` },
    { id: 'D', text: '向级长或珀西·韦斯莱询问怎么去公共休息室' },
    { id: 'E', text: '悄悄回味刚才分院帽的话，整理心情' },
    { id: 'F', text: '自定义行动' },
  ];
}

function buildLibraryOptions(ctx) {
  const n = ctx.narrative || '';
  if (/赫敏/.test(n)) {
    const opts = [
      { id: 'A', text: '继续和赫敏讨论《霍格沃茨校史》里的秘密' },
      { id: 'B', text: '追问三楼走廊与古灵阁失窃剪报是否有关联' },
      { id: 'C', text: '帮赫敏查找关于尼可·勒梅或守护魔法的资料' },
      { id: 'D', text: '安静自习，但留意平斯夫人的目光' },
      { id: 'E', text: '提议去公共休息室继续聊（避开平斯夫人）' },
      { id: 'F', text: '自定义行动' },
    ];
    if (/713|古灵阁/.test(n)) {
      opts[1].text = '和赫敏一起深挖713号金库失窃的报道';
    }
    return opts;
  }
  return [
    { id: 'A', text: '复习今日课程笔记' },
    { id: 'B', text: '查找与主线相关的资料（魔法石/密室等）' },
    { id: 'C', text: '安静角落自习，可能遇到在查资料的同学' },
    { id: 'D', text: '帮某人占座或一起写作业' },
    { id: 'E', text: '提前预习下一章内容' },
    { id: 'F', text: '自定义行动' },
  ];
}

function buildCommonRoomOptions(ctx) {
  const n = ctx.narrative || '';
  const house = ctx.state?.profile?.house || '学院';
  if (/赫敏|哈利|罗恩/.test(n)) {
    return [
      { id: 'A', text: '和哈利、罗恩、赫敏聊今天发生的事' },
      { id: 'B', text: '在壁炉边分享零食，听同学讲霍格沃茨的传闻' },
      { id: 'C', text: `讨论邓布利多警告或${house}的学院规矩` },
      { id: 'D', text: '复习功课，准备明天的课' },
      { id: 'E', text: '玩噼啪爆炸牌或巫师棋放松一下' },
      { id: 'F', text: '自定义行动' },
    ];
  }
  return [
    { id: 'A', text: '在壁炉边休息，听同学闲聊' },
    { id: 'B', text: '和某人单独聊几句' },
    { id: 'C', text: '复习功课或写教授布置的作业' },
    { id: 'D', text: '玩噼啪爆炸牌或巫师棋' },
    { id: 'E', text: '早点休息，准备明天上课' },
    { id: 'F', text: '自定义行动' },
  ];
}

function buildCastleExploreOptions(ctx) {
  const n = ctx.narrative || '';
  return [
    /713|古灵阁/.test(n)
      ? { id: 'A', text: '和同伴讨论古灵阁713号金库与霍格沃茨的关联' }
      : { id: 'A', text: '沿走廊散步，熟悉城堡布局' },
    /三楼|禁止/.test(n)
      ? { id: 'B', text: '远远望一眼三楼禁入的走廊（不违规靠近）' }
      : { id: 'B', text: '向高年级学生打听城堡秘闻' },
    { id: 'C', text: '去图书馆查资料，验证心里的猜测' },
    { id: 'D', text: '回公共休息室与同学交换情报' },
    { id: 'E', text: '去找可信赖的教授或级长请教（若敢）' },
    { id: 'F', text: '自定义行动' },
  ];
}

/** 是否已入学（不在国王十字/特快/对角巷阶段） */
export function isAtHogwarts(state, narrative = '') {
  const loc = state?.scene?.location ?? '';
  const n = narrative || '';
  const turns = state?.turnCount ?? 0;

  if (/霍格沃茨城堡|城堡|图书馆|公共休息室|大礼堂|教室|走廊|格兰芬多塔|地窖|温室|魁地奇|魔药|魔咒|变形|黑魔法防御/.test(loc)) {
    return true;
  }
  if (/霍格沃茨.*(第一周|第\d+周)|一年级.*新生|公共休息|图书馆|平斯|上课|教授|宵禁|学院分/.test(n)) {
    return true;
  }
  if (/霍格沃茨.*校史|《霍格沃茨|一段校史|三楼.*禁止|713|古灵阁.*失|古灵阁.*盗/.test(n)) {
    return true;
  }
  if (POST_SORTING_RE.test(n) && !/特快|火车|国王十字/.test(n.slice(-300))) return true;
  if (turns >= 2) return true;
  if (/抵达霍格沃茨|到了霍格沃茨|下车|走进城堡|来到学校/.test(n)) return true;

  if (/国王十字|9又3|对角巷|霍格沃茨特快|^火车$/i.test(loc) && turns <= 1) {
    return /抵达|到了|下车|分入|长桌|公共休息/.test(n);
  }
  return false;
}

export function detectStoryPhase(state, narrative = '') {
  const text = `${state?.scene?.location ?? ''} ${narrative}`;
  if (POST_SORTING_RE.test(text)) return 'post_sorting';
  if (/分院帽|等待分院|还没分院|即将分院|分院仪式/.test(text) && !isAtHogwarts(state, narrative)) {
    return 'pre_sorting';
  }
  return null;
}

function scoreSceneDef(def, narrative, location, atHogwarts) {
  if (atHogwarts && def.travelOnly && def.id !== 'sorting') {
    if (!def.keywords.test(narrative.slice(-1500))) return 0;
  }
  if (atHogwarts && def.id === 'sorting' && !POST_SORTING_RE.test(narrative.slice(-800))) {
    return 0;
  }

  let score = 0;
  const tail = narrative.slice(-1500);
  const countMatches = (re, text) => {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
    return (text.match(new RegExp(re.source, flags)) || []).length;
  };

  score += countMatches(def.keywords, tail) * 3;
  if (def.narrativeKeywords) score += countMatches(def.narrativeKeywords, tail) * 4;
  if (def.id === 'library' && /赫敏/.test(tail) && /校史|一段校史|《霍格沃茨|翻.*书|借阅|书架/.test(tail)) {
    score += 10;
  }
  if (def.keywords.test(location)) score += 1;
  if (def.narrativeKeywords?.test(location)) score += 2;

  return score;
}

export function detectSceneContext(state, narrative = '') {
  const location = state?.scene?.location ?? '';
  const weekday = state?.time?.weekday ?? '';
  const year = state?.profile?.year ?? 1;
  const phase = detectStoryPhase(state, narrative);
  const atHogwarts = isAtHogwarts(state, narrative);

  if (phase === 'post_sorting' && !atHogwarts) {
    const sortingDef = SCENE_DEFS.find((d) => d.id === 'sorting');
    return { id: 'post_sorting_feast', label: '分院后·开学宴', def: sortingDef, phase: 'post_sorting' };
  }

  let best = null;
  let bestScore = 0;
  for (const def of SCENE_DEFS) {
    const score = scoreSceneDef(def, narrative, location, atHogwarts);
    if (score > bestScore) {
      bestScore = score;
      best = def;
    }
  }

  if (best && bestScore >= 2) {
    const tail = narrative.slice(-1500);
    if (
      best.id === 'castle'
      && /赫敏/.test(tail)
      && /校史|一段校史|《霍格沃茨|翻.*书|借阅|书架/.test(tail)
    ) {
      const lib = SCENE_DEFS.find((d) => d.id === 'library');
      if (lib) best = lib;
    }
    return {
      id: best.id,
      label: best.label,
      def: best,
      phase: best.id === 'sorting' ? (phase || 'pre_sorting') : null,
    };
  }

  if (weekday === '周六' && year >= 3 && atHogwarts) {
    const hogsmeade = SCENE_DEFS.find((d) => d.id === 'hogsmeade');
    return { id: 'hogsmeade', label: hogsmeade.label, def: hogsmeade };
  }

  if (atHogwarts) {
    const castle = SCENE_DEFS.find((d) => d.id === 'castle');
    return { id: 'castle', label: '霍格沃茨城堡', def: castle };
  }

  return { id: 'campus', label: '霍格沃茨', def: null };
}

export function inferSceneFromOptions(optionTexts) {
  const texts = optionTexts;
  if (TRAIN_OPTION_RE.test(texts)) return 'train';
  if (STATION_OPTION_RE.test(texts)) return 'kings_cross';
  if (PRE_SORTING_OPTION_RE.test(texts)) return 'sorting';
  if (/对角巷|奥利凡德|摩金夫人/.test(texts)) return 'diagon_alley';
  if (/霍格莫德|蜂蜜公爵/.test(texts)) return 'hogsmeade';
  if (/图书馆|禁书|校史|平斯/.test(texts)) return 'library';
  if (/公共休息室|壁炉边/.test(texts)) return 'common_room';
  if (/魁地奇|球场/.test(texts)) return 'quidditch';
  return null;
}

export function areOptionsPhaseStale(options, state, narrative = '') {
  if (!options?.length || !narrative) return false;
  const texts = options.map((o) => o.text || '').join('|');
  const phase = detectStoryPhase(state, narrative);
  const atSchool = isAtHogwarts(state, narrative);

  if (phase === 'post_sorting' && PRE_SORTING_OPTION_RE.test(texts)) return true;

  if (atSchool && (TRAIN_OPTION_RE.test(texts) || STATION_OPTION_RE.test(texts))) return true;

  const templateHits = TEMPLATE_SNIPPETS.filter((s) => texts.includes(s)).length;
  if (templateHits >= 2 && atSchool) return true;

  return false;
}

export function areOptionsSceneMismatch(options, state, narrative = '') {
  if (!options?.length || !narrative) return false;
  const texts = options.map((o) => o.text || '').join('|');
  const narrativeScene = detectSceneContext(state, narrative);
  const optionScene = inferSceneFromOptions(texts);

  if (!optionScene) return false;
  if (optionScene === narrativeScene.id) return false;

  if (isAtHogwarts(state, narrative) && TRAVEL_SCENE_IDS.has(optionScene)) return true;

  if (narrativeScene.id !== 'campus' && TRAVEL_SCENE_IDS.has(optionScene)) return true;

  if (['library', 'common_room', 'castle', 'class'].includes(narrativeScene.id)
    && ['train', 'kings_cross', 'diagon_alley'].includes(optionScene)) {
    return true;
  }

  return false;
}

export function isTemplateOrCampusOptions(options, state, narrative = '') {
  if (!options?.length) return true;

  const texts = options.map((o) => o.text || '').join('|');

  if (areOptionsPhaseStale(options, state, narrative)) return true;
  if (areOptionsSceneMismatch(options, state, narrative)) return true;

  const templateHits = TEMPLATE_SNIPPETS.filter((s) => texts.includes(s)).length;
  if (templateHits >= 3) return true;

  const scene = detectSceneContext(state, narrative);
  if (scene.id === 'campus') return false;

  if (CAMPUS_KEYWORDS.test(texts) && TRAVEL_SCENE_IDS.has(scene.id)) return true;

  return false;
}

export function buildContextualOptions(state, narrative = '', classHint = '') {
  const scene = detectSceneContext(state, narrative);

  if (scene.def) {
    return scene.def.build({
      state,
      classHint,
      scene: scene.id,
      phase: scene.phase,
      narrative,
    });
  }

  const weekday = state?.time?.weekday ?? '周一';
  const year = state?.profile?.year ?? 1;
  const classLine = classHint || (weekday === '周六' || weekday === '周日' ? '周末·自习或休息' : '按课表上课');

  return [
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
}

/** 优先 AI 选项；与 narrative 阶段/场景不符则替换 */
export function resolveOptions(aiOptions, state, narrative = '', classHint = '') {
  const normalized = normalizeOptions(aiOptions);

  const shouldReplace =
    normalized.length < 4
    || isTemplateOrCampusOptions(normalized, state, narrative)
    || areOptionsSceneMismatch(normalized, state, narrative);

  if (shouldReplace) {
    return buildContextualOptions(state, narrative, classHint);
  }
  return normalized;
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
  const atSchool = isAtHogwarts(state, narrative);
  if (scene.id === 'campus' && !atSchool) return null;
  const phase = detectStoryPhase(state, narrative);
  const parts = [`当前场景：${scene.label}`];
  if (phase === 'post_sorting') parts.push('分院已完成');
  if (atSchool) parts.push('已入学，禁止给出特快/国王十字/对角巷选项');
  parts.push('选项须与本回合 narrative 末尾行动阶段一致');
  return parts.join('；');
}
