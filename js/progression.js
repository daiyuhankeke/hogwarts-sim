import { createInitialFamilyTrack, migrateFamilyTrack, processFamilyAfterTurn } from './family-interactions.js';
import { isExtremePurebloodFamily } from './family-background.js';

/** 社团、学院分、成就、回忆、里程碑、舆论、大事件准备、考试、守护神、魔杖相性 */

export const CLUB_OPTIONS = [
  { id: 'da', name: 'D.A. 邓布利多军', desc: '黑魔法防御与决斗' },
  { id: 'quidditch', name: '魁地奇校队', desc: '飞行与团队' },
  { id: 'dueling', name: '决斗俱乐部', desc: '咒语对决练习' },
  { id: 'slug', name: '斯拉格霍恩俱乐部', desc: '社交与魔药人脉' },
  { id: 'library', name: '图书馆研究组', desc: '自习与学术' },
  { id: 'creature', name: '神奇生物兴趣组', desc: '海格场地活动' },
  { id: 'gobstones', name: '戈布石俱乐部', desc: '休闲竞技' },
  { id: 'charms', name: '魔咒创新社', desc: '实验性咒语' },
];

export const MAX_CLUBS = 3;

export const AFFECTION_MILESTONES = [
  { id: 'first_notice', at: 21, title: '留下印象', template: '与{name}从陌生人变为「有印象」' },
  { id: 'interest', at: 41, title: '引起兴趣', template: '{name}开始对你产生兴趣' },
  { id: 'ambiguous', at: 61, title: '暧昧萌芽', template: '与{name}进入暧昧期' },
  { id: 'together', at: 76, title: '确认关系', template: '与{name}确认恋爱关系' },
  { id: 'passion', at: 91, title: '热恋', template: '与{name}处于热恋中' },
];

export const ACHIEVEMENTS = [
  { id: 'first_wand', name: '魔杖择主', desc: '在奥利凡德获得魔杖' },
  { id: 'first_points', name: '学院之光', desc: '首次为学院赢得分数' },
  { id: 'detention', name: '禁闭室常客', desc: '第一次被关禁闭' },
  { id: 'hogsmeade', name: '霍格莫德通行证', desc: '首次前往霍格莫德' },
  { id: 'yule_invite', name: '舞会邀请', desc: '圣诞舞会邀请成功' },
  { id: 'patronus', name: '呼神护卫', desc: '成功召唤守护神' },
  { id: 'owl_done', name: 'O.W.L. 幸存者', desc: '完成五年级 O.W.L.' },
  { id: 'club_active', name: '社团达人', desc: '参加 3 次以上社团活动' },
  { id: 'gossip_peak', name: '话题人物', desc: '流言等级达到最高' },
  { id: 'he_any', name: '幸福结局', desc: '达成任意 HE' },
  { id: 'career_chosen', name: '职场新人', desc: '毕业后选定职业' },
];

export const WAND_AFFINITY_HINTS = {
  冬青木: '正义与勇气；变形与保护类魔法较顺',
  山楂木: '矛盾天赋；魔咒学易有顿悟',
  柳木: '治愈与变化；魔咒细腻',
  葡萄藤木: '敏锐直觉；魔咒与占卜亲和',
  黑胡桃木: '意志坚定；变形与黑魔法防御出色',
  樱桃木: '优雅精准；魔咒学稳定',
  紫杉木: '生死边缘之力；高阶咒语潜力',
  橡木: '忠诚与耐力；防御类魔法可靠',
  独角兽毛: '稳定忠诚；不易滑向黑魔法',
  凤凰羽毛: '潜力最大；魔法波动大',
  龙心弦: '力量强；易走火，魔咒威力大',
};

const PREP_EVENTS = [
  { id: 'hogsmeade', label: '霍格莫德', weeksBefore: 2, minYear: 3 },
  { id: 'yule_ball', label: '圣诞舞会', weeksBefore: 3, minYear: 4, targetWeek: 14 },
  { id: 'triwizard', label: '三强争霸赛', weeksBefore: 4, minYear: 4, requiresFlag: 'triwizardYear' },
  { id: 'owl', label: 'O.W.L. 考试', weeksBefore: 3, minYear: 5, targetWeek: 33 },
];

