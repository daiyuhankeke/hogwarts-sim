const requestCounts = new Map();

/** 内存计数，进程重启清零；多实例部署时各实例独立计数 */

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function checkRateLimit(clientId, dailyLimit) {
  if (!dailyLimit || dailyLimit <= 0) return { ok: true };

  const key = `${clientId}:${todayKey()}`;
  const count = requestCounts.get(key) || 0;

  if (count >= dailyLimit) {
    return { ok: false, remaining: 0 };
  }

  requestCounts.set(key, count + 1);
  return { ok: true, remaining: dailyLimit - count - 1 };
}

export function verifyInviteCode(code) {
  const expected = process.env.INVITE_CODE;
  if (!expected) return true;
  return code === expected;
}
