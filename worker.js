export default {
  async fetch(request, env) {
    const headers = cors();
    if (request.method === 'OPTIONS') return new Response('ok', { headers });
    const url = new URL(request.url);
    if (url.pathname !== '/api/advice') return json({ ok:false, error:'not found', path:url.pathname }, 404, headers);
    let body={};
    if(request.method==='POST') body=await request.json().catch(()=>({}));
    const races = body.races || [];
    const advice = makeAdvice(races);
    return json({ ok:true, source:'worker-advice', advice }, 200, headers);
  }
}
function cors(){return {'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'};}
function json(data,status=200,headers=cors()){return new Response(JSON.stringify(data,null,2),{status,headers});}
function makeAdvice(races){
  if(!races.length) return ['保存レースが不足しています。30件以上からAI提案対象にしてください。'];
  const s = races.filter(r=>r.prediction?.type==='S型').length;
  return [`分析対象 ${races.length}件`, `S型 ${s}件`, '5系接続2本以上かつ軸3〜7人気の条件を優先確認してください。', '見送り判定で金額0円のレースは回収率対象から外してください。'];
}
