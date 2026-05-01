const headers = {"content-type":"application/json;charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"};
export default { async fetch(request) {
  if(request.method === "OPTIONS") return new Response(JSON.stringify({ok:true}), {headers});
  const url = new URL(request.url);
  if(url.pathname === "/api/health") return new Response(JSON.stringify({ok:true,service:"advice"}), {headers});
  if(url.pathname === "/api/advice") return new Response(JSON.stringify({ok:true,advice:"現行ルール維持。S型・5系接続・中位人気軸を優先。"}), {headers});
  return new Response(JSON.stringify({ok:false,error:"not found"}), {status:404,headers});
}};
