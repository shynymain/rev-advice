const headers={"content-type":"application/json;charset=utf-8","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"};
export default{async fetch(req){if(req.method==="OPTIONS")return new Response("{}",{headers});return new Response(JSON.stringify({ok:true,message:"フロント側ロジックで予想します。"}),{headers})}};
