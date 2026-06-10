/** 轻量校验 AI 返回的 stateUpdate，避免明显脏数据写入存档 */

const VALID_WEEKDAYS = new Set(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
const VALID_SEASONS = new Set(['春', '夏', '秋', '冬']);

export function validateStateUpdate(update) {
  if (!update || typeof update !== 'object') return { valid: true, warnings: [] };

  const warnings = [];

  if (update.time) {
    if (update.time.week !== undefined && (typeof update.time.week !== 'number' || update.time.week < 1)) {
      warnings.push('time.week 无效');
    }
    if (update.time.weekday && !VALID_WEEKDAYS.has(update.time.weekday)) {
      warnings.push(`time.weekday 无效: ${update.time.weekday}`);
    }
    if (update.time.season && !VALID_SEASONS.has(update.time.season)) {
      warnings.push(`time.season 无效: ${update.time.season}`);
    }
  }

  if (update.relationships) {
    for (const [name, rel] of Object.entries(update.relationships)) {
      if (rel?.affection !== undefined) {
        const aff = rel.affection;
        if (typeof aff !== 'number' || aff < 0 || aff > 100) {
          warnings.push(`relationships.${name}.affection 应在 0-100`);
        }
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}

export function sanitizeStateUpdate(update) {
  if (!update || typeof update !== 'object') return update;

  const next = structuredClone(update);

  if (next.relationships) {
    for (const rel of Object.values(next.relationships)) {
      if (rel?.affection !== undefined) {
        rel.affection = Math.max(0, Math.min(100, Number(rel.affection) || 0));
      }
    }
  }

  return next;
}
