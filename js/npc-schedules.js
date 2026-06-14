/** NPC 日程 — 供 eventContext 与 DM 参考，提高「蹲点」遇见概率 */

import { HARRY_RETURNS_WEEK } from './calendar-config.js';

export const NPC_SCHEDULES = [
  { name: '哈利', slots: { '周一': '魔药课/魁地奇', '周三': '魁地奇训练', '周六': '霍格莫德（三年级+）', '晚上': '公共休息室' }, locations: ['魁地奇球场', '格兰芬多', '大礼堂'] },
  { name: '赫敏', slots: { '每天': '图书馆', '周一': '算术占卜', '晚上': '自习' }, locations: ['图书馆', '大礼堂', '教室'] },
  { name: '罗恩', slots: { '周三': '魁地奇', '周六': '霍格莫德', '晚上': '公共休息室' }, locations: ['魁地奇球场', '格兰芬多', '大礼堂'] },
  { name: '德拉科', slots: { '下午': '斯莱特林公共休息室', '周六': '霍格莫德' }, locations: ['斯莱特林', '大礼堂', '魔药'] },
  { name: '纳威', slots: { '下午': '温室', '晚上': '自习' }, locations: ['温室', '图书馆', '格兰芬多'] },
  { name: '金妮', slots: { '周三': '魁地奇', '下午': '训练' }, locations: ['魁地奇球场', '格兰芬多'] },
  { name: '卢娜', slots: { '中午': '黑湖边', '下午': '神奇生物' }, locations: ['黑湖', '场地', '拉文克劳'] },
  { name: '弗雷德', slots: { '周三': '魁地奇' }, locations: ['魁地奇球场', '格兰芬多'] },
  { name: '乔治', slots: { '周三': '魁地奇' }, locations: ['魁地奇球场', '格兰芬多'] },
  { name: '塞德里克', slots: { '周三': '魁地奇/训练' }, locations: ['魁地奇球场', '赫奇帕奇', '大礼堂'] },
  { name: '奥利弗·伍德', slots: { '每天': '魁地奇训练' }, locations: ['魁地奇球场'] },
  { name: '斯内普', slots: { '白天': '魔药课/办公室' }, locations: ['魔药', '地牢'] },
  { name: '卢平', slots: { '三年级+': '黑魔法防御课' }, locations: ['黑魔法防御', '办公室'] },
];

export function getNpcScheduleContext(state) {
  const weekday = state.time?.weekday ?? '周一';
  const location = state.scene?.location ?? '';
  const playerYear = state.profile?.year ?? 1;
  const week = state.time?.week ?? 1;
  const goldenTrioAbsent = playerYear === 7 && week < HARRY_RETURNS_WEEK;
  const absentNames = goldenTrioAbsent ? new Set(['哈利', '罗恩', '赫敏']) : null;

  const likelyHere = [];
  const todaySchedule = [];

  for (const npc of NPC_SCHEDULES) {
    if (absentNames?.has(npc.name)) continue;

    const npcYear = state.npcYears?.[npc.name];
    if (npcYear === '尚未入学') continue;

    const dayInfo = npc.slots[weekday] || npc.slots['每天'] || Object.values(npc.slots)[0];
    if (dayInfo) todaySchedule.push({ name: npc.name, activity: dayInfo });

    if (npc.locations.some((loc) => location.includes(loc) || loc.includes(location))) {
      likelyHere.push(npc.name);
    }
  }

  return {
    weekday,
    location,
    likelyNpcsHere: likelyHere,
    todayNpcSchedule: todaySchedule.slice(0, 8),
    absentFromHogwarts: goldenTrioAbsent ? ['哈利', '罗恩', '赫敏'] : [],
    hint: goldenTrioAbsent
      ? `七年级（第${HARRY_RETURNS_WEEK}周前）：哈利、罗恩、赫敏不在霍格沃茨；可找纳威、金妮、卢娜等同场。`
      : likelyHere.length
        ? `当前场景「${location}」较可能遇到：${likelyHere.join('、')}`
        : '换地点可提高遇见概率（图书馆→赫敏，魁地奇球场→伍德/哈利）',
  };
}
