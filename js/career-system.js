/**
 * 巫师职业系统 — 毕业后择业，含原著向 O.W.L. 门槛
 */

import { OWL_EXAM_SUBJECTS, OWL_GRADE_NAMES } from './magic-system.js';

const GRADE_RANK = { O: 0, E: 1, A: 2, P: 3, D: 4, T: 5 };

const SUBJECT_NAMES = Object.fromEntries(OWL_EXAM_SUBJECTS.map((s) => [s.id, s.name]));

/** @typedef {{ id: string, name: string, category: 'ministry'|'independent', tagline: string, income: [number, number], risk: number, stability: number, freedom: number, traits: string[], requirements?: object|null, requirementNote: string, recommendedClubs?: string[] }} CareerDef */

const CLUB_HINTS = {
  quidditch: '建议有魁地奇校队经历，更易被球探或联盟注意',
  library: '建议有图书馆研究组经历，学术档案岗位更顺',
  creature: '建议有神奇生物兴趣组经历，野外调查岗更对口',
  da: '建议有 D.A. 经历，战斗向岗位更吃香',
  slug: '建议有斯拉格霍恩俱乐部人脉，商业与魔药圈更好立足',
  charms: '建议有魔咒创新社经历，研发类岗位加分',
};

/** @type {CareerDef[]} */
export const CAREERS = [
  {
    id: 'auror',
    name: '傲罗办公室',
    category: 'ministry',
    tagline: '钱和荣誉都有，但基本跟准点下班说再见。',
    income: [180, 300],
    risk: 5,
    stability: 3,
    freedom: 1,
    traits: ['战斗型', '正义感强', '抗压高'],
    requirements: {
      subjects: {
        dada: 'E',
        charms: 'E',
        potions: 'E',
        transfiguration: 'E',
        herbology: 'E',
      },
      minAtOrAbove: { grade: 'E', count: 5 },
    },
    requirementNote: '原著（麦格教授）：至少五门 O.W.L. 达 E 或以上，须含黑魔法防御、魔咒、魔药、变形、草药。',
  },
  {
    id: 'law_enforcement',
    name: '魔法法律执行司',
    category: 'ministry',
    tagline: '最像「稳定单位」，但常在制度与人情之间拉扯。',
    income: [130, 220],
    risk: 3,
    stability: 5,
    freedom: 2,
    traits: ['逻辑清晰', '规则感强', '善辩'],
    requirements: {
      subjects: { dada: 'E', charms: 'E', history: 'E' },
    },
    requirementNote: '须黑魔法防御、魔咒、魔法史均达 E 或以上（执法与判例基础）。',
  },
  {
    id: 'magical_accidents',
    name: '魔法事故和灾害司',
    category: 'ministry',
    tagline: '每天都在帮别人收拾魔法烂摊子。',
    income: [140, 230],
    risk: 4,
    stability: 4,
    freedom: 2,
    traits: ['反应快', '临场解决问题', '耐混乱'],
    requirements: {
      subjects: { charms: 'E', transfiguration: 'A', dada: 'A' },
    },
    requirementNote: '须魔咒 E+、变形 A+、黑魔法防御 A+（应急修复与防护）。',
  },
  {
    id: 'magical_creatures',
    name: '神奇动物管理控制司',
    category: 'ministry',
    tagline: '它们真的很可爱，但你也真的会被咬。',
    income: [120, 200],
    risk: 4,
    stability: 3,
    freedom: 3,
    traits: ['爱动物', '野外行动力强', '耐心高'],
    requirements: {
      subjects: { care: 'E', herbology: 'A' },
    },
    requirementNote: '须神奇生物 E+、草药学 A+（海格式岗位基础门槛）。',
  },
  {
    id: 'international_cooperation',
    name: '国际魔法合作司',
    category: 'ministry',
    tagline: '表面体面，实际天天处理跨国麻烦。',
    income: [150, 260],
    risk: 2,
    stability: 4,
    freedom: 2,
    traits: ['语言好', '社交与礼仪', '背景干净'],
    requirements: {
      subjects: { history: 'E', charms: 'E', astronomy: 'A' },
    },
    requirementNote: '须魔法史、魔咒 E+，天文学 A+（外交文书与跨文化沟通）。',
  },
  {
    id: 'healer',
    name: '圣芒戈治疗师',
    category: 'independent',
    tagline: '体面、专业、受尊敬，但心理压力不小。',
    income: [160, 280],
    risk: 4,
    stability: 3,
    freedom: 2,
    traits: ['细致', '抗压', '同理心'],
    requirements: {
      subjects: {
        potions: 'E',
        transfiguration: 'E',
        herbology: 'E',
        charms: 'A',
      },
    },
    requirementNote: '原著向：魔药、变形、草药须 E+，魔咒 A+（对应 N.E.W.T. 治疗方向前置）。',
  },
  {
    id: 'professor',
    name: '霍格沃茨教师 / 研究员',
    category: 'independent',
    tagline: '听着稳定，但霍格沃茨的「学校事故」从不缺席。',
    income: [120, 220],
    risk: 3,
    stability: 4,
    freedom: 3,
    traits: ['学术型', '表达清晰', '耐心'],
    requirements: {
      anyAtLeast: {
        grade: 'E',
        subjects: ['charms', 'transfiguration', 'potions', 'dada', 'herbology', 'care', 'history', 'astronomy'],
      },
    },
    requirementNote: '至少一门任教学科 O.W.L. 达 E 或以上（对应 N.E.W.T. 专攻方向）。',
  },
  {
    id: 'reporter',
    name: '预言家日报记者',
    category: 'independent',
    tagline: '自由是真的自由，得罪人也是真的容易。',
    income: [90, 200],
    risk: 3,
    stability: 2,
    freedom: 4,
    traits: ['好奇', '文笔', '厚脸皮'],
    requirements: null,
    requirementNote: '无硬性 O.W.L. 门槛；魔法史或魔咒成绩好更易入行。',
  },
  {
    id: 'quidditch',
    name: '魁地奇职业球员',
    category: 'independent',
    tagline: '上限很高，伤病、状态与退役焦虑也很真实。',
    income: [80, 500],
    risk: 4,
    stability: 2,
    freedom: 4,
    traits: ['运动天赋', '团队意识', '敢拼'],
    requirements: null,
    requirementNote: '无硬性 O.W.L. 门槛；校队经历与飞行能力是主要考量。',
    recommendedClubs: ['quidditch'],
  },
  {
    id: 'shopkeeper',
    name: '对角巷店主 / 手艺人',
    category: 'independent',
    tagline: '自由度最高，收入看手艺、客源与运气。',
    income: [100, 400],
    risk: 2,
    stability: 2,
    freedom: 5,
    traits: ['商业头脑', '手艺', '耐心'],
    requirements: {
      subjects: { charms: 'A' },
      anyAtLeast: {
        grade: 'A',
        subjects: ['transfiguration', 'herbology', 'potions'],
      },
    },
    requirementNote: '须魔咒 A+，且变形 / 草药 / 魔药至少一门 A+（制作与经营基础）。',
  },
  {
    id: 'misuse_muggle_artifacts',
    name: '滥用麻瓜物品司',
    category: 'ministry',
    tagline: '工资不算高，但你能合法拆闹钟和插头——亚瑟·韦斯莱的快乐岗位。',
    income: [110, 180],
    risk: 2,
    stability: 4,
    freedom: 3,
    traits: ['好奇心', '动手能力', '对麻瓜友善'],
    requirements: {
      subjects: { charms: 'A', history: 'A' },
    },
    requirementNote: '须魔咒、魔法史 A+（拆解与登记麻瓜物品需扎实基础）。',
  },
  {
    id: 'magical_transport',
    name: '魔法交通司',
    category: 'ministry',
    tagline: '飞路网堵不堵、门钥匙合不合规，都归你管。',
    income: [125, 210],
    risk: 3,
    stability: 4,
    freedom: 2,
    traits: ['细致', '空间感', '守时'],
    requirements: {
      subjects: { charms: 'E', transfiguration: 'A' },
    },
    requirementNote: '须魔咒 E+、变形 A+（传送与路径类魔法核心科目）。',
  },
  {
    id: 'obliviator',
    name: '记忆注销专员',
    category: 'ministry',
    tagline: '一忘皆空之后，还得写报告说明为什么又得施一忘皆空。',
    income: [135, 220],
    risk: 3,
    stability: 3,
    freedom: 2,
    traits: ['冷静', '保密', '伦理感'],
    requirements: {
      subjects: { charms: 'E', dada: 'A', history: 'A' },
    },
    requirementNote: '须魔咒 E+，黑魔法防御与魔法史 A+（记忆修改与善后记录）。',
  },
  {
    id: 'wizengamot_clerk',
    name: '威森加摩书记官',
    category: 'ministry',
    tagline: '旁听最高法庭，笔杆子比魔杖更常出手。',
    income: [140, 240],
    risk: 2,
    stability: 5,
    freedom: 2,
    traits: ['文书功底', '中立', '记忆力好'],
    requirements: {
      subjects: { history: 'E', charms: 'E' },
    },
    requirementNote: '须魔法史、魔咒 E+（判例档案与记录咒）。',
  },
  {
    id: 'unspeakable',
    name: '神秘事务司 · 缄默人',
    category: 'ministry',
    tagline: '你知道的越多，能说的越少。入职后请忘记这条提示。',
    income: [200, 350],
    risk: 5,
    stability: 4,
    freedom: 1,
    traits: ['极强自律', '抗压', '守口如瓶'],
    requirements: {
      subjects: {
        astronomy: 'E',
        history: 'E',
        charms: 'E',
        transfiguration: 'E',
        dada: 'E',
      },
      minAtOrAbove: { grade: 'E', count: 6 },
    },
    requirementNote: '极高门槛：至少六门 E+，且天文学、魔法史、魔咒、变形、黑魔法防御均 E+（神秘事务司选拔向）。',
  },
  {
    id: 'curse_breaker',
    name: '古灵阁诅咒破解员',
    category: 'independent',
    tagline: '比尔·韦斯莱同款高危高薪，龙与诅咒都是日常同事。',
    income: [170, 320],
    risk: 5,
    stability: 2,
    freedom: 3,
    traits: ['胆识', '古代知识', '团队配合'],
    requirements: {
      subjects: { dada: 'E', charms: 'E', history: 'A', transfiguration: 'A' },
      minAtOrAbove: { grade: 'E', count: 4 },
    },
    requirementNote: '须黑魔法防御、魔咒 E+，魔法史与变形 A+，且至少四门 E+（古灵阁培训标准）。',
  },
  {
    id: 'potioneer',
    name: '魔药调配师',
    category: 'independent',
    tagline: '对角巷药房、圣芒戈后勤、私人定制药剂——都缺稳定的魔药手。',
    income: [130, 260],
    risk: 3,
    stability: 3,
    freedom: 3,
    traits: ['耐心', '精确', '嗅觉灵敏'],
    requirements: {
      subjects: { potions: 'E', herbology: 'E' },
    },
    requirementNote: '须魔药、草药学 E+（斯内普式严苛标准的职场版）。',
    recommendedClubs: ['slug'],
  },
  {
    id: 'wandmaker',
    name: '魔杖匠人',
    category: 'independent',
    tagline: '奥利凡德先生那种「记得每一根魔杖」的手艺，需要十年磨一剑。',
    income: [150, 280],
    risk: 2,
    stability: 3,
    freedom: 4,
    traits: ['专注', '感知力', '匠人精神'],
    requirements: {
      subjects: { charms: 'E', transfiguration: 'E' },
    },
    requirementNote: '须魔咒、变形 E+（杖芯与木材匹配依赖高阶魔咒学）。',
    recommendedClubs: ['charms'],
  },
  {
    id: 'magizoologist',
    name: '神奇动物学家',
    category: 'independent',
    tagline: '写图鉴、跟龙、追嗅嗅——纽特·斯卡曼德的路，浪漫与危险并存。',
    income: [110, 240],
    risk: 4,
    stability: 2,
    freedom: 5,
    traits: ['爱心', '观察力', '野外生存'],
    requirements: {
      subjects: { care: 'E', herbology: 'E', charms: 'A' },
    },
    requirementNote: '须神奇生物、草药学 E+，魔咒 A+（追踪与保护类咒语）。',
    recommendedClubs: ['creature'],
  },
  {
    id: 'herbologist',
    name: '草药学专家 / 温室研究员',
    category: 'independent',
    tagline: '在霍格沃茨温室或私人庄园，与曼德拉草打一辈子交道。',
    income: [100, 200],
    risk: 2,
    stability: 4,
    freedom: 4,
    traits: ['耐心', '早起', '不怕脏'],
    requirements: {
      subjects: { herbology: 'E', potions: 'A', astronomy: 'A' },
    },
    requirementNote: '须草药学 E+，魔药与天文学 A+（种植周期与月相相关）。',
  },
  {
    id: 'hit_wizard',
    name: '受雇打击手',
    category: 'independent',
    tagline: '不是傲罗，但同样要拿魔杖说话——私人安保与危险委托。',
    income: [150, 280],
    risk: 4,
    stability: 2,
    freedom: 3,
    traits: ['实战', '警觉', '独立'],
    requirements: {
      subjects: { dada: 'E', charms: 'A' },
      minAtOrAbove: { grade: 'E', count: 3 },
    },
    requirementNote: '须黑魔法防御 E+、魔咒 A+，且至少三门 E+（低于傲罗，但仍偏战斗向）。',
    recommendedClubs: ['da'],
  },
  {
    id: 'librarian',
    name: '魔法图书馆管理员',
    category: 'independent',
    tagline: '禁书区附近值班，平斯夫人会教你怎么用眼神让人闭嘴。',
    income: [95, 170],
    risk: 2,
    stability: 5,
    freedom: 3,
    traits: ['安静', '分类强迫症', '博学'],
    requirements: {
      subjects: { history: 'E', charms: 'A' },
    },
    requirementNote: '须魔法史 E+、魔咒 A+（古籍维护与检索咒）。',
    recommendedClubs: ['library'],
  },
  {
    id: 'museum_custodian',
    name: '魔法史博物 / 藏品研究员',
    category: 'independent',
    tagline: '整理文物、鉴定诅咒物品、写展签——历史爱好者的体面出路。',
    income: [100, 190],
    risk: 3,
    stability: 4,
    freedom: 3,
    traits: ['考据', '耐心', '细节控'],
    requirements: {
      subjects: { history: 'E', dada: 'A', charms: 'A' },
    },
    requirementNote: '须魔法史 E+，黑魔法防御与魔咒 A+（诅咒文物防护）。',
    recommendedClubs: ['library'],
  },
  {
    id: 'wheezes_entrepreneur',
    name: '笑话与防护用品创业',
    category: 'independent',
    tagline: '弗雷德与乔治式的自由——产品要好玩，还得保证不炸掉眉毛。',
    income: [80, 450],
    risk: 3,
    stability: 1,
    freedom: 5,
    traits: ['创意', '商业嗅觉', '敢冒险'],
    requirements: {
      subjects: { charms: 'A', potions: 'A' },
    },
    requirementNote: '须魔咒、魔药 A+（玩笑商品本质是魔咒与魔药工程）。',
    recommendedClubs: ['charms', 'slug'],
  },
  {
    id: 'quidditch_staff',
    name: '魁地奇教练 / 裁判',
    category: 'independent',
    tagline: '飞够了就转幕后，但球场上的火药味一点没少。',
    income: [90, 220],
    risk: 2,
    stability: 3,
    freedom: 4,
    traits: ['经验', '公正', '战术眼光'],
    requirements: null,
    requirementNote: '无硬性 O.W.L. 门槛；职业球员或校队长期经历是主要凭证。',
    recommendedClubs: ['quidditch'],
  },
  {
    id: 'dragon_handler',
    name: '火龙研究与保护区专员',
    category: 'independent',
    tagline: '查理·韦斯莱的路——浪漫、烧焦的眉毛，以及很高的工伤率。',
    income: [140, 260],
    risk: 5,
    stability: 2,
    freedom: 4,
    traits: ['胆识', '动物直觉', '体力好'],
    requirements: {
      subjects: { care: 'E', dada: 'E', herbology: 'A' },
    },
    requirementNote: '须神奇生物与黑魔法防御 E+，草药 A+（罗马尼亚式火龙研究岗）。',
    recommendedClubs: ['creature'],
  },
  {
    id: 'wardrobe_enchanter',
    name: '摩金夫人 · 长袍与 enchanted 时装师',
    category: 'independent',
    tagline: '给袍子加伸缩咒、防污咒、永久熨烫——魔法界也需要时尚。',
    income: [110, 230],
    risk: 1,
    stability: 3,
    freedom: 4,
    traits: ['审美', '手工', '耐心'],
    requirements: {
      subjects: { transfiguration: 'E', charms: 'A' },
    },
    requirementNote: '须变形 E+、魔咒 A+（衣物永久变形与附魔）。',
  },
  {
    id: 'broom_craftsperson',
    name: '飞天扫帚工艺师',
    category: 'independent',
    tagline: '光轮、火弩箭背后那双手——飞行与魔咒的交叉工种。',
    income: [120, 280],
    risk: 2,
    stability: 3,
    freedom: 4,
    traits: ['精密', '飞行常识', '工匠精神'],
    requirements: {
      subjects: { charms: 'E', transfiguration: 'A' },
    },
    requirementNote: '须魔咒 E+、变形 A+（扫帚平衡咒与材料处理）。',
    recommendedClubs: ['quidditch'],
  },
  {
    id: 'freelance_investigator',
    name: '独立巫师侦探',
    category: 'independent',
    tagline: '不受魔法部编制，专门接失踪、盗窃、名誉案——自由，但常得罪人。',
    income: [100, 280],
    risk: 3,
    stability: 2,
    freedom: 5,
    traits: ['推理', '跟踪', '嘴严'],
    requirements: {
      subjects: { history: 'A', dada: 'A', charms: 'A' },
    },
    requirementNote: '须魔法史、黑魔法防御、魔咒均 A+（追踪与防护的综合门槛，低于傲罗）。',
  },
];

