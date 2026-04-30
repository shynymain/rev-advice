export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return cors({ok:true});
    if (url.pathname === "/" || url.pathname === "") return cors({ ok:true, service:"Rev AI Advice Worker v3", endpoint:"/api/advice", binding:"AI required only here" });
    if (url.pathname !== "/api/advice") return cors({ ok:false, error:"not found" }, 404);
    if (request.method !== "POST") return cors({ ok:false, error:"POST only" }, 405);
    if (!env.AI) return cors({ ok:false, error:"Workers AI Binding 'AI' がありません" }, 500);
    const body = await request.json().catch(()=>({}));
    const deterministic = localAdvice(body);
    const prompt = buildPrompt(body, deterministic);
    let aiText = "";
    try {
      const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { messages:[{role:"system",content:"あなたは競馬予想ロジック検証AI。必ずJSONのみ返す。"},{role:"user",content:prompt}], temperature:0.1, max_tokens:1200 });
      aiText = typeof out === "string" ? out : (out.response || out.result || JSON.stringify(out));
    } catch(e) {
      return cors({ ok:true, warning:"AI呼び出し失敗。ルールベース提案を返します。", error:String(e), suggestion:deterministic });
    }
    const parsed = extractJson(aiText) || { summary: aiText };
    const suggestion = normalize(parsed, deterministic);
    return cors({ ok:true, suggestion, ruleBased:deterministic, raw:parsed });
  }
};
function buildPrompt(body, det){return `質問:${body.question||"買い目を見直して"}\n\n現在予想:${JSON.stringify(body.currentPrediction||{})}\n\nレース:${JSON.stringify(body.race||{}).slice(0,9000)}\n\n重要ルール:\n- ◎は軸ではなくライン発生源。軸は5系、隣、人気帯、直近内容から選ぶ。\n- 5系=5,14,15,5枠を重視。5系に収束したレースだけ強く買う。\n- S型=◎2頭以上、5系接続2本以上、12頭以上、人気が割れている。\n- 馬連は原則3点、3連複は原則5点以内。\n- 見送りでも候補買い目は提示可能。\n\nルールベース暫定:${JSON.stringify(det)}\n\n返答JSON形式:{"recommendation":"変更推奨/現状維持/見送り推奨","buy":true,"suggestedRule":"S型 5系収束","reason":"短く","suggestedAxis":["5"],"suggestedUmaren":["5-14"],"suggestedSanrenpuku":["5-8-14"],"confidence":70}`;}
function localAdvice(body){const r=body.race||{}; const p=body.currentPrediction||{}; const horses=(p.horses||r.horses||[]); const five=horses.filter(h=>[5,14,15].includes(Number(h.no))||String(h.no).endsWith('5')); const marked=horses.filter(h=>h.mark); const connected=horses.filter(h=>h.mark&&([5,14,15].includes(Number(h.no))||[4,6,13,15,14,16].includes(Number(h.no)))); const axis=(five.find(h=>h.mark)||connected[0]||marked[0]||horses[0]||{}).no||"5"; const partners=horses.filter(h=>String(h.no)!==String(axis)).slice(0,4).map(h=>String(h.no)); return {recommendation:connected.length>=2?"変更検討":"現状維持", buy:connected.length>=2 || p.buy===true, suggestedRule:connected.length>=2?"S型 5系収束":"通常型/確認", reason:`5系候補${five.map(h=>h.no).join(',')}、印${marked.length}頭、5系接続${connected.length}本`, suggestedAxis:[String(axis)], suggestedUmaren:partners.slice(0,3).map(x=>pair(axis,x)), suggestedSanrenpuku:[[partners[0],partners[1]],[partners[0],partners[2]],[partners[1],partners[2]],[partners[0],partners[3]],[partners[2],partners[3]]].filter(a=>a[0]&&a[1]).map(a=>trio(axis,a[0],a[1])), confidence:connected.length>=2?76:58};}
function normalize(x, det){return {recommendation:x.recommendation||det.recommendation, buy:x.buy!==false, suggestedRule:x.suggestedRule||x.type||det.suggestedRule, reason:x.reason||x.summary||det.reason, suggestedAxis:(x.suggestedAxis||x.axis||det.suggestedAxis||[]).map(String), suggestedUmaren:(x.suggestedUmaren||x.umaren||det.suggestedUmaren||[]).map(String).slice(0,5), suggestedSanrenpuku:(x.suggestedSanrenpuku||x.sanrenpuku||det.suggestedSanrenpuku||[]).map(String).slice(0,6), confidence:Number(x.confidence||det.confidence||60)};}
function extractJson(t){try{return JSON.parse(t)}catch(e){} const m=String(t).match(/\{[\s\S]*\}/); if(m){try{return JSON.parse(m[0])}catch(e){}} return null;}
function pair(a,b){return [Number(a),Number(b)].sort((x,y)=>x-y).join('-')}
function trio(a,b,c){return [Number(a),Number(b),Number(c)].sort((x,y)=>x-y).join('-')}
function cors(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"}})}
