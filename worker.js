export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/r/')) {
      const code = url.pathname.slice(3);

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/qr_codes?short_code=eq.${encodeURIComponent(code)}&select=id,redirect_url&limit=1`,
        {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );

      const rows = await res.json();
      if (!rows.length || !rows[0].redirect_url) {
        return new Response("Not found", { status: 404 });
      }

      const { id: qrCodeId, redirect_url } = rows[0];

      ctx.waitUntil(
        fetch(`${env.SUPABASE_URL}/rest/v1/scan_events`, {
          method: "POST",
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            qr_code_id: qrCodeId,
            country: request.cf?.country ?? null,
            city:    request.cf?.city    ?? null,
            device:  request.headers.get("user-agent") ?? null,
            source:  request.headers.get("referer")    ?? null
          })
        })
      );

      return Response.redirect(redirect_url, 302);
    }

    return env.ASSETS.fetch(request);
  }
};
