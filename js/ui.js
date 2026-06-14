import { getSpellById, getMasteryLabel, MAGIC_SUBJECTS, OWL_EXAM_SUBJECTS, OWL_GRADE_NAMES } from './magic-system.js';
import { formatWandSummary } from './wand-system.js';
import { ACHIEVEMENTS, getClubNames, getGossipLabel, getPlaythroughHook } from './progression.js';
import { getCanonicalPlotContext } from './canonical-storyline.js';
import { WEEKDAYS, PERIOD_LABELS, getTodayClasses, getTodayEveningClasses, SUBJECT_CATALOG } from './timetable.js';
import { formatTimeInStatus, getDayPhase, migrateTime, parseClock } from './time-system.js';
import { getActiveScheduleContext } from './schedule-context.js';
import { getAttitudeClass, getToneLabel, migrateFamilyTrack, getSuggestedFamilyBeats } from './family-interactions.js';

const HOUSE_COLORS = {
  '格兰芬多': { primary: '#740001', accent: '#d3a625' },
  '斯莱特林': { primary: '#1a472a', accent: '#aaaaaa' },
  '拉文克劳': { primary: '#0e1a40', accent: '#946b2d' },
  '赫奇帕奇': { primary: '#372672', accent: '#ecb939' },
};

export function applyHouseTheme(house) {
  const colors = HOUSE_COLORS[house] || HOUSE_COLORS['格兰芬多'];
  document.documentElement.style.setProperty('--house-primary', colors.primary);
  document.documentElement.style.setProperty('--house-accent', colors.accent);
}

function stripLegacyStatusFields(line) {
  return line
    .replace(/\s*\|\s*心情[：:][^|]*/g, '')
    .replace(/\s*\|\s*当前男主[：:][^|]*/g, '')
    .replace(/\s*\|\s*关系[：:][^|]*/g, '')
    .replace(/\s*\|\s*好感[：:][^|]*/g, '')
    .replace(/\s*\|\s*(?=\|)/g, '')
    .trim();
}

function buildStatusLine(state) {
  const time = migrateTime(state);
  const magicRank = state.magic?.rank || '—';
  const timeLabel = formatTimeInStatus(state);
  return (
    `第${time.week}周 ${time.weekday} ${timeLabel} | 霍格沃茨 | ${state.scene.weather} | ` +
    `场景：${state.scene.location} | 魔法：${magicRank}`
  );
}

export function renderStatusBar(state, statusLine) {
  const el = document.getElementById('status-bar');
  if (!el) return;
  el.textContent = statusLine ? stripLegacyStatusFields(statusLine) : buildStatusLine(state);
}

export function renderNarrative(text) {
  const el = document.getElementById('narrative');
  if (!el) return;
  el.innerHTML = formatNarrative(text);
  el.scrollTop = 0;
}

function formatNarrative(text) {
  if (!text) return '<p class="placeholder">等待故事开始……</p>';
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function renderOptions(options, onSelect, disabled = false) {
  const container = document.getElementById('options');
  if (!container) return;
  container.innerHTML = '';

  if (!options || options.length === 0) {
    container.innerHTML = '<p class="hint">暂无选项</p>';
    return;
  }

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.disabled = disabled;
    btn.innerHTML = `<span class="opt-id">${escapeHtml(opt.id)}</span><span class="opt-text">${escapeHtml(opt.text)}</span>`;
    btn.addEventListener('click', () => onSelect(opt));
    container.appendChild(btn);
  }
}

export function renderRelationships(state) {
  const el = document.getElementById('relationships-panel');
  if (!el) return;

  const items = Object.entries(state.relationships)
    .filter(([, r]) => r.affection > 0)
    .sort((a, b) => b[1].affection - a[1].affection);

  if (items.length === 0) {
    el.innerHTML = '<p class="hint">尚未与同学建立熟识关系</p>';
    return;
  }

  el.innerHTML = items
    .map(
      ([name, r]) =>
        `<div class="rel-item"><span>${escapeHtml(name)}</span>` +
        `<span class="rel-bar"><span style="width:${r.affection}%"></span></span>` +
        `<span class="rel-num" title="熟识度">熟识 ${r.affection}</span></div>`
    )
    .join('');
}

