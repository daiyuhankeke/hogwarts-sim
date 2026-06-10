import { buildSystemPrompt } from '../lib/loadPrompts.js';
import { callAI, buildMessages } from '../lib/callAI.js';
import { compactStateForAI } from '../lib/compactState.js';
import { extractJson, validateResponse, buildJsonRetryHint, salvageChatResponse } from '../lib/parseResponse.js';
import { sanitizeStateUpdate } from '../lib/validateStateUpdate.js';
import { checkRateLimit, verifyInviteCode } from '../lib/rateLimit.js';
import { checkCanonicalViolations, buildCanonicalRetryHint } from '../lib/canonicalGuard.js';
import { sendJson, getBody, setCorsHeaders, handleOptions } from '../lib/http.js';

const MAX_JSON_ATTEMPTS = 2;

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: '仅支持 POST' });
  }

  try {
    const body = getBody(req);
    const { state, action, history, eventContext, inviteCode, isRetry = false } = body;

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

    const compactState = compactStateForAI(state);
    const systemPrompt = buildSystemPrompt(compactState, eventContext);
    let messages = buildMessages(systemPrompt, history, action, { summary: compactState?.summary });

    let parsed = await requestAI(messages, { isRetry });

    let canon = checkCanonicalViolations(parsed?.narrative);
    if (!canon.ok) {
      messages = [
        ...messages,
        { role: 'assistant', content: JSON.stringify({ narrative: parsed.narrative?.slice(0, 200) }) },
        { role: 'user', content: buildCanonicalRetryHint(canon) },
      ];
      parsed = await requestAI(messages, { isRetry: true });
      canon = checkCanonicalViolations(parsed?.narrative);
      if (!canon.ok) {
        console.warn('canonical guard still failing:', canon.id, canon.reason);
      }
    }

    if (parsed.stateUpdate) {
      parsed = { ...parsed, stateUpdate: sanitizeStateUpdate(parsed.stateUpdate) };
    }

    return sendJson(res, 200, parsed);
  } catch (err) {
    console.error('chat error:', err);
    if (err.status === 502) {
      const rawPreview = typeof err.raw === 'string' ? err.raw.slice(0, 500) : err.raw;
      console.error('chat raw preview:', rawPreview);
      return sendJson(res, 502, { error: err.message, raw: rawPreview });
    }
    return sendJson(res, 500, { error: err.message || '服务器错误' });
  }
}

async function requestAI(messages, { isRetry = false } = {}) {
  const temperature = isRetry ? 0.6 : 0.85;
  let lastRaw = '';
  let lastError = 'AI 未返回有效 JSON';

  for (let attempt = 0; attempt < MAX_JSON_ATTEMPTS; attempt++) {
    let raw;
    try {
      raw = await callAI(messages, { temperature, jsonMode: true, forChat: true });
    } catch (aiErr) {
      if (aiErr.message?.includes('response_format')) {
        raw = await callAI(messages, { temperature, jsonMode: false, forChat: true });
      } else {
        throw aiErr;
      }
    }

    lastRaw = raw;

    const salvaged = salvageChatResponse(raw);
    if (salvaged) {
      const validation = validateResponse(salvaged);
      if (validation.valid) {
        if (!extractJson(raw)) console.warn('chat: salvaged partial JSON');
        return salvaged;
      }
    }

    const parsed = extractJson(raw);
    const validation = validateResponse(parsed);

    if (validation.valid) return parsed;

    lastError = validation.error;
    console.warn(`JSON parse attempt ${attempt + 1} failed:`, validation.error);

    if (attempt < MAX_JSON_ATTEMPTS - 1) {
      messages = [
        ...messages,
        { role: 'assistant', content: String(raw).slice(0, 400) },
        { role: 'user', content: buildJsonRetryHint(validation.error) },
      ];
    }
  }

  const err = new Error(lastError);
  err.status = 502;
  err.raw = lastRaw;
  throw err;
}
