export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const url = new URL(request.url);
    let targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      const league = url.searchParams.get("league");
      const dates = url.searchParams.get("dates");
      if (league && dates) {
        targetUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dates}`;
      }
    }
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing ?url=" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    try {
      const t = new URL(targetUrl);
      if (t.hostname !== "site.api.espn.com") {
        return new Response(JSON.stringify({ error: "Host not allowed" }), { status: 403, headers: corsHeaders });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400, headers: corsHeaders });
    }
    const cached = await fetch(targetUrl, {
      headers: { "User-Agent": "StreamX/1.0", "Accept": "application/json" },
      cf: { cacheTtl: 30, cacheEverything: true }
    });
    const response = new Response(cached.body, cached);
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    response.headers.set("Cache-Control", "public, max-age=30");
    response.headers.set("Content-Type", "application/json");
    return response;
  }
}
