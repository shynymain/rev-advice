export default {
  async fetch(request, env) {
    const headers = {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    };

    if (request.method === "OPTIONS") {
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    if (request.method === "GET") {
      return new Response(JSON.stringify({
        ok: true,
        service: "rev-advice",
        message: "rev-advice worker running",
        usage: "POST JSON to this URL"
      }), { headers });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({
        ok: false,
        error: "GET, POST, OPTIONS only"
      }), { headers, status: 405 });
    }

    try {
      const body = await request.json();
      const race = body.race || {};
      const horses = Array.isArray(race.horses) ? race.horses : [];

      const normalized = horses.map(h => ({
        no: String(h.no || h.number || ""),
        frame: String(h.frame || ""),
        name: String(h.name || ""),
        last1: String(h.last1 || ""),
        last2: String(h.last2 || ""),
        last3: String(h.last3 || ""),
        odds: String(h.odds || ""),
        popularity: String(h.popularity || h.pop || "")
      }));

      const fiveLine = normalized.filter(h =>
        ["5", "14", "15"].includes(h.no) || h.frame === "5"
      );

      const axis =
        fiveLine[0] ||
        normalized.find(h => h.popularity === "1") ||
        normalized[0] ||
        { no: "?", name: "未定" };

      const opponents = normalized
        .filter(h => h.no && h.no !== axis.no)
        .slice(0, 5);

      const quinella = opponents
        .slice(0, 3)
        .map(h => [axis.no, h.no].sort((a, b) => Number(a) - Number(b)).join("-"));

      const trio = opponents
        .slice(0, 4)
        .map((h, i, arr) => {
          const second = arr[i + 1];
          if (!second) return null;
          return [axis.no, h.no, second.no]
            .sort((a, b) => Number(a) - Number(b))
            .join("-");
        })
        .filter(Boolean)
        .slice(0, 5);

      const confidence =
        fiveLine.length >= 2 ? "高" :
        fiveLine.length === 1 ? "中" :
        "低";

      const label = fiveLine.length >= 1 ? "買い" : "見送り寄り";

      return new Response(JSON.stringify({
        ok: true,
        prediction: {
          type: fiveLine.length >= 1 ? "buy" : "skip",
          label,
          confidence,
          axis,
          bets: {
            quinella,
            trio
          },
          reason: fiveLine.length >= 1
            ? `5系接続あり：${fiveLine.map(h => `${h.no}${h.name ? " " + h.name : ""}`).join(" / ")}`
            : "5系接続が弱いため見送り寄り"
        }
      }), { headers });

    } catch (e) {
      return new Response(JSON.stringify({
        ok: false,
        error: String(e)
      }), { headers, status: 500 });
    }
  }
};