export function getPlaythroughHook(year) {
  const hooks = {
    1: { id: 'canon_y1', label: '魔法石之年', hint: '分院、魁地奇、万圣节巨怪、魔法石闯关' },
    2: { id: 'canon_y2', label: '密室之年', hint: '密室传说、决斗俱乐部、石化、里德尔日记' },
    3: { id: 'canon_y3', label: '阿兹卡班之年', hint: '摄魂怪、守护神、活点地图、小天狼星真相' },
    4: { id: 'canon_y4', label: '火焰杯之年', hint: '三强赛、圣诞舞会、迷宫、伏地魔复活' },
    5: { id: 'canon_y5', label: '凤凰社之年', hint: '乌姆里奇、D.A.、O.W.L.、神秘事务司' },
    6: { id: 'canon_y6', label: '混血王子之年', hint: '魂器线索、魔药笔记、天文塔' },
    7: { id: 'canon_y7', label: '死亡圣器之年', hint: '卡罗统治、霍格沃茨大战' },
  };
  return hooks[year] || { id: 'daily', label: '霍格沃茨日常', hint: '学业、恋爱与学院生活' };
}

export function createInitialProgression(profile) {
  const year = profile.year ?? 1;
  const hook = getPlaythroughHook(year);
  return {
    housePoints: 0,
    housePenalties: 0,
    achievements: profile.wand ? ['first_wand'] : [],
    memories: [],
    milestones: {},
    gossip: { level: 0, rumors: [] },
    clubs: profile.clubs ?? [],
    clubActivityCount: 0,
    eventPrep: { active: null, label: '', weeksUntil: 0, steps: [], completed: [] },
    exams: { active: false, type: year >= 5 ? 'owl' : null, stress: 0, reviewedSubjects: [], weekStarted: null },
    patronusCeremony: { eligible: year >= 3, progress: year >= 3 ? 10 : 0, revealed: false },
    playthroughHook: hook.id,
    wandNotes: buildWandAffinityNotes(profile.wand),
    familyTrack: createInitialFamilyTrack(profile.family),
  };
}

export function buildWandAffinityNotes(wand) {
  if (!wand) return '';
  const parts = [];
  if (wand.wood && WAND_AFFINITY_HINTS[wand.wood]) parts.push(WAND_AFFINITY_HINTS[wand.wood]);
  if (wand.core && WAND_AFFINITY_HINTS[wand.core]) parts.push(WAND_AFFINITY_HINTS[wand.core]);
  return parts.join('；') || wand.affinity || '';
}

export function migrateProgression(state) {
  if (state.progression?.housePoints !== undefined) {
    return normalizeProgression(state.progression, state.profile);
  }
  return createInitialProgression(state.profile || { year: 1 });
}

function normalizeProgression(prog, profile) {
  const base = createInitialProgression(profile || {});
  return {
    ...base,
    ...prog,
    gossip: { ...base.gossip, ...(prog.gossip || {}) },
    eventPrep: { ...base.eventPrep, ...(prog.eventPrep || {}) },
    exams: { ...base.exams, ...(prog.exams || {}) },
    patronusCeremony: { ...base.patronusCeremony, ...(prog.patronusCeremony || {}) },
    milestones: prog.milestones || {},
    achievements: prog.achievements || [],
    memories: (prog.memories || []).slice(0, 20),
    clubs: prog.clubs?.length ? prog.clubs : (profile?.clubs || []),
    wandNotes: prog.wandNotes || buildWandAffinityNotes(profile?.wand),
    familyTrack: migrateFamilyTrack({ profile, progression: prog }),
  };
}

