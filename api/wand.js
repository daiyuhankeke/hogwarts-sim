import { generateWandWithAI, generateFallbackWand } from '../lib/generateWand.js';
import { checkRateLimit, verifyInviteCode } from '../lib/rateLimit.js';
import { sendJson, getBody, setCorsHeaders, handleOptions } from '../lib/http.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: '仅支持 POST' });
  }

  try {
    const body = getBody(req);
    const { profile, inviteCode, useFallback = false } = body;

    if (!profile?.name) {
      return sendJson(res, 400, { error: '缺少角色信息' });
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

    let wand;
    if (useFallback) {
      wand = generateFallbackWand(profile);
    } else {
      try {
        wand = await generateWandWithAI(profile);
      } catch {
        wand = generateFallbackWand(profile);
      }
    }

    return sendJson(res, 200, { wand });
  } catch (err) {
    console.error('wand error:', err);
    return sendJson(res, 500, { error: err.message || '魔杖生成失败' });
  }
}
