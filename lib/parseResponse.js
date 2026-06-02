export function extractJson(text) {
  if (!text) return null;

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // try markdown code block
    const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (blockMatch) {
      try {
        return JSON.parse(blockMatch[1].trim());
      } catch {
        /* continue */
      }
    }

    // try first { to last }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
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
