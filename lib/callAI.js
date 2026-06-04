const DEFAULT_MAX_TOKENS = 4096;

export function getAIConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    baseUrl: (process.env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
    model: process.env.AI_MODEL || 'deepseek-chat',
    maxTokens: Number(process.env.AI_MAX_TOKENS || DEFAULT_MAX_TOKENS),
  };
}

export async function callAI(messages, { temperature = 0.85, jsonMode = true, maxTokens } = {}) {
  const { apiKey, baseUrl, model } = getAIConfig();
  if (!apiKey) {
    throw new Error('未配置 AI_API_KEY 环境变量');
  }

  const body = {
    model,
    messages,
    max_tokens: maxTokens ?? Number(process.env.AI_MAX_TOKENS || DEFAULT_MAX_TOKENS),
    temperature,
  };
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

  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error('AI 返回空内容');
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
