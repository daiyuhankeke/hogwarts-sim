/** 霍格沃茨学年长度（原 34 周压缩为 17 周，比例 1:2） */

export const WEEKS_PER_YEAR = 17;
export const LEGACY_WEEKS_PER_YEAR = 34;

/** 七年级哈利返校周（原第 28 周） */
export const HARRY_RETURNS_WEEK = 14;

/** O.W.L. 考试周段起始（原第 30 周） */
export const OWL_EXAM_START_WEEK = 15;

/** 将旧版 34 周制周次映射为 17 周制 */
export function scaleWeek(legacyWeek) {
  if (legacyWeek == null || Number.isNaN(Number(legacyWeek))) return 1;
  const w = Number(legacyWeek);
  return Math.max(1, Math.min(WEEKS_PER_YEAR, Math.round(w * WEEKS_PER_YEAR / LEGACY_WEEKS_PER_YEAR)));
}

/** 读档：已是 17 周制则不动，34 周制旧存档则缩放 */
export function migrateGameWeek(week) {
  if (week == null || week < 1) return 1;
  if (week <= WEEKS_PER_YEAR) return week;
  if (week <= LEGACY_WEEKS_PER_YEAR) return scaleWeek(week);
  return week;
}

export function isYearEndWeek(week) {
  return week >= WEEKS_PER_YEAR;
}

export function isPastSchoolYear(week) {
  return week > WEEKS_PER_YEAR;
}
