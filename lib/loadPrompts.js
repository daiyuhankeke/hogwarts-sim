import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

let cachedPrompts = null;
let cachedMtime = 0;

function getPromptsMtime() {
  const files = ['system-core.md', 'characters.md', 'magic-lore.md', 'world-lore.md'];
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

export function loadPrompts(includeWorldLore = true) {
  const mtime = getPromptsMtime();
  if (cachedPrompts && includeWorldLore && mtime <= cachedMtime) return cachedPrompts;

  const core = fs.readFileSync(path.join(PROMPTS_DIR, 'system-core.md'), 'utf-8');
  const characters = fs.readFileSync(path.join(PROMPTS_DIR, 'characters.md'), 'utf-8');
  const magic = fs.readFileSync(path.join(PROMPTS_DIR, 'magic-lore.md'), 'utf-8');

  let world = '';
  if (includeWorldLore) {
    world = fs.readFileSync(path.join(PROMPTS_DIR, 'world-lore.md'), 'utf-8');
  }

  const combined = [core, world, magic, characters].filter(Boolean).join('\n\n---\n\n');

  if (includeWorldLore) {
    cachedPrompts = combined;
    cachedMtime = mtime;
  }
  return combined;
}

export function buildSystemPrompt(state, eventContext) {
  const base = loadPrompts(state?.flags?.triwizardYear !== false);
  const ctx = [];

  if (state) {
    ctx.push(`\n\n## 当前游戏状态\n\`\`\`json\n${JSON.stringify(state, null, 2)}\n\`\`\``);
  }

  if (eventContext) {
    ctx.push(`\n\n## 事件上下文\n\`\`\`json\n${JSON.stringify(eventContext, null, 2)}\n\`\`\``);
    if (eventContext.hogsmeadeAvailable === false) {
      ctx.push('\n注意：今天不是周六或年级不足，霍格莫德不可前往。若玩家选了 C 选项，请在 narrative 中说明并给出替代剧情。');
    }
  }

  return base + ctx.join('');
}
