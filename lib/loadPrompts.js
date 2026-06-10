import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

let cachedPrompts = null;
let cachedMtime = 0;

function getPromptsMtime() {
  const files = ['system-core.md', 'characters.md', 'magic-lore.md', 'world-lore.md', 'progression-lore.md', 'timetable-lore.md', 'storyline-lore.md'];
  return Math.max(
    ...files.map((f) => {
      try {
        return fs.statSync(path.join(PROMPTS_DIR, f)).mtimeMs;
      } catch {
        return 0;
      }
    })
  );
}

export function loadPrompts(stateOrIncludeWorld = true) {
  const state = typeof stateOrIncludeWorld === 'object' && stateOrIncludeWorld !== null ? stateOrIncludeWorld : null;
  const includeWorld = state
    ? state.flags?.triwizardYear !== false
    : stateOrIncludeWorld !== false;

  const cacheKey = includeWorld ? '1' : '0';
  const mtime = getPromptsMtime();
  if (cachedPrompts && cachedPrompts.key === cacheKey && mtime <= cachedMtime) {
    return cachedPrompts.text;
  }

  const read = (f) => fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf-8');
  const parts = [
    read('system-core.md'),
    includeWorld ? read('world-lore.md') : '',
    read('magic-lore.md'),
    read('progression-lore.md'),
    read('timetable-lore.md'),
    read('storyline-lore.md'),
    read('characters.md'),
  ].filter(Boolean);

  const combined = parts.join('\n\n---\n\n');
  cachedPrompts = { key: cacheKey, text: combined };
  cachedMtime = mtime;
  return combined;
}

export function buildSystemPrompt(state, eventContext) {
  const base = loadPrompts(state);
  const ctx = [];

  if (state) {
    ctx.push(`\n\n## 当前游戏状态（精简）\n\`\`\`json\n${JSON.stringify(state)}\n\`\`\``);
  }

  if (eventContext) {
    ctx.push(`\n\n## 事件上下文\n\`\`\`json\n${JSON.stringify(eventContext)}\n\`\`\``);
    if (eventContext.hogsmeadeAvailable === false) {
      ctx.push('\n注意：今天不是周六或年级不足，霍格莫德不可前往。若玩家选了 C 选项，请在 narrative 中说明并给出替代剧情。');
    }
  }

  return base + ctx.join('');
}