export function mergeProgressionUpdate(current, update) {
  if (!update) return current;
  const next = structuredClone(current);

  if (typeof update.housePoints === 'number') {
    next.housePoints = Math.max(0, next.housePoints + Math.min(update.housePoints, 20));
  }
  if (typeof update.housePenalties === 'number') {
    next.housePenalties += Math.min(update.housePenalties, 10);
  }
  if (update.achievementsUnlocked) {
    next.achievements = [...new Set([...next.achievements, ...update.achievementsUnlocked])];
  }
  if (update.memoriesAdded) {
    for (const m of update.memoriesAdded) {
      next.memories.unshift({
        turn: m.turn ?? 0,
        week: m.week ?? 0,
        title: m.title || '回忆',
        text: (m.text || '').slice(0, 120),
        target: m.target || null,
      });
    }
    next.memories = next.memories.slice(0, 20);
  }
  if (update.gossip) {
    if (update.gossip.level !== undefined) next.gossip.level = Math.max(0, Math.min(3, update.gossip.level));
    if (update.gossip.rumors) {
      next.gossip.rumors = [...update.gossip.rumors, ...next.gossip.rumors].slice(0, 5);
    }
  }
  if (update.clubActivity) next.clubActivityCount += 1;
  if (update.eventPrep) Object.assign(next.eventPrep, update.eventPrep);
  if (update.exams) Object.assign(next.exams, update.exams);
  if (update.patronusCeremony) Object.assign(next.patronusCeremony, update.patronusCeremony);
  if (update.patronusProgress) {
    next.patronusCeremony.progress = Math.min(100, next.patronusCeremony.progress + update.patronusProgress);
  }
  if (update.familyTrack) {
    next.familyTrack = { ...next.familyTrack, ...update.familyTrack };
    if (update.familyTrack.recentEvents) {
      next.familyTrack.recentEvents = update.familyTrack.recentEvents.slice(0, 8);
    }
  }

  return next;
}

export function detectMilestones(oldRel, newRel) {
  const unlocked = [];
  for (const [name, rel] of Object.entries(newRel)) {
    const oldA = oldRel[name]?.affection ?? 0;
    const newA = rel.affection ?? 0;
    for (const ms of AFFECTION_MILESTONES) {
      if (oldA < ms.at && newA >= ms.at) {
        unlocked.push({ target: name, milestoneId: ms.id, title: ms.title, text: ms.template.replace('{name}', name) });
      }
    }
  }
  return unlocked;
}

export function applyMilestones(progression, milestones, turn = 0, week = 0) {
  if (!milestones.length) return progression;
  const next = structuredClone(progression);
  for (const m of milestones) {
    if (!next.milestones[m.target]) next.milestones[m.target] = [];
    if (!next.milestones[m.target].includes(m.milestoneId)) {
      next.milestones[m.target].push(m.milestoneId);
      next.memories.unshift({ turn, week, title: `【${m.title}】${m.target}`, text: m.text, target: m.target });
    }
  }
  next.memories = next.memories.slice(0, 20);
  return next;
}

export function refreshEventPrep(state) {
  const week = state.time?.week ?? 1;
  const year = state.profile?.year ?? 1;
  const prog = structuredClone(state.progression || createInitialProgression(state.profile));

  for (const ev of PREP_EVENTS) {
    if (ev.minYear && year < ev.minYear) continue;
    if (ev.requiresFlag && !state.flags?.[ev.requiresFlag]) continue;
    const targetWeek = ev.targetWeek ?? week + ev.weeksBefore;
    const weeksUntil = targetWeek - week;
    if (weeksUntil > 0 && weeksUntil <= ev.weeksBefore) {
      prog.eventPrep = {
        active: ev.id,
        label: ev.label,
        weeksUntil,
        steps: getPrepSteps(ev.id),
        completed: prog.eventPrep?.active === ev.id ? (prog.eventPrep.completed || []) : [],
      };
      return prog;
    }
  }
  return prog;
}

function getPrepSteps(eventId) {
  const map = {
    hogsmeade: ['确认周六空闲', '凑足零花钱', '约同伴同行'],
    yule_ball: ['物色舞伴', '准备礼服/礼袍', '练习一支舞'],
    triwizard: ['了解赛程', '支持/关注勇士', '准备观赛或报名'],
    owl: ['制定复习计划', '参加模拟考', '调整作息与心情'],
  };
  return map[eventId] || [];
}

