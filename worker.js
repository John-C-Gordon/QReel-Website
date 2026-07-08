const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QR Code Not Found · QReel</title>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #073b4c;
      font-family: 'Nunito', sans-serif;
      color: #fff;
      padding: 32px 24px;
      text-align: center;
      gap: 0;
    }
    .wordmark {
      font-family: 'Fredoka', sans-serif;
      font-size: 38px;
      color: #fff;
      margin-bottom: 48px;
      letter-spacing: -0.5px;
    }
    .icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 24px;
    }
    h1 {
      font-family: 'Fredoka', sans-serif;
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    p {
      font-size: 15px;
      line-height: 1.65;
      color: rgba(255,255,255,0.65);
      max-width: 300px;
      margin: 0 auto 36px;
    }
    a {
      display: inline-block;
      background: #06d6a0;
      color: #073b4c;
      font-family: 'Nunito', sans-serif;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 14px;
      transition: opacity 0.15s;
    }
    a:hover { opacity: 0.88; }
  </style>
</head>
<body>
  <div class="wordmark">QReel</div>
  <div class="icon">🔗</div>
  <h1>This QR code is no longer active</h1>
  <p>The creator removed or deactivated this code. Make your own custom QR codes with QReel.</p>
  <a href="https://qreel.app">Create a free QR code</a>
</body>
</html>`;

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
        return new Response(NOT_FOUND_HTML, {
          status: 404,
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
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
