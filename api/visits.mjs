const KEY = "visits:count";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

export default async function handler(req, res) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return json(res, 200, { ok: false, reason: "not-configured" });
  }

  try {
    if (req.method === "POST") {
      const data = await upstash(["INCR", KEY]);
      if (data.error) throw new Error(data.error);
      return json(res, 200, { ok: true, count: Number(data.result) || 0 });
    }

    const data = await upstash(["GET", KEY]);
    if (data.error) throw new Error(data.error);
    return json(res, 200, { ok: true, count: Number(data.result) || 0 });
  } catch {
    return json(res, 200, { ok: false, reason: "network" });
  }
}

async function upstash(command) {
  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(6000)
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return res.json();
}

function json(res, status, payload) {
  res.status(status);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
