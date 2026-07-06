# QReel — marketing site

Static site for **QReel**, a playful QR-code generator for iPhone, iPad & Mac.
Landing page + Terms of Service + Privacy Policy. No build step — plain HTML/CSS/JS.

## Contents
- `index.html` — landing page
- `terms.html` — Terms of Service
- `privacy.html` — Privacy Policy
- `qreel-site.css` — all styles (design tokens inlined; self-contained)
- `qr-art.js` — decorative on-brand QR renderer
- `site.js` — shared behavior (QR init, scroll reveal)
- `assets/` — app icon + logo
- `CNAME` — custom domain for GitHub Pages
- `.nojekyll` — serve files verbatim (skip Jekyll processing)

## Deploy (GitHub Pages)
1. Create a new repository and push the contents of this folder to its root.
2. In **Settings → Pages**, set the source to the `main` branch, `/` (root).
3. Under **Custom domain**, confirm `qreel.app` (already set in `CNAME`) and add the
   matching DNS records at your registrar (an `A`/`ALIAS` for the apex domain to the
   GitHub Pages IPs, or a `CNAME` record for `www`). Enable **Enforce HTTPS** once the
   certificate is issued.

Edit `CNAME` if your domain differs, or delete it to serve from the default
`*.github.io` address.
