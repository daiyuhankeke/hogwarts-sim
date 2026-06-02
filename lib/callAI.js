export async function callAI(messages) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('未配置 AI_API_KEY 环境变量');
  }

  const baseUrl = (process.env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'deepseek-chat';
  const maxTokens = Number(process.env.AI_MAX_TOKENS || 2000);

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.85,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error?.message || data.message || res.statusText;
    throw new Error(`AI API 错误: ${msg}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回空内容');
  return content;
}

export function buildMessages(systemPrompt, history, action) {
  const messages = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(history)) {
    for (const h of history.slice(-3)) {
      if (h.action) {
        messages.push({ role: 'user', content: h.action });
      }
      if (h.narrative) {
        messages.push({ role: 'assistant', content: JSON.stringify({ narrative: h.narrative }) });
      }
    }
  }

  messages.push({ role: 'user', content: action });
  return messages;
}
