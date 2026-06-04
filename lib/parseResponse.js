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
    '要求：只输出 JSON，不要 markdown 代码块；narrative 内换行必须用 \\n 转义，不要用真实换行；' +
    '必须含 narrative（字符串）与 options（至少 4 项，含 A-F）。'
  );
}
