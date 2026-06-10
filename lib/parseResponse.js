/** 修复 JSON 字符串内未转义的真实换行 */
function repairUnescapedNewlines(text) {
  let inString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (escaped) {
      result += c;
      escaped = false;
      continue;
    }
    if (c === '\\') {
      escaped = true;
      result += c;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      result += c;
      continue;
    }
    if (inString && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      result += '\\n';
      continue;
    }
    result += c;
  }

  return result;
}

function tryParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function extractJson(text) {
  if (!text || !String(text).trim()) return null;

  const trimmed = String(text).trim();

  let parsed = tryParse(trimmed);
  if (parsed) return parsed;

  const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blockMatch) {
    parsed = tryParse(blockMatch[1].trim());
    if (parsed) return parsed;
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const slice = trimmed.slice(start, end + 1);
    parsed = tryParse(slice);
    if (parsed) return parsed;

    parsed = tryParse(repairUnescapedNewlines(slice));
    if (parsed) return parsed;
  }

  parsed = tryParse(repairUnescapedNewlines(trimmed));
  return parsed;
}

export function validateResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'AI 未返回有效 JSON' };
  }
  if (!parsed.narrative || typeof parsed.narrative !== 'string') {
    return { valid: false, error: '缺少 narrative 字段' };
  }
  if (!Array.isArray(parsed.options) || parsed.options.length < 4) {
    return { valid: false, error: 'options 必须包含至少 4 个选项' };
  }
  return { valid: true };
}

export function buildJsonRetryHint(error) {
  return (
    `【上次回复格式错误：${error}】请重新输出完整 JSON 对象。` +
    '要求：只输出 JSON，不要 markdown 代码块；narrative 控制在 400 字以内；' +
    'narrative 内换行必须用 \\n 转义；必须含 narrative 与 options（至少 4 项，含 A-F）。'
  );
}

function extractNarrativeFromBrokenJson(text) {
  if (!text) return null;
  const idx = text.indexOf('"narrative"');
  if (idx === -1) return null;

  const quoteStart = text.indexOf('"', text.indexOf(':', idx) + 1);
  if (quoteStart === -1) return null;

  let i = quoteStart + 1;
  let raw = '';
  while (i < text.length) {
    const c = text[i];
    if (c === '\\' && i + 1 < text.length) {
      raw += c + text[i + 1];
      i += 2;
      continue;
    }
    if (c === '"') break;
    raw += c;
    i++;
  }

  if (raw.length < 20) return null;

  try {
    return JSON.parse(`"${raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  } catch {
    return raw
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

const FALLBACK_OPTIONS = [
  { id: 'A', text: '继续当前场景中的行动' },
  { id: 'B', text: '和在场的人交谈' },
  { id: 'C', text: '观察周围环境' },
  { id: 'D', text: '推进下一时段' },
  { id: 'E', text: '去上课或自习' },
  { id: 'F', text: '自定义行动（请直接描述）' },
];

/** 截断/损坏 JSON：有 narrative 时补全 options，避免整轮失败 */
export function salvageChatResponse(raw) {
  const parsed = extractJson(raw);
  if (parsed?.narrative && typeof parsed.narrative === 'string') {
    if (!Array.isArray(parsed.options) || parsed.options.length < 4) {
      parsed.options = FALLBACK_OPTIONS;
    }
    return parsed;
  }

  const narrative = extractNarrativeFromBrokenJson(String(raw));
  if (!narrative) return null;

  return { narrative, options: FALLBACK_OPTIONS, stateUpdate: {} };
}
