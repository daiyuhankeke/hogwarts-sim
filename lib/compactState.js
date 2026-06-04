/** 发给 AI 的精简状态，降低 token 与截断风险 */

function compactProfile(profile = {}) {
  const family = profile.family;
  return {
    name: profile.name,
    house: profile.house,
    year: profile.year,
    bloodStatus: profile.bloodStatus,
    appearance: profile.appearance,
    talents: profile.talents,
    target: profile.target,
    tone: profile.tone,
    saveCedric: profile.saveCedric,
    clubs: profile.clubs,
    family: family
      ? {
          summary: family.summary,
          familyLabel: family.familyLabel,
          familyMuggleAttitude: family.familyMuggleAttitude,
          playerMuggleAttitudeLabel: family.playerMuggleAttitudeLabel,
          estrangedFromFamily: family.estrangedFromFamily,
          canonConnections: family.canonConnections,
        }
      : undefined,
    wand: profile.wand
      ? { wood: profile.wand.wood, core: profile.wand.core, length: profile.wand.length }
      : undefined,
  };
}

function compactRelationships(relationships = {}, currentTarget) {
  const out = {};
  for (const [name, rel] of Object.entries(relationships)) {
    if ((rel?.affection ?? 0) > 0 || name === currentTarget) {
      out[name] = rel;
    }
  }
  return out;
}

export function compactStateForAI(state) {
  if (!state) return null;

  const lastHist = state.history?.[state.history.length - 1];
  const lastNarrative = state.lastNarrative || lastHist?.narrative || '';

  return {
    profile: compactProfile(state.profile),
    time: state.time,
    scene: state.scene,
    player: state.player,
    currentTarget: state.currentTarget,
    relationships: compactRelationships(state.relationships, state.currentTarget),
    npcYears: state.npcYears,
    flags: state.flags,
    summary: state.summary,
    turnCount: state.turnCount,
    magic: state.magic,
    progression: state.progression
      ? {
          housePoints: state.progression.housePoints,
          gossip: state.progression.gossip,
          clubs: state.progression.clubs,
          eventPrep: state.progression.eventPrep,
          exams: state.progression.exams,
          patronusCeremony: state.progression.patronusCeremony,
          achievements: state.progression.achievements,
        }
      : undefined,
    timetable: state.timetable,
    career: state.career,
    lastNarrative: lastNarrative.slice(0, 2000),
  };
}
