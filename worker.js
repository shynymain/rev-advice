export default {
  async fetch(request) {
    return new Response(JSON.stringify({
      ok: true,
      advice: "正常動作"
    }), {
      headers: { "content-type": "application/json" }
    });
  }
};