export function renderEventHints(events) {
  const el = document.getElementById('event-hints');
  if (!el) return;
  el.textContent = events?.length ? `近期：${events.join('、')}` : '';
}

export function renderMagicPanel(state) {
  const el = document.getElementById('magic-panel');
  if (!el || !state?.magic) return;

  const { magic } = state;

  const rankEl = `<div class="magic-rank"><span class="magic-rank-label">${escapeHtml(magic.rank || '魔法学徒')}</span>` +
    `<span class="magic-rank-sub">${magic.spells?.length ?? 0} 个咒语 · ${(magic.spells || []).filter((s) => s.mastery >= 80).length} 个精通</span></div>`;

  const subjectsHtml = MAGIC_SUBJECTS.map((sub) => {
    const val = magic.subjects?.[sub.id] ?? 0;
    return `<div class="magic-subject"><span class="magic-subject-name">${escapeHtml(sub.name)}</span>` +
      `<span class="magic-bar"><span style="width:${val}%"></span></span>` +
      `<span class="magic-subject-num">${val}</span></div>`;
  }).join('');

  const sortedSpells = [...(magic.spells || [])].sort((a, b) => b.mastery - a.mastery);
  const spellsHtml = sortedSpells.length
    ? sortedSpells.map((s) => {
        const info = getSpellById(s.id);
        if (!info) return '';
        const label = getMasteryLabel(s.mastery);
        const tierClass = info.tier === '禁忌' ? ' spell-forbidden' : info.tier === '高阶' ? ' spell-advanced' : '';
        return `<div class="spell-item${tierClass}" title="${escapeHtml(info.desc)}">` +
          `<div class="spell-head"><span class="spell-name">${escapeHtml(info.name)}</span>` +
          `<span class="spell-tier">${escapeHtml(info.tier)}</span></div>` +
          `<div class="spell-incantation">${escapeHtml(info.incantation)}</div>` +
          `<div class="spell-mastery"><span class="magic-bar"><span style="width:${s.mastery}%"></span></span>` +
          `<span class="spell-mastery-label">${label}</span></div></div>`;
      }).join('')
    : '<p class="hint">尚未掌握咒语</p>';

  const knowledge = magic.knowledge || [];
  const knowledgeHtml = knowledge.length
    ? knowledge.map((k) => {
        const info = getSpellById(k.id);
        if (!info) return '';
        return `<div class="knowledge-item"><span>${escapeHtml(info.name)}</span>` +
          `<span class="spell-mastery-label">${getMasteryLabel(k.mastery)}</span></div>`;
      }).join('')
    : '';

  const notableHtml = magic.notable?.length
    ? `<div class="magic-notable">${magic.notable.map((n) => `<span class="magic-tag">${escapeHtml(n)}</span>`).join('')}</div>`
    : '';

  const wand = state.profile?.wand;
  const wandHtml = wand
    ? `<details class="magic-details" open><summary>魔杖</summary>
        <div class="wand-card wand-card-text">
          <div class="wand-info">
            <div class="wand-title">${escapeHtml(formatWandSummary(wand))}</div>
            <div class="wand-flex">${escapeHtml(wand.flexibility)}</div>
            <p class="wand-appearance">${escapeHtml(wand.appearance || '')}</p>
            ${wand.affinity ? `<p class="wand-affinity">${escapeHtml(wand.affinity)}</p>` : ''}
          </div>
        </div></details>`
    : '';

  const patronus = magic.patronus;
  const patronusHtml = patronus
    ? `<details class="magic-details"${patronus.form ? ' open' : ''}><summary>守护神</summary>
        <div class="patronus-block">
          ${patronus.form
            ? `<span class="patronus-form">${escapeHtml(patronus.form)}</span>`
            : `<span class="hint">${escapeHtml(patronus.note || '尚未显现')}</span>`}
        </div></details>`
    : '';

  const owls = magic.owls;
  let owlsHtml = '';
  if (owls?.status === 'preparing') {
    owlsHtml = `<details class="magic-details"><summary>O.W.L. 考试</summary><p class="hint">五年级期末 · 备考中</p></details>`;
  } else if (owls?.status === 'completed' && owls.results) {
    const rows = OWL_EXAM_SUBJECTS.map((sub) => {
      const g = owls.results[sub.id] || '—';
      const gradeClass = `owl-${g}`;
      return `<div class="owl-row"><span>${escapeHtml(sub.name)}</span><span class="owl-grade ${gradeClass}" title="${escapeHtml(OWL_GRADE_NAMES[g] || '')}">${g}</span></div>`;
    }).join('');
    const accidentNote = owls.accidents > 0 ? `<p class="hint owl-accident">考试时有 ${owls.accidents} 科发挥失常</p>` : '';
    owlsHtml = `<details class="magic-details"><summary>O.W.L. 成绩</summary>${rows}${accidentNote}</details>`;
  }

  el.innerHTML = rankEl + notableHtml + wandHtml + patronusHtml + owlsHtml +
    `<details class="magic-details" open><summary>学科能力</summary>${subjectsHtml}</details>` +
    `<details class="magic-details" open><summary>已掌握咒语</summary><div class="spell-list">${spellsHtml}</div></details>` +
    (knowledgeHtml ? `<details class="magic-details"><summary>魔药与学识</summary>${knowledgeHtml}</details>` : '');
}

