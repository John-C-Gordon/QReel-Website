export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/r/')) {
      const code = url.pathname.slice(3);
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/qr_codes?short_code=eq.${encodeURIComponent(code)}&select=redirect_url&limit=1`,
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
      return Response.redirect(rows[0].redirect_url, 302);
    }

    return env.ASSETS.fetch(request);
  }
};
