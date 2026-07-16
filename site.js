/* QReel marketing site — shared behavior */
(function () {
  var LOGO = "assets/QReelWordmark.svg";

  /* ---- theme: QReel ships its signature dark teal ambient ---- */
  function initTheme() {
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem("qreel-theme"); } catch (e) {}
    root.setAttribute("data-theme", saved === "light" ? "light" : "dark");
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-toggle]"), function (btn) {
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("qreel-theme", next); } catch (e) {}
      });
    });
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

  /* ---- support form modal + thank-you modal ---- */
  function initModals() {
    var supportModal = document.getElementById("supportModal");
    var thanksModal = document.getElementById("thanksModal");
    var form = document.getElementById("supportForm");
    if (!supportModal) return;
    var lastFocus = null;

    function lock() { document.body.style.overflow = "hidden"; }
    function unlock() { if (!document.querySelector(".modal.open")) document.body.style.overflow = ""; }

    function openModal(modal) {
      lastFocus = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      lock();
      var first = modal.querySelector("input, textarea, button");
      if (first) setTimeout(function () { first.focus(); }, 80);
    }
    function closeModal(modal, keepFocus) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      unlock();
      if (!keepFocus && lastFocus && lastFocus.focus) lastFocus.focus();
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-open-support]"), function (o) {
      o.addEventListener("click", function (e) { e.preventDefault(); openModal(supportModal); });
    });

    [supportModal, thanksModal].forEach(function (m) {
      if (!m) return;
      m.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) closeModal(m);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) {
        var openEl = document.querySelector(".modal.open");
        if (openEl) closeModal(openEl);
      }
    });

    if (form) {
      var err = document.getElementById("sf-error");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        var label = btn ? btn.textContent : "";
        if (err) err.classList.remove("show");
        if (btn) { btn.setAttribute("aria-busy", "true"); btn.textContent = "Sending\u2026"; }
        fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { "Accept": "application/json" }
        }).then(function (res) {
          if (res.ok) {
            form.reset();
            closeModal(supportModal, true);
            openModal(thanksModal);
          } else {
            if (err) err.classList.add("show");
          }
        }).catch(function () {
          if (err) err.classList.add("show");
        }).then(function () {
          if (btn) { btn.removeAttribute("aria-busy"); btn.textContent = label; }
        });
      });
    }
  }

  function boot() { initTheme(); initQRs(); initReveal(); initModals(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