export function setLoading(loading) {
  const overlay = document.getElementById('loading');
  const options = document.getElementById('options');
  if (overlay) overlay.hidden = !loading;
  if (options) {
    options.querySelectorAll('button').forEach((b) => {
      b.disabled = loading;
    });
  }
  const submitBtn = document.getElementById('custom-submit');
  if (submitBtn) submitBtn.disabled = loading;
}

export function showError(message) {
  const el = document.getElementById('error-banner');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function hideError() {
  const el = document.getElementById('error-banner');
  if (el) el.hidden = true;
}

export function showMagicGains(gains) {
  const el = document.getElementById('magic-gain-toast');
  if (!el || !gains?.length) return;

  el.innerHTML = gains
    .map(
      (g) =>
        `<span class="magic-gain-chip">✦ ${escapeHtml(g.subjectName)} +${g.delta}` +
        `<small>${escapeHtml(g.reason)}</small></span>`
    )
    .join('');
  el.hidden = false;
  el.classList.remove('fade-out');
  clearTimeout(showMagicGains._timer);
  showMagicGains._timer = setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => {
      el.hidden = true;
    }, 400);
  }, 4500);
}

export function renderProgressPanel(state) {
  const el = document.getElementById('progress-panel');
  if (!el || !state?.progression) return;

  const p = state.progression;
  const house = state.profile?.house ?? '';
  const hook = getPlaythroughHook(state.profile?.year ?? 1);
  const gossip = getGossipLabel(p.gossip?.level ?? 0);
  const canon = getCanonicalPlotContext(state);

  let canonHtml = '';
  if (canon.dueBeat) {
    canonHtml = `<div class="canon-banner canon-due">📖 主线 · ${escapeHtml(canon.dueBeat.label)}</div>` +
      `<p class="canon-summary">${escapeHtml(canon.dueBeat.summary.slice(0, 80))}${canon.dueBeat.summary.length > 80 ? '…' : ''}</p>`;
  } else if (canon.nextMandatory) {
    canonHtml = `<div class="canon-banner">📖 ${escapeHtml(canon.title)}</div>` +
      `<p class="hint canon-next">下一节点（第${canon.nextMandatory.week ?? '?'}周）：${escapeHtml(canon.nextMandatory.label)}</p>`;
  } else {
    canonHtml = `<div class="canon-banner">📖 ${escapeHtml(canon.title)}</div>`;
  }
  if (canon.upcomingBeats?.length) {
    canonHtml += `<p class="hint canon-upcoming">近期主线：${canon.upcomingBeats.map((b) => `W${b.week} ${escapeHtml(b.label)}`).join(' · ')}</p>`;
  }

  let prepHtml = '';
  if (p.eventPrep?.active) {
    const steps = (p.eventPrep.steps || [])
      .map((s) => {
        const done = (p.eventPrep.completed || []).includes(s);
        return `<li class="${done ? 'done' : ''}">${escapeHtml(s)}</li>`;
      })
      .join('');
    prepHtml = `<details class="magic-details" open><summary>准备 · ${escapeHtml(p.eventPrep.label)}（${p.eventPrep.weeksUntil} 周后）</summary><ul class="prep-list">${steps}</ul></details>`;
  }

  let examHtml = '';
  if (p.exams?.active) {
    examHtml = `<div class="exam-banner">📜 O.W.L. 考试周 · 压力 ${p.exams.stress ?? 0}/100</div>`;
  }

  let patronusHtml = '';
  if (p.patronusCeremony?.eligible && !p.patronusCeremony.revealed) {
    patronusHtml = `<div class="patronus-progress">守护神修习 ${p.patronusCeremony.progress}%</div>`;
  }

  const clubs = getClubNames(p.clubs || []);
  const achUnlocked = new Set(p.achievements || []);
  const achHtml = ACHIEVEMENTS.filter((a) => achUnlocked.has(a.id))
    .map((a) => `<span class="magic-tag" title="${escapeHtml(a.desc)}">${escapeHtml(a.name)}</span>`)
    .join('') || '<span class="hint">暂无</span>';

  const memHtml = (p.memories || []).slice(0, 5)
    .map((m) => `<div class="memory-item"><strong>${escapeHtml(m.title)}</strong><span>${escapeHtml(m.text)}</span></div>`)
    .join('') || '<p class="hint">尚未留下回忆</p>';

  const rumors = (p.gossip?.rumors || []).slice(0, 2).map((r) => `<p class="gossip-rumor">${escapeHtml(r)}</p>`).join('');

  el.innerHTML =
    canonHtml +
    `<div class="prog-hook">${escapeHtml(hook.label)} · ${escapeHtml(hook.hint)}</div>` +
    `<div class="house-points">${escapeHtml(house)} +${p.housePoints}` +
    (p.housePenalties ? ` · 警告 ${p.housePenalties}` : '') +
    ` · 流言：${escapeHtml(gossip)}</div>` +
    examHtml + patronusHtml + prepHtml +
    (clubs.length
      ? `<p class="prog-clubs">社团：${escapeHtml(clubs.join('、'))}</p>`
      : `<p class="prog-clubs hint">社团：尚未加入（可在剧情中报名）</p>`) +
    (p.wandNotes ? `<p class="wand-affinity-hint" title="魔杖相性">🪄 ${escapeHtml(p.wandNotes.slice(0, 60))}${p.wandNotes.length > 60 ? '…' : ''}</p>` : '') +
    rumors +
    `<details class="magic-details"><summary>回忆 (${(p.memories || []).length})</summary>${memHtml}</details>` +
    `<details class="magic-details"><summary>成就 (${achUnlocked.size})</summary><div class="magic-notable">${achHtml}</div></details>`;
}

