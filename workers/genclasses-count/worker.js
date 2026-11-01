import { DurableObject } from "cloudflare:workers";

const ALLOWED = new Set([
  "https://genclasses.com",
  "https://www.genclasses.com",
  "http://127.0.0.1:8787",
  "http://localhost:8787",
]);

function corsHeaders(origin) {
  const o = ALLOWED.has(origin) ? origin : "https://genclasses.com";
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function istDayKey(ms = Date.now()) {
  // Asia/Kolkata = UTC+5:30
  const d = new Date(ms + 5.5 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class VisitCounter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        k TEXT PRIMARY KEY,
        v TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        seen INTEGER NOT NULL
      );
    `);
  }

  getMeta(key, fallback = "0") {
    const row = this.ctx.storage.sql
      .exec("SELECT v FROM meta WHERE k = ?", key)
      .toArray()[0];
    return row ? row.v : fallback;
  }

  setMeta(key, value) {
    this.ctx.storage.sql.exec(
      "INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v",
      key,
      String(value)
    );
  }

  pruneOnline(now) {
    const cutoff = now - 5 * 60 * 1000;
    this.ctx.storage.sql.exec("DELETE FROM sessions WHERE seen < ?", cutoff);
  }

  onlineCount(now) {
    this.pruneOnline(now);
    const row = this.ctx.storage.sql
      .exec("SELECT COUNT(*) AS c FROM sessions")
      .toArray()[0];
    return Number(row?.c || 0);
  }

  touchSession(sid, now) {
    if (!sid || typeof sid !== "string" || sid.length > 64) return;
    if (!/^[a-zA-Z0-9_-]+$/.test(sid)) return;
    this.ctx.storage.sql.exec(
      "INSERT INTO sessions (sid, seen) VALUES (?, ?) ON CONFLICT(sid) DO UPDATE SET seen = excluded.seen",
      sid,
      now
    );
  }

  stats(now) {
    const day = istDayKey(now);
    let today = Number(this.getMeta("day:" + day, "0"));
    const storedDay = this.getMeta("current_day", "");
    if (storedDay !== day) {
      // New IST day — today's count starts at 0 until first unique hits
      today = Number(this.getMeta("day:" + day, "0"));
      this.setMeta("current_day", day);
    }
    return {
      online: this.onlineCount(now),
      today,
      total: Number(this.getMeta("total", "0")),
      day,
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();
    const path = url.pathname;

    if (request.method === "GET" && (path === "/stats" || path.endsWith("/stats"))) {
      return Response.json(this.stats(now));
    }

    if (request.method === "POST" && (path === "/hit" || path.endsWith("/hit"))) {
      let body = {};
      try {
        body = await request.json();
      } catch (_) {
        body = {};
      }
      const sid = typeof body.sid === "string" ? body.sid.slice(0, 64) : "";
      const unique = !!body.unique;
      const day = istDayKey(now);

      if (sid) this.touchSession(sid, now);

      if (unique) {
        const total = Number(this.getMeta("total", "0")) + 1;
        const today = Number(this.getMeta("day:" + day, "0")) + 1;
        this.setMeta("total", total);
        this.setMeta("day:" + day, today);
        this.setMeta("current_day", day);
      }

      return Response.json(this.stats(now));
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "") {
      return Response.json(
        { ok: true, service: "genclasses-count", endpoints: ["/hit", "/stats"] },
        { headers }
      );
    }

    const id = env.COUNTER.idFromName("site");
    const stub = env.COUNTER.get(id);
    const res = await stub.fetch(request);
    const outHeaders = new Headers(res.headers);
    for (const [k, v] of Object.entries(headers)) outHeaders.set(k, v);
    outHeaders.set("Cache-Control", "no-store");
    return new Response(res.body, { status: res.status, headers: outHeaders });
  },
};
