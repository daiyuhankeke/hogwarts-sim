/**
 * 原著主线 — 按玩家年级（= 哈利波特同期学年）对齐
 * 玩家为「旁观者/参与者」，不改变哈利作为事件核心的既定走向
 */

/** @typedef {{ id: string, week: number, weekEnd?: number, label: string, summary: string, mandatory?: boolean, season?: string }} CanonBeat */

export const CANON_PLOT_BY_YEAR = {
  1: {
    title: '哈利·波特与魔法石',
    beats: [
      { id: 'arrival', week: 1, label: '入学与分院', summary: '国王十字 9¾、霍格沃茨特快、分院帽、开学宴。哈利、罗恩、赫敏初识。', mandatory: true },
      { id: 'first_classes', week: 2, label: '第一堂魔法课', summary: '魔咒、变形、魔药开课；哈利飞天扫帚天赋显现。', mandatory: true },
      { id: 'troll_halloween', week: 8, label: '万圣节巨怪', summary: '魁地奇训练开始；万圣节晚宴上巨怪闯入，哈利罗恩赫敏联手，三人组雏形。', mandatory: true },
      { id: 'first_quidditch', week: 10, label: '首场魁地奇', summary: '哈利任找球手；奇洛干扰被赫敏阻止；斯内普似乎与奇洛对峙（误导）。', mandatory: true },
      { id: 'mirror_erised', week: 12, label: '厄里斯魔镜', summary: '哈利深夜发现魔镜，看到父母；邓布利多点醒「沉湎梦境」。', mandatory: false },
      { id: 'fluffy_trap', week: 22, label: '路威与活板门', summary: '三人组调查尼可·勒梅与魔法石；发现三楼路威与活板门陷阱。', mandatory: true },
      { id: 'stone_climax', week: 30, label: '魔法石之战', summary: '闯关（魔鬼网、钥匙、棋子、逻辑药水）；奇洛/伏地魔现身；哈利接触石后昏迷；邓布利多善后；学院杯逆转。', mandatory: true },
      { id: 'year_end', week: 34, label: '学年末', summary: '考试、离校；海格送相册；暑假将至。', mandatory: true },
    ],
  },
  2: {
    title: '哈利·波特与密室',
    beats: [
      { id: 'opening_chamber_rumors', week: 1, label: '密室传说', summary: '多比警告；丽痕书店与卢修斯；洛哈特任教；「密室已打开」。', mandatory: true },
      { id: 'flying_car', week: 2, label: '飞车与打人柳', summary: '多比封站；罗恩飞车；打人柳；斯内普关禁闭。', mandatory: false },
      { id: 'duelling_club', week: 6, label: '决斗俱乐部', summary: '洛哈特办决斗俱乐部；哈利与马尔福；蛇佬腔暴露；赫敏察觉。', mandatory: true },
      { id: 'polyjuice', week: 10, label: '复方汤剂', summary: '怀疑马尔福；熬制复方汤剂；混入斯莱特林套话。', mandatory: false },
      { id: 'petrifications', week: 14, label: '石化事件', summary: '洛丽丝夫人被石化；「继承人的敌人」；赫敏与差点没头的尼克亦被石化。', mandatory: true },
      { id: 'chamber_opened', week: 20, label: '金妮被掳', summary: '日记本蛊惑金妮；「她的骨架将留在密室」；邓布利多被赶走（老魔法部）。', mandatory: true },
      { id: 'chamber_climax', week: 28, label: '密室决战', summary: '哈利、罗恩、洛哈特、金妮；里德尔日记；蛇怪与福克斯；哈利用格兰芬多宝剑；多比获袜获自由。', mandatory: true },
      { id: 'year_end', week: 34, label: '学年末', summary: '考试、离校；马尔福父子阴影未散。', mandatory: true },
    ],
  },
  3: {
    title: '哈利·波特与阿兹卡班',
    beats: [
      { id: 'sirius_escape', week: 1, label: '小天狼星越狱', summary: '摄魂怪守卫霍格沃茨；火车上摄魂怪；卢平任教黑魔法防御。', mandatory: true },
      { id: 'boggart_patronus', week: 5, label: '博格特与守护神', summary: '卢平教滑稽咒；哈利博格特为摄魂怪；守护神课开始。', mandatory: true },
      { id: 'firebolt_mystery', week: 8, label: '火弩箭与疑云', summary: '哈利收匿名火弩箭；赫敏报信；克鲁克山与斑斑；活点地图出现。', mandatory: false },
      { id: 'hogsmeade_first', week: 9, label: '首次霍格莫德', summary: '三年级可去霍格莫德；尖叫棚屋与三把扫帚；福吉与麦格谈论布莱克。', mandatory: false },
      { id: 'map_marauders', week: 16, label: '活点地图', summary: '弗雷德乔治赠地图；卢平教守护神；巴克比克审判阴影。', mandatory: true },
      { id: 'buckbeak', week: 20, label: '巴克比克处决', summary: '海格败诉；处决日；时间转换器救援（赫敏/哈利）。', mandatory: true },
      { id: 'shrieking_shack', week: 26, label: '尖叫棚屋真相', summary: '布莱克现身；掠夺者身份；小矮星彼得；斯内普介入；卢平变狼人。', mandatory: true },
      { id: 'time_turner', week: 27, label: '时间转换器之夜', summary: '救小天狼星与巴克比克；摄魂怪围攻；哈利大型守护神；布莱克骑鹰马离开。', mandatory: true },
      { id: 'year_end', week: 34, label: '学年末', summary: '考试；卢平辞职；暑假。', mandatory: true },
    ],
  },
  4: {
    title: '哈利·波特与火焰杯',
    beats: [
      { id: 'world_cup', week: 1, label: '魁地奇世界杯', summary: '暑假可简述；营地、食死徒骚乱、黑魔标记；回霍格沃茨。', mandatory: false },
      { id: 'triwizard_announce', week: 4, label: '三强赛宣布', summary: '布斯巴顿、德姆斯特朗抵达；火焰杯；年龄线。', mandatory: true },
      { id: 'goblet_selection', week: 8, label: '火焰杯选勇士', summary: '克鲁姆、芙蓉、塞德里克；哈利为第四勇士；霍格沃茨哗然。', mandatory: true },
      { id: 'task1_dragon', week: 11, label: '第一项·斗龙', summary: '匈牙利树蜂；哈利得分；丽塔·斯基特报道。', mandatory: true },
      { id: 'yule_ball', week: 14, label: '圣诞舞会', summary: '勇士开舞；赫敏与克鲁姆；罗恩赫敏争吵；塞德里克与哈利交换线索。', mandatory: true },
      { id: 'task2_lake', week: 18, label: '第二项·黑湖', summary: '人质水下；塞德里克传鳃囊草；哈利救所有人；并列第一。', mandatory: true },
      { id: 'task3_maze', week: 32, label: '第三项·迷宫', summary: '迷宫内障碍；塞德里克与哈利同触奖杯；门钥匙。', mandatory: true },
      { id: 'graveyard', week: 32, label: '墓地·伏地魔复活', summary: '小矮星复活伏地魔；塞德里克遇害（或玩家 saveCedric 分支）；哈利带回尸体与真相。', mandatory: true },
      { id: 'year_end', week: 34, label: '学年末', summary: '福吉否认；穆迪实为小巴蒂；学期结束。', mandatory: true },
    ],
  },
  5: {
    title: '哈利·波特与凤凰社',
    beats: [
      { id: 'dementors_summer', week: 1, label: '摄魂怪与受审', summary: '达力遇摄魂怪；哈利被起诉；韦斯莱家；受审无罪。', mandatory: false },
      { id: 'umbridge_arrives', week: 2, label: '乌姆里奇到校', summary: '魔法部干预；黑魔法防御改理论课；禁言「神秘人归来」。', mandatory: true },
      { id: 'da_formed', week: 8, label: 'D.A. 成立', summary: '赫敏提议；有求必应屋；哈利教黑魔法防御。', mandatory: true },
      { id: 'quidditch_ban', week: 12, label: '魁地奇禁令', summary: '乌姆里奇任调查官；弗雷德乔治被终身禁赛；冲突升级。', mandatory: false },
      { id: 'st_mungo', week: 16, label: '圣芒戈与预言', summary: '韦斯莱先生遇袭；哈利看到伏地魔视角；预言球提及。', mandatory: true },
      { id: 'occlumency', week: 18, label: '大脑封闭术', summary: '斯内普教哈利；哈利看到斯内普记忆；关系恶化。', mandatory: true },
      { id: 'da_exposed', week: 24, label: 'D.A. 暴露', summary: '玛丽埃塔告密；邓布利多离开；乌姆里奇任校长。', mandatory: true },
      { id: 'umbridge_forest', week: 26, label: '乌姆里奇与马人', summary: '禁林冲突；格洛普；哈利等被马人围困。', mandatory: false },
      { id: 'ministry_battle', week: 28, label: '神秘事务司之战', summary: '伏地魔诱哈利；凤凰社 vs 食死徒；小天狼星坠落帷幔；预言球碎。', mandatory: true },
      { id: 'owl_exams', week: 33, label: 'O.W.L. 考试', summary: '考试周；哈利梦见小天狼星；实际在考古代魔文。', mandatory: true },
      { id: 'year_end', week: 34, label: '学年末', summary: '福吉承认伏地魔归来；暑假。', mandatory: true },
    ],
  },
  6: {
    title: '哈利·波特与混血王子',
    beats: [
      { id: 'slughorn_returns', week: 1, label: '斯拉格霍恩回归', summary: '斯内普任黑魔法防御；斯拉格霍恩教魔药；混血王子笔记。', mandatory: true },
      { id: 'private_lessons', week: 4, label: '邓布利多私课', summary: '记忆瓶；伏地魔身世与魂器线索开始。', mandatory: true },
      { id: 'quidditch_captain', week: 8, label: '魁地奇队长', summary: '哈利任格兰芬多队长；罗恩守门；斯拉格霍恩派对。', mandatory: false },
      { id: 'love_potion', week: 12, label: '迷情剂与罗恩', summary: '罗恩中迷情剂；解毒；拉文德·布朗；赫敏与罗恩裂痕。', mandatory: false },
      { id: 'horcrux_memory', week: 20, label: '魂器记忆', summary: '斯拉格霍恩真实记忆；汤姆·里德尔与魂器；邓布利多计划。', mandatory: true },
      { id: 'cave', week: 28, label: '岩洞', summary: '邓布利多与哈利取魂器；阴尸；邓布利多虚弱。', mandatory: true },
      { id: 'astronomy_tower', week: 30, label: '天文塔之战', summary: '食死徒入侵；马尔福任务；斯内普「杀」邓布利多；凤凰社损失。', mandatory: true },
      { id: 'year_end', week: 34, label: '学年末', summary: '邓布利多葬礼；哈利决定不再返校（原著）；玩家可留校备考 N.E.W.T.。', mandatory: true },
    ],
  },
  7: {
    title: '哈利·波特与死亡圣器（霍格沃茨篇）',
    beats: [
      { id: 'carrows_reign', week: 1, label: '卡罗兄妹掌权', summary: '食死徒控制学校；黑魔法防御教钻心咒。**哈利、罗恩、赫敏不在校**（在外狩猎魂器）；校内由纳威、金妮、卢娜等维持 D.A. 抵抗。', mandatory: true },
      { id: 'underground_resistance', week: 6, label: '地下抵抗', summary: 'D.A. 重组；有求必应屋；纳威领导。**禁止把哈利/罗恩/赫敏写在大礼堂、课堂、图书馆等校内日常场景**；仅可提及校外消息或《唱唱反调》传闻。', mandatory: false },
      { id: 'taboo_hunt', week: 12, label: '魂器 hunt 背景', summary: '校外哈利寻魂器；校内玩家听闻零星消息；斯内普校长。', mandatory: false },
      { id: 'harry_returns', week: 28, label: '哈利回校', summary: '哈利、罗恩、赫敏潜入；拉文克劳冠冕线索；失踪柜。', mandatory: true },
      { id: 'battle_hogwarts', week: 32, label: '霍格沃茨大战', summary: '食死徒围攻；疏散；斯内普之死与记忆；哈利赴禁林；伏地魔终亡。', mandatory: true },
      { id: 'year_end', week: 34, label: '战后重建', summary: '伤亡清点；纪念；N.E.W.T. 取消或简化；新学年希望。', mandatory: true },
    ],
  },
};