export function renderFamilyPanel(state) {
  const el = document.getElementById('family-panel');
  if (!el) return;

  const family = state.profile?.family;
  if (!family) {
    el.innerHTML = '<p class="hint">暂无家庭背景</p>';
    return;
  }

  const track = migrateFamilyTrack(state);
  const beats = getSuggestedFamilyBeats(state);

  const familyTitle = family.familyLabel
    ? `${family.familyLabel}${family.sacred28 ? ' · 神圣二十八' : ''}`
    : (family.bloodStatus === '麻瓜出身' ? '麻瓜家庭' : '巫师家庭');

  const attitudeHtml = family.familyMuggleAttitude && family.familyMuggleAttitude !== '不适用（麻瓜家庭）'
    ? `<span class="family-badge ${getAttitudeClass(family.familyMuggleAttitude)}">家族 ${escapeHtml(family.familyMuggleAttitude)}</span>`
    : '';
  const playerAttHtml = (family.playerMuggleAttitudeDisplay || family.playerMuggleAttitudeLabel)
    ? `<span class="family-badge family-badge-player">个人 ${escapeHtml(family.playerMuggleAttitudeDisplay || family.playerMuggleAttitudeLabel)}</span>`
    : '';

  const estrangedHtml = family.estrangedFromFamily
    ? `<div class="family-estranged-banner">⚠ 已被${escapeHtml(family.familyLabel || '家族')}除名</div>`
    : '';

  const parentHtml = ['father', 'mother'].map((role) => {
    const p = family[role];
    if (!p) return '';
    const expelled = p.expelledFromFamily ? ' · 已除名' : '';
    return `<div class="family-parent">
      <span class="family-parent-role">${role === 'father' ? '父' : '母'}</span>
      <div class="family-parent-body">
        <strong>${escapeHtml(p.name)}</strong>
        <span class="hint">${escapeHtml(p.bloodStatus || '')}${expelled} · ${escapeHtml(p.occupation)} · ${escapeHtml(p.personality)}</span>
      </div>
    </div>`;
  }).join('');

  const connHtml = (family.canonConnections || []).length
    ? `<ul class="family-conn-list">${family.canonConnections.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`
    : '<p class="hint">无特殊原著关联</p>';

  const npcHtml = (track.npcTies || []).length
    ? track.npcTies.map((t) =>
        `<div class="family-npc-tie family-tone-${t.tone}" title="${escapeHtml(t.hint || '')}">` +
        `<span class="family-npc-name">${escapeHtml(t.npc)}</span>` +
        `<span class="family-npc-rel">${escapeHtml(t.relation)}</span>` +
        `<span class="family-npc-tone">${escapeHtml(getToneLabel(t.tone))}</span></div>`
      ).join('')
    : '<p class="hint">暂无关联 NPC</p>';

  const beatHtml = beats.length
    ? beats.map((b) =>
        `<li class="family-beat family-beat-${b.priority}">${escapeHtml(b.label)}` +
        (b.hint ? `<span class="hint"> — ${escapeHtml(b.hint)}</span>` : '') +
        `</li>`
      ).join('')
    : '<li class="hint">暂无待触发</li>';

  el.innerHTML =
    `<div class="family-header">
      <span class="family-name">${escapeHtml(familyTitle)}</span>
      <span class="family-blood">${escapeHtml(family.bloodStatus)}</span>
    </div>` +
    `<div class="family-badges">${attitudeHtml}${playerAttHtml}</div>` +
    estrangedHtml +
    (family.household ? `<p class="hint family-household">🏠 ${escapeHtml(family.household)}</p>` : '') +
    `<details class="magic-details" open><summary>父母</summary>${parentHtml || '<p class="hint">未设定</p>'}</details>` +
    `<details class="magic-details"><summary>原著关联</summary>${connHtml}</details>` +
    `<details class="magic-details" open><summary>家族 NPC（${(track.npcTies || []).length}）</summary><div class="family-npc-list">${npcHtml}</div></details>` +
    `<details class="magic-details"><summary>待触发互动</summary><ul class="family-beat-list">${beatHtml}</ul></details>`;
}