export function owlMeetsMin(grade, minGrade) {
  if (!grade || !minGrade) return false;
  return GRADE_RANK[grade] <= GRADE_RANK[minGrade];
}

export function countGradesAtLeast(results, minGrade) {
  if (!results) return 0;
  return Object.values(results).filter((g) => owlMeetsMin(g, minGrade)).length;
}

function getSubjectLabel(id) {
  return SUBJECT_NAMES[id] || id;
}

function formatGrade(g) {
  if (!g) return '—';
  const name = OWL_GRADE_NAMES[g];
  return name ? `${g}（${name}）` : g;
}

/** @param {CareerDef} career */
export function checkCareerEligibility(career, state) {
  const owls = state?.magic?.owls;
  const results = owls?.results;

  if (career.requirements === null) {
    return { eligible: true, reasons: [], softHints: getSoftHints(career, state) };
  }

  if (owls?.status !== 'completed' || !results) {
    return { eligible: false, reasons: ['须先完成 O.W.L. 考试（五年级期末）'], softHints: [] };
  }

  const reasons = [];
  const req = career.requirements;

  if (req.subjects) {
    for (const [subId, minGrade] of Object.entries(req.subjects)) {
      const g = results[subId];
      if (!owlMeetsMin(g, minGrade)) {
        reasons.push(`${getSubjectLabel(subId)} 需 ${minGrade}+，当前 ${formatGrade(g)}`);
      }
    }
  }

  if (req.minAtOrAbove) {
    const { grade, count } = req.minAtOrAbove;
    const n = countGradesAtLeast(results, grade);
    if (n < count) {
      reasons.push(`至少 ${count} 科 ${grade}+，当前 ${n} 科`);
    }
  }

  if (req.anyAtLeast) {
    const { grade, subjects } = req.anyAtLeast;
    const ok = subjects.some((s) => owlMeetsMin(results[s], grade));
    if (!ok) {
      const names = subjects.map(getSubjectLabel).join(' / ');
      reasons.push(`须 ${names} 中至少一门 ${grade}+`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    softHints: getSoftHints(career, state),
  };
}

function getSoftHints(career, state) {
  const hints = [];
  const clubs = state?.progression?.clubs || [];
  if (career.recommendedClubs?.length) {
    for (const clubId of career.recommendedClubs) {
      if (!clubs.includes(clubId) && CLUB_HINTS[clubId]) {
        hints.push(CLUB_HINTS[clubId]);
      }
    }
  }
  return hints;
}

export function getCareerById(id) {
  return CAREERS.find((c) => c.id === id) || null;
}

export function getCareerOptions(state) {
  return CAREERS.map((career) => {
    const check = checkCareerEligibility(career, state);
    return { career, ...check };
  });
}

export function createInitialCareer() {
  return { chosenId: null, chosenName: null, chosenAt: null };
}

export function migrateCareer(state) {
  if (state?.career?.chosenId !== undefined) return state.career;
  return createInitialCareer();
}

/** 七年级学年末（第 34 周）且已完成 O.W.L.，尚未择业 */
export function isGraduationReady(state) {
  if (!state || state.career?.chosenId) return false;
  if ((state.profile?.year ?? 0) < 7) return false;
  if (state.magic?.owls?.status !== 'completed') return false;
  return (state.time?.week ?? 0) >= 34;
}

/** 七年级且距毕业不远，用于侧栏提示 */
export function isCareerPrepPhase(state) {
  if (!state || state.career?.chosenId) return false;
  if ((state.profile?.year ?? 0) < 7) return false;
  return (state.time?.week ?? 0) >= 28;
}

export function selectCareer(state, careerId) {
  const career = getCareerById(careerId);
  if (!career) throw new Error('未知职业');

  const check = checkCareerEligibility(career, state);
  if (!check.eligible) {
    throw new Error(check.reasons[0] || '不满足该职业门槛');
  }

  return {
    ...state,
    career: {
      chosenId: career.id,
      chosenName: career.name,
      chosenAt: { week: state.time?.week, weekday: state.time?.weekday },
    },
    flags: {
      ...state.flags,
      graduated: true,
    },
  };
}

export function getCareerContext(state) {
  if (!state?.career?.chosenId) {
    return {
      graduated: false,
      graduationReady: isGraduationReady(state),
      careerPrep: isCareerPrepPhase(state),
      eligibleCareers: isGraduationReady(state)
        ? getCareerOptions(state)
            .filter((o) => o.eligible)
            .map((o) => ({ id: o.career.id, name: o.career.name }))
        : [],
    };
  }

  const career = getCareerById(state.career.chosenId);
  return {
    graduated: true,
    career: {
      id: career?.id,
      name: state.career.chosenName,
      category: career?.category,
      tagline: career?.tagline,
    },
    dmReminder: `玩家已毕业，职业为「${state.career.chosenName}」。后续叙事应进入职场/新人生阶段，可写入职、实习、首月体验等，保持三分甜七分现实基调。`,
  };
}

export function buildGraduationCareerOptions(state) {
  const eligible = getCareerOptions(state).filter((o) => o.eligible);
  const built = [
    { id: 'A', text: '打开完整职业目录（共 ' + eligible.length + ' 个可选方向）', openCareerModal: true },
  ];

  const letters = ['B', 'C', 'D', 'E'];
  eligible.slice(0, 4).forEach((o, i) => {
    built.push({
      id: letters[i],
      text: `选择职业：${o.career.name}`,
      careerId: o.career.id,
    });
  });

  built.push({ id: 'F', text: '自定义行动（描述毕业后的打算）' });
  return built;
}

export function formatIncomeRange(income) {
  const [lo, hi] = income;
  if (hi >= 500) return `${lo}–${hi}+ 加隆/月`;
  return `${lo}–${hi} 加隆/月`;
}

export function renderStars(n, max = 5) {
  const filled = Math.max(0, Math.min(max, n));
  return '★'.repeat(filled) + '☆'.repeat(max - filled);
}
