const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return json({ ok: true });
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/api/health") {
      return json({ ok: true, service: "rev-advice", message: "rev-advice worker ok" });
    }

    if (url.pathname === "/api/advice") {
      let body = {};
      try { if (request.method === "POST") body = await request.json(); } catch (_) {}
      return json({
        ok: true,
        service: "rev-advice",
        message: "フロント側ロジックで予想します。",
        advice: {
          summary: "AI Bindingなしでも落ちない安全版です。",
          suggestions: [],
          received: body
        }
      });
    }

    return json({ ok: false, error: "not_found", path: url.pathname }, 404);
  }
};