export function renderTimetablePanel(state) {
  const el = document.getElementById('timetable-panel');
  if (!el || !state?.timetable) return;

  const tt = state.timetable;
  const time = migrateTime(state);
  const today = time.weekday ?? '周一';
  const todayClasses = getTodayClasses(state);
  const evening = getTodayEveningClasses(state);
  const scheduleCtx = getActiveScheduleContext(state);
  const currentClass = scheduleCtx.currentClass;

  let todayHtml = '';
  if (today === '周六' || today === '周日') {
    todayHtml = `<p class="hint">${today} · ${escapeHtml(time.clock)} · ${escapeHtml(getDayPhase(time.clock))}${today === '周六' && state.profile?.year >= 3 ? '（三年级以上可去霍格莫德）' : ''}</p>`;
  } else if (todayClasses.length) {
    todayHtml = todayClasses.map((c) => {
      const isNow =
        currentClass?.period === c.period &&
        c.subjectId !== 'free' &&
        c.subjectId !== 'study';
      return `<div class="tt-today-row${isNow ? ' tt-now' : c.subjectId === 'free' || c.subjectId === 'study' ? ' tt-muted' : ''}">` +
        `<span class="tt-time">${escapeHtml(c.time)}</span>` +
        `<span class="tt-subject">${escapeHtml(c.name)}${isNow ? ' ◀' : ''}</span>` +
        `<span class="tt-teacher">${escapeHtml(c.teacher)}</span></div>`;
    }).join('');
    if (evening.length) {
      todayHtml += evening.map((c) => {
        const isNow = /天文/.test(c.name) && parseClock(time.clock) >= parseClock('23:00');
        return `<div class="tt-today-row tt-evening${isNow ? ' tt-now' : ''}"><span class="tt-time">${escapeHtml(c.time)}</span>` +
          `<span class="tt-subject">${escapeHtml(c.name)}${isNow ? ' ◀' : ''}</span>` +
          `<span class="tt-teacher">${escapeHtml(c.teacher)}</span></div>`;
      }).join('');
    }
  }

  const schoolDays = WEEKDAYS.slice(0, 5);
  const periods = ['am1', 'am2', 'pm1', 'pm2'];

  const gridHead = `<div class="tt-grid"><div class="tt-corner"></div>` +
    schoolDays.map((d) =>
      `<div class="tt-day-head${d === today ? ' tt-today-col' : ''}">${escapeHtml(d.replace('周', ''))}</div>`
    ).join('');

  const gridRows = periods.map((period) => {
    const time = PERIOD_LABELS[period];
    const cells = schoolDays.map((day) => {
      const cls = (tt.schedule[day] || []).find((c) => c.period === period);
      if (!cls) return `<div class="tt-cell"></div>`;
      const short = cls.name.length > 4 ? cls.name.slice(0, 4) : cls.name;
      const title = `${cls.name} · ${cls.teacher} · ${cls.room}`;
      return `<div class="tt-cell${day === today ? ' tt-today-col' : ''}" title="${escapeHtml(title)}">${escapeHtml(short)}</div>`;
    }).join('');
    return `<div class="tt-period-label">${escapeHtml(time)}</div>${cells}`;
  }).join('');

  const electiveNote = tt.electives?.length
    ? `<p class="hint tt-note">选修：${tt.electives.map((id) => escapeHtml(SUBJECT_CATALOG[id]?.name || id)).join('、')}${tt.notes ? ` · ${escapeHtml(tt.notes)}` : ''}</p>`
    : tt.notes ? `<p class="hint tt-note">${escapeHtml(tt.notes)}</p>` : '';

  el.innerHTML =
    `<details class="magic-details" open><summary>今日 · ${escapeHtml(today)} · ${escapeHtml(time.clock)}</summary>` +
    `<div class="tt-today">${todayHtml || '<p class="hint">无课</p>'}</div></details>` +
    `<details class="magic-details"><summary>本周课表</summary>` +
    gridHead + gridRows + `</div>${electiveNote}</details>`;
}

