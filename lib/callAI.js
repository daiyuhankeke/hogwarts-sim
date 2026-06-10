const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_CHAT_MAX_TOKENS = 1536;

export function getAIConfig({ forChat = false } = {}) {
  const model = forChat
    ? (process.env.AI_CHAT_MODEL || process.env.AI_MODEL || 'deepseek-chat')
    : (process.env.AI_MODEL || 'deepseek-chat');
  const maxTokens = forChat
    ? Number(process.env.AI_CHAT_MAX_TOKENS || DEFAULT_CHAT_MAX_TOKENS)
    : Number(process.env.AI_MAX_TOKENS || DEFAULT_MAX_TOKENS);

  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: (process.env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
    model,
    maxTokens,
  };
}

function parseThinkingMode(value, fallback = 'disabled') {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  if (v === 'enabled' || v === 'true' || v === '1') return 'enabled';
  if (v === 'disabled' || v === 'false' || v === '0') return 'disabled';
  return fallback;
}

function applyModelParams(body, { model, forChat }) {
  if (!/deepseek-v4/i.test(model)) return body;

  const thinking = parseThinkingMode(
    forChat ? (process.env.AI_CHAT_THINKING ?? process.env.AI_THINKING) : process.env.AI_THINKING,
    'disabled',
  );
  body.thinking = { type: thinking === 'enabled' ? 'enabled' : 'disabled' };
  if (thinking === 'enabled') {
    const effort = (process.env.AI_CHAT_REASONING_EFFORT || process.env.AI_REASONING_EFFORT || 'high').toLowerCase();
    if (effort === 'max' || effort === 'high') body.reasoning_effort = effort;
  }
  return body;
}

export async function callAI(
  messages,
  { temperature = 0.85, jsonMode = true, maxTokens, forChat = false } = {},
) {
  const { apiKey, baseUrl, model, maxTokens: configMax } = getAIConfig({ forChat });
  if (!apiKey) {
    throw new Error('未配置 AI_API_KEY 环境变量');
  }

  const body = applyModelParams(
    {
      model,
      messages,
      max_tokens: maxTokens ?? configMax,
      temperature,
    },
    { model, forChat },
  );

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error?.message || data.message || res.statusText;
    throw new Error(`AI API 错误: ${msg}`);
  }

  const message = data.choices?.[0]?.message;
  const content = message?.content;
  if (!content?.trim()) {
    throw new Error('AI 返回空内容（若使用 V4，请确认 .env 中 AI_CHAT_THINKING=disabled）');
  }
  return content;
}

export function buildMessages(systemPrompt, history, action, { summary } = {}) {
  const messages = [{ role: 'system', content: systemPrompt }];

  if (summary) {
    messages.push({
      role: 'system',
      content: `【长期剧情摘要】\n${summary}`,
    });
  }

  if (Array.isArray(history)) {
    const recent = history.slice(-2);
    for (let i = 0; i < recent.length; i++) {
      const h = recent[i];
      const isLatest = i === recent.length - 1;
      if (h.action) {
        messages.push({ role: 'user', content: h.action });
      }
      if (h.narrative) {
        const narrative = isLatest ? h.narrative : h.narrative.slice(0, 800);
        messages.push({
          role: 'assistant',
          content: JSON.stringify({ narrative }),
        });
      }
    }
  }

  messages.push({ role: 'user', content: action });
  return messages;
}
