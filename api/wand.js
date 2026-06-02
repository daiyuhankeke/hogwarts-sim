import { generateWandWithAI, generateFallbackWand } from '../lib/generateWand.js';
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
    const { profile, inviteCode, withImage = false, useFallback = false } = body;

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
        wand = await generateWandWithAI(profile, { withImage: !!withImage });
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