export function showMilestoneToast(milestones) {
  const el = document.getElementById('magic-gain-toast');
  if (!el || !milestones?.length) return;
  el.innerHTML = milestones
    .map((m) => `<span class="magic-gain-chip milestone-chip">💫 ${escapeHtml(m.target)} · ${escapeHtml(m.title)}</span>`)
    .join('');
  el.hidden = false;
  el.classList.remove('fade-out');
  clearTimeout(showMilestoneToast._timer);
  showMilestoneToast._timer = setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => { el.hidden = true; }, 400);
  }, 5000);
}

export function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => {
    s.hidden = s.id !== screenId;
  });
}

export function renderSaveScreen(slots) {
  const el = document.getElementById('save-slot-list');
  if (!el) return;

  el.innerHTML = slots.map((info, i) => {
    if (info) {
      return (
        `<article class="save-slot-card">` +
        `<div class="save-slot-head">存档槽 ${i + 1}</div>` +
        `<div class="save-slot-name">${escapeHtml(info.name)}</div>` +
        `<div class="save-slot-meta">${escapeHtml(info.house)} · ${info.year}年级 · 第${info.week}周 · ${info.turn} 回合</div>` +
        `<div class="save-slot-btns">` +
        `<button type="button" class="btn btn-primary btn-small save-continue-btn" data-slot="${i}">继续游戏</button>` +
        `<button type="button" class="btn btn-secondary btn-small save-new-btn" data-slot="${i}">新游戏（覆盖）</button>` +
        `</div></article>`
      );
    }
    return (
      `<article class="save-slot-card save-slot-empty">` +
      `<div class="save-slot-head">存档槽 ${i + 1}</div>` +
      `<p class="hint">空槽位</p>` +
      `<div class="save-slot-btns">` +
      `<button type="button" class="btn btn-primary btn-small save-new-btn" data-slot="${i}">创建新角色</button>` +
      `</div></article>`
    );
  }).join('');
}

export function populateSaveSlots(slots) {
  const select = document.getElementById('save-slot-select');
  if (!select) return;
  select.innerHTML = '';
  for (let i = 0; i < slots.length; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    const info = slots[i];
    opt.textContent = info ? `槽${i + 1}：${info.name}（第${info.week}周）` : `槽${i + 1}：空`;
    select.appendChild(opt);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
