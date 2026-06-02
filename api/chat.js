import { buildSystemPrompt } from '../lib/loadPrompts.js';
import { callAI, buildMessages } from '../lib/callAI.js';
import { extractJson, validateResponse } from '../lib/parseResponse.js';
import { checkRateLimit, verifyInviteCode } from '../lib/rateLimit.js';

function sendJson(res, status, data) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(data);
  }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: '仅支持 POST' });
  }

  try {
    const body = getBody(req);
    const { state, action, history, eventContext, inviteCode } = body;

    if (!action) {
      return sendJson(res, 400, { error: '缺少 action' });
    }

    if (!verifyInviteCode(inviteCode)) {
      return sendJson(res, 403, { error: '邀请码无效' });
    }

    const clientId = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'local';
    const dailyLimit = Number(process.env.DAILY_LIMIT || 0);
    const rate = checkRateLimit(String(clientId), dailyLimit);
    if (!rate.ok) {
      return sendJson(res, 429, { error: '今日请求次数已达上限，请明天再试' });
    }

    const systemPrompt = buildSystemPrompt(state, eventContext);
    const messages = buildMessages(systemPrompt, history, action);

    let raw;
    try {
      raw = await callAI(messages);
    } catch (aiErr) {
      if (aiErr.message?.includes('response_format')) {
        raw = await callAIWithoutJsonMode(messages);
      } else {
        throw aiErr;
      }
    }

    const parsed = extractJson(raw);
    const validation = validateResponse(parsed);

    if (!validation.valid) {
      return sendJson(res, 502, { error: validation.error, raw });
    }

    return sendJson(res, 200, parsed);
  } catch (err) {
    console.error('chat error:', err);
    return sendJson(res, 500, { error: err.message || '服务器错误' });
  }
}

async function callAIWithoutJsonMode(messages) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'deepseek-chat';
  const maxTokens = Number(process.env.AI_MAX_TOKENS || 2000);

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.85 }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'AI API 错误');
  return data.choices?.[0]?.message?.content || '';
}
