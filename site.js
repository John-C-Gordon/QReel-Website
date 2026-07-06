/* QReel marketing site — shared behavior */
(function () {
  var LOGO = "assets/qreel-logo.png";

  /* ---- theme: QReel ships its signature dark teal ambient ---- */
  function initTheme() {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  /* ---- declarative QR rendering ---- */
  function initQRs() {
    var nodes = document.querySelectorAll("canvas[data-qr]");
    nodes.forEach(function (cv) {
      var opts;
      try { opts = JSON.parse(cv.getAttribute("data-qr")); } catch (e) { opts = {}; }
      if (opts.logo) opts.logoSrc = LOGO;
      var render = function () {
        opts.cssSize = cv.clientWidth || cv.parentElement.clientWidth || 260;
        window.QReelQR.renderWhenReady(cv, opts);
      };
      render();
      cv.__render = render;
    });
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        nodes.forEach(function (cv) { if (cv.__render) cv.__render(); });
      }, 180);
    });
  }

  /* ---- scroll reveal (rAF + scroll; no IntersectionObserver
         dependency — some embedded preview frames never fire it) ---- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!els.length) return;
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = els.length - 1; i >= 0; i--) {
        var el = els[i];
        var top = el.getBoundingClientRect().top;
        if (top < vh * 0.92) {
          var d = el.getAttribute("data-delay");
          if (d) el.style.transitionDelay = d + "ms";
          el.classList.add("in");
          els.splice(i, 1);
        }
      }
      if (!els.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; check(); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    requestAnimationFrame(check);
    // safety net: ensure nothing stays hidden
    setTimeout(function () { els.slice().forEach(function (el) { el.classList.add("in"); }); }, 1400);
  }

  function boot() { initTheme(); initQRs(); initReveal(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
