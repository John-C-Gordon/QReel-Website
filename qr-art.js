/* ============================================================
   QReel — styled faux-QR renderer
   Draws a believable, on-brand QR code onto a <canvas>:
   proper three finder "eyes", rounded/dot/square modules,
   gradient fills, a quiet zone, and an optional center logo.
   Deterministic per `seed` so codes stay stable across renders.
   This is decorative artwork (not a scannable code) for the
   marketing site — it mirrors the app's real styling feature.
   ============================================================ */
(function () {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // build module matrix with finder patterns reserved
  function buildMatrix(n, rand, opts) {
    const m = Array.from({ length: n }, () => new Array(n).fill(0));
    const reserved = Array.from({ length: n }, () => new Array(n).fill(false));
    const F = 7; // finder size

    function reserve(r, c) {
      for (let i = -1; i <= F; i++)
        for (let j = -1; j <= F; j++) {
          const rr = r + i, cc = c + j;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n) reserved[rr][cc] = true;
        }
    }
    reserve(0, 0); reserve(0, n - F); reserve(n - F, 0);

    // center logo clear-zone
    const clear = opts.logo ? Math.round(n * 0.30) : 0;
    const lo = Math.floor((n - clear) / 2), hi = lo + clear;

    const density = opts.density || 0.47;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (reserved[r][c]) continue;
        if (clear && r >= lo && r < hi && c >= lo && c < hi) continue;
        m[r][c] = rand() < density ? 1 : 0;
      }
    return { m, reserved };
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawFinder(ctx, x, y, s, style, fg, bg) {
    const outer = s, mid = s * (5 / 7), inner = s * (3 / 7);
    const rO = style === "square" ? s * 0.12 : style === "dot" ? s * 0.5 : s * 0.32;
    const rI = style === "square" ? s * 0.12 : style === "dot" ? s * 0.5 : s * 0.30;
    ctx.fillStyle = fg;
    roundRect(ctx, x, y, outer, outer, rO); ctx.fill();
    ctx.fillStyle = bg;
    roundRect(ctx, x + (s - mid) / 2, y + (s - mid) / 2, mid, mid, rO * (5 / 7)); ctx.fill();
    ctx.fillStyle = fg;
    roundRect(ctx, x + (s - inner) / 2, y + (s - inner) / 2, inner, inner, rI); ctx.fill();
  }

  // opts: { grid, style:'rounded'|'dot'|'square', colors:[a,b], angle, bg, logo, seed, density, logoBg }
  function render(canvas, opts) {
    opts = opts || {};
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    const cssSize = opts.cssSize || canvas.clientWidth || 260;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const n = opts.grid || 25;
    const quiet = 2;
    const total = n + quiet * 2;
    const cell = cssSize / total;
    const off = quiet * cell;
    const style = opts.style || "rounded";
    const bg = opts.bg || "#ffffff";
    const rand = mulberry32(opts.seed || 7);

    // background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssSize, cssSize);

    // gradient fill for modules
    const cols = opts.colors || ["#118ab2", "#06d6a0"];
    const ang = (opts.angle == null ? 45 : opts.angle) * Math.PI / 180;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const grad = ctx.createLinearGradient(
      off + (0.5 - dx * 0.5) * (cssSize - off * 2), off + (0.5 - dy * 0.5) * (cssSize - off * 2),
      off + (0.5 + dx * 0.5) * (cssSize - off * 2), off + (0.5 + dy * 0.5) * (cssSize - off * 2)
    );
    if (cols.length === 1) { grad.addColorStop(0, cols[0]); grad.addColorStop(1, cols[0]); }
    else cols.forEach((c, i) => grad.addColorStop(i / (cols.length - 1), c));

    const { m, reserved } = buildMatrix(n, rand, opts);
    const gap = style === "dot" ? 0.16 : style === "square" ? 0.0 : 0.08;
    const pad = cell * gap;
    const r = style === "square" ? cell * 0.14 : style === "dot" ? cell : cell * 0.42;

    ctx.fillStyle = grad;
    for (let row = 0; row < n; row++)
      for (let col = 0; col < n; col++) {
        if (!m[row][col] || reserved[row][col]) continue;
        const x = off + col * cell + pad / 2;
        const y = off + row * cell + pad / 2;
        roundRect(ctx, x, y, cell - pad, cell - pad, r);
        ctx.fill();
      }

    // finders — paint with a flat color sampled from gradient end
    const fg = cols[cols.length - 1];
    const fs = 7 * cell;
    drawFinder(ctx, off, off, fs, style, fg, bg);
    drawFinder(ctx, off + (n - 7) * cell, off, fs, style, fg, bg);
    drawFinder(ctx, off, off + (n - 7) * cell, fs, style, fg, bg);

    // center logo
    if (opts.logo) {
      const ls = cssSize * 0.26;
      const lx = (cssSize - ls) / 2, ly = (cssSize - ls) / 2;
      const padL = ls * 0.14;
      ctx.fillStyle = opts.logoBg || bg;
      roundRect(ctx, lx - padL, ly - padL, ls + padL * 2, ls + padL * 2, ls * 0.26);
      ctx.fill();
      try { ctx.drawImage(opts.logo, lx, ly, ls, ls); } catch (e) {}
    }
  }

  function renderWhenReady(canvas, opts) {
    if (opts && opts.logoSrc) {
      const img = new Image();
      img.onload = () => render(canvas, Object.assign({}, opts, { logo: img }));
      img.onerror = () => render(canvas, opts);
      img.src = opts.logoSrc;
    } else {
      render(canvas, opts);
    }
  }

  window.QReelQR = { render, renderWhenReady };
})();