export function refreshExamState(state) {
  const prog = structuredClone(state.progression || createInitialProgression(state.profile));
  const week = state.time?.week ?? 1;
  const year = state.profile?.year ?? 1;
  if (year === 5 && week >= 30 && week <= 34) {
    prog.exams = { ...prog.exams, active: true, type: 'owl', weekStarted: prog.exams.weekStarted ?? week };
  } else if (week > 34) {
    prog.exams = { ...prog.exams, active: false };
  }
  return prog;
}

export function computeGossipLevel(state) {
  let level = state.progression?.gossip?.level ?? 0;
  const rel = state.relationships || {};
  const highAff = Object.values(rel).filter((r) => r.affection >= 61).length;
  if (highAff >= 2) level = Math.max(level, 2);
  if (highAff >= 3) level = Math.max(level, 3);
  if (state.profile?.bloodStatus === '麻瓜出身' && rel['德拉科']?.affection >= 41) level = Math.max(level, 2);
  const family = state.profile?.family;
  if (family && isExtremePurebloodFamily(family) && rel['赫敏']?.affection >= 41) level = Math.max(level, 2);
  return Math.min(3, level);
}

export function autoUnlockAchievements(state) {
  const ids = [...(state.progression?.achievements || [])];
  const p = state.progression || {};
  if (p.housePoints > 0 && !ids.includes('first_points')) ids.push('first_points');
  if (p.housePenalties > 0 && !ids.includes('detention')) ids.push('detention');
  if (p.clubActivityCount >= 3 && !ids.includes('club_active')) ids.push('club_active');
  if (p.patronusCeremony?.revealed && !ids.includes('patronus')) ids.push('patronus');
  if (p.gossip?.level >= 3 && !ids.includes('gossip_peak')) ids.push('gossip_peak');
  if (state.flags?.ending && !ids.includes('he_any')) ids.push('he_any');
  if (state.magic?.owls?.status === 'completed' && !ids.includes('owl_done')) ids.push('owl_done');
  if (state.flags?.yuleBallPartner && !ids.includes('yule_invite')) ids.push('yule_invite');
  return ids;
}

export function processAfterTurn(state, stateBefore, narrative = '') {
  let progression = migrateProgression(state);
  const milestones = detectMilestones(stateBefore?.relationships || {}, state.relationships || {});
  progression = applyMilestones(progression, milestones, state.turnCount, state.time?.week);

  progression.gossip.level = computeGossipLevel({ ...state, progression });

  if (/霍格莫德/.test(narrative) && state.time?.weekday === '周六' && !progression.achievements.includes('hogsmeade')) {
    progression.achievements.push('hogsmeade');
  }
  if (/守护神|Expecto Patronum|银白/.test(narrative) && /成功|显现|成形|清晰/.test(narrative)) {
    progression.patronusCeremony.progress = 100;
    progression.patronusCeremony.revealed = true;
  } else if (/守护神|Patronum|博格特/.test(narrative)) {
    progression.patronusCeremony.progress = Math.min(100, progression.patronusCeremony.progress + 5);
  }
  if (/社团|D\.A\.|决斗俱乐部|魁地奇训练|斯拉格霍恩/.test(narrative)) {
    progression.clubActivityCount += 1;
  }

  const familyUpdate = processFamilyAfterTurn(state, narrative);
  if (familyUpdate) progression.familyTrack = familyUpdate;

  progression = refreshEventPrep({ ...state, progression });
  progression = refreshExamState({ ...state, progression });
  progression.achievements = autoUnlockAchievements({ ...state, progression });
  return progression;
}

export function getClubNames(clubIds) {
  return clubIds.map((id) => CLUB_OPTIONS.find((c) => c.id === id)?.name || id).filter(Boolean);
}

export function getGossipLabel(level) {
  return ['安静', '有点议论', '议论纷纷', '全校话题'][level] || '安静';
}