export function getCanonPlotForYear(year) {
  return CANON_PLOT_BY_YEAR[year] || CANON_PLOT_BY_YEAR[1];
}

export function createInitialCanonPlot(year) {
  return {
    year,
    title: getCanonPlotForYear(year).title,
    completed: [],
    divergences: [],
  };
}

/** 将 AI/旧存档的无前缀 beat id 规范为「年级:id」 */
function normalizeCompletedKeys(completed, year) {
  const seen = new Set();
  const out = [];
  for (const raw of completed || []) {
    const key = String(raw).includes(':') ? String(raw) : `${year}:${raw}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

function markPreviousYearMandatoryCompleted(plot, year) {
  for (let y = 1; y < year; y++) {
    for (const beat of getCanonPlotForYear(y).beats) {
      if (!beat.mandatory) continue;
      const key = `${y}:${beat.id}`;
      if (!plot.completed.includes(key)) plot.completed.push(key);
    }
  }
  if (year > 1 && !plot.divergences.some((d) => d.includes('年级入学'))) {
    plot.divergences.push(`玩家自 ${year} 年级入学，一至 ${year - 1} 学年原著主线视为已发生（背景摘要）`);
  }
}

export function migrateCanonPlot(state) {
  const year = state.profile?.year ?? 1;
  const existing = state.flags?.canonPlot;

  if (existing?.year === year) {
    return {
      year,
      title: existing.title || getCanonPlotForYear(year).title,
      completed: normalizeCompletedKeys(existing.completed, year),
      divergences: existing.divergences || [],
    };
  }

  // AI 浅合并可能抹掉 year，或写入错误年级 — 保留已完成的当前学年节点并修复
  if (existing && (existing.year == null || existing.year === undefined)) {
    const plot = {
      year,
      title: getCanonPlotForYear(year).title,
      completed: normalizeCompletedKeys(existing.completed, year),
      divergences: existing.divergences || [],
    };
    if (year > 1) markPreviousYearMandatoryCompleted(plot, year);
    return plot;
  }

  const plot = createInitialCanonPlot(year);
  if (year > 1) markPreviousYearMandatoryCompleted(plot, year);
  return plot;
}

function isBeatCompleted(completed, year, beatId) {
  return completed.has(`${year}:${beatId}`);
}

export function getDueBeat(plot, week) {
  const yearPlot = getCanonPlotForYear(plot.year);
  const completed = new Set(plot.completed || []);

  for (const beat of yearPlot.beats) {
    const key = `${plot.year}:${beat.id}`;
    if (isBeatCompleted(completed, plot.year, beat.id)) continue;
    const end = beat.weekEnd ?? beat.week;
    if (week >= beat.week - 1 && week <= end + 2) {
      return { ...beat, key, overdue: week > end + 1 };
    }
  }
  return null;
}

export function getNextMandatoryBeat(plot) {
  const yearPlot = getCanonPlotForYear(plot.year);
  const completed = new Set(plot.completed || []);
  for (const beat of yearPlot.beats) {
    if (!beat.mandatory) continue;
    const key = `${plot.year}:${beat.id}`;
    if (!isBeatCompleted(completed, plot.year, beat.id)) {
      return { ...beat, key };
    }
  }
  return null;
}

export function getUpcomingCanonBeats(plot, week, limit = 4) {
  const yearPlot = getCanonPlotForYear(plot.year);
  const completed = new Set(plot.completed || []);
  return yearPlot.beats
    .filter((b) => {
      const key = `${plot.year}:${b.id}`;
      return !isBeatCompleted(completed, plot.year, b.id) && b.week >= week;
    })
    .slice(0, limit)
    .map((b) => ({ ...b, key: `${plot.year}:${b.id}` }));
}

export function mergeCanonPlotUpdate(plot, update, profileYear) {
  if (!update) return plot;
  const year = profileYear ?? plot?.year ?? 1;
  const next = {
    year,
    title: getCanonPlotForYear(year).title,
    completed: normalizeCompletedKeys(plot?.completed, year),
    divergences: [...(plot?.divergences || [])],
  };
  if (update.completed) {
    for (const id of update.completed) {
      const key = String(id).includes(':') ? String(id) : `${year}:${id}`;
      if (!next.completed.includes(key)) next.completed.push(key);
    }
  }
  if (update.divergence) {
    next.divergences = [...next.divergences, update.divergence].slice(-5);
  }
  return next;
}

/** 供 AI 与 UI 使用的主线上下文 */
export function getCanonicalPlotContext(state) {
  const year = state.profile?.year ?? 1;
  const week = state.time?.week ?? 1;
  const plot = migrateCanonPlot(state);
  const yearPlot = getCanonPlotForYear(year);
  const due = getDueBeat(plot, week);
  const nextMandatory = getNextMandatoryBeat(plot);
  const upcoming = getUpcomingCanonBeats(plot, week);

  const saveCedric = state.flags?.saveCedric === true;
  let dmRules = [
    '主线必须与原著哈利波特同期事件对齐；哈利·波特是事件核心，玩家为同级目击者/参与者。',
    '禁止跳过或改写原著关键节点（如伏地魔复活、邓布利多之死），但玩家个人恋爱/日常可自由展开。',
    '每 8-12 回合应推进或呼应至少一个主线 beat；到达 beat 周次时必须安排相关剧情或背景提及。',
  ];

  if (year === 4 && saveCedric) {
    dmRules.push('玩家希望拯救塞德里克：迷宫/墓地场景中可安排玩家行动使塞德里克存活，但伏地魔复活仍须发生。');
  }
  if (year >= 5 && year < 7) {
    dmRules.push('乌姆里奇、D.A.、神秘事务司等五年级主线不可省略（若玩家为五年级）。');
  }
  if (year === 7) {
    const harryBack = week >= 28;
    if (harryBack) {
      dmRules.push('第28周起哈利、罗恩、赫敏已潜入霍格沃茨，可写短暂同场直至大战；此前学年三人不在校。');
    } else {
      dmRules.push(
        '【七年级硬性规则】哈利·波特、罗恩·韦斯莱、赫敏·格兰杰整学年在外逃亡狩猎魂器，不在霍格沃茨上课、用餐、图书馆或日常社交。',
        '禁止把三人写在大礼堂/课堂/公共休息室与玩家同桌、早餐、讨论抵抗计划；校内抵抗由纳威·隆巴顿、金妮·韦斯莱、卢娜·洛夫古德等带领。',
        '若需提及三人，仅限校外消息、预言家日报、《唱唱反调》传闻或玩家回忆，不可实体出场。',
      );
    }
  }

  const harryReturnsWeek = 28;
  const goldenTrioAbsent = year === 7 && week < harryReturnsWeek;

  return {
    year,
    title: yearPlot.title,
    week,
    dueBeat: due ? { id: due.id, label: due.label, summary: due.summary, overdue: due.overdue } : null,
    nextMandatory: nextMandatory ? { id: nextMandatory.id, label: nextMandatory.label, summary: nextMandatory.summary } : null,
    upcomingBeats: upcoming.map((b) => ({ week: b.week, label: b.label })),
    completedCount: (plot.completed || []).filter((k) => String(k).startsWith(`${year}:`) || !String(k).includes(':')).length,
    totalBeats: yearPlot.beats.length,
    saveCedricBranch: year === 4 && saveCedric,
    absentFromHogwarts: goldenTrioAbsent ? ['哈利·波特', '罗恩·韦斯莱', '赫敏·格兰杰'] : [],
    onCampusFocus: goldenTrioAbsent ? ['纳威·隆巴顿', '金妮·韦斯莱', '卢娜·洛夫古德'] : null,
    harryReturnsWeek: year === 7 ? harryReturnsWeek : null,
    dmRules: dmRules.join(' '),
    dmHint: due
      ? `【本阶段主线】第${week}周应推进「${due.label}」：${due.summary}`
      : nextMandatory
        ? `下一必经主线（第${nextMandatory.week}周）：${nextMandatory.label} — ${nextMandatory.summary}`
        : `${yearPlot.title} 本学年主线已推进完毕，可聚焦日常与感情线。`,
  };
}

export function getCanonEventsForCalendar(state) {
  const year = state.profile?.year ?? 1;
  const yearPlot = getCanonPlotForYear(year);
  const week = state.time?.week ?? 1;
  const completed = new Set(migrateCanonPlot(state).completed || []);

  return yearPlot.beats
    .filter((b) => !isBeatCompleted(completed, year, b.id) && b.week >= week && b.week <= week + 4)
    .map((b) => ({
      id: b.id,
      week: b.week,
      label: `[主线] ${b.label}`,
      canon: true,
    }));
}
