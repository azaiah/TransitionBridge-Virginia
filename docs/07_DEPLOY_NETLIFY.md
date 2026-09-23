# 07 — Deploy to Netlify

Static site. No server runtime, no database, no environment secrets. That is the point:
there is nothing that can be down when you are standing in front of a Commissioner.

---

## 1. Build configuration

`next.config.mjs`:
```js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },   // required for static export
  trailingSlash: true,
  // Do NOT add typescript.ignoreBuildErrors or eslint.ignoreDuringBuilds.
  // Fix the errors instead.
};
export default nextConfig;
```

`netlify.toml`:
```toml
[build]
  command = "npm run generate && npm run assets && npm run build"
  publish  = "out"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options        = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy        = "strict-origin-when-cross-origin"
    Permissions-Policy     = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

`npm run generate` must run before `npm run build` so the dataset is regenerated
deterministically as part of every deploy.

---

## 2. Steps

1. Push the repository to GitHub.
2. Netlify → **Add new site → Import an existing project** → select the repo.
3. Confirm build command `npm run generate && npm run assets && npm run build` and publish directory `out`.
4. Set the site name to **`transitionbridge-va`** → `https://transitionbridge-va.netlify.app`.
5. Deploy, then open the deployed URL and walk every route.

### 2.1 Remove the “Powered by Netlify” corner badge

Netlify adds its own small badge on some sites. The app shows **Powered by DataIsData** in the bottom-right instead.

1. Netlify → your site → **Site configuration** → **General** → **Site information**.
2. Turn off **Netlify badge** / **Show Netlify badge** (wording varies).
3. **Clear cache and deploy site** so the change applies.

If the Netlify pill still appears after that, the site CSS includes a fallback that hides their widget only (not our badge). You should still disable it in the dashboard for a clean demo.

---

## 3. Pre-presentation checklist

Run this the day before, on the deployed URL, not on localhost.

- [ ] Every route in `01_PRODUCT_SPEC.md` §0 loads with no console errors
- [ ] The Virginia map renders and all four layers switch
- [ ] Role switching works in both directions between all four roles
- [ ] Every CSV export downloads and opens correctly
- [ ] Print-to-PDF produces a branded, dated report with the demonstration-data notice
- [ ] Global search returns results
- [ ] Demo mode toggle and guided tour work
- [ ] Lighthouse: Performance ≥ 90, Accessibility **100**
- [ ] Zero technology names anywhere in the rendered output (view source and check)
- [ ] Test on the actual presentation laptop, in the actual browser, at the actual resolution
- [ ] **Save a full offline copy** — if conference wifi fails, you present from `out/`
      opened locally. Rehearse that fallback once so it isn't the first time.

---

## 4. Custom domain (optional, for the pilot conversation)

If you want a domain rather than a `netlify.app` subdomain, `transitionbridge.io` or
`transitionbridgeva.com` under the IEP Partners identity reads better in a state meeting than
a platform subdomain. Add it in Netlify → Domain management; TLS is automatic.

Not required for the first demo. A clean subdomain is fine and nobody will remark on it.

---

## 5. Access

Keep the repository **private**. The demo URL is unlisted rather than authenticated — that
is acceptable because it contains only synthetic data, but do not post it publicly until
after the DARS conversation. First impressions of a pilot proposal should be delivered, not
discovered.

If you want a soft gate, Netlify's site-wide password protection on a paid tier is enough.
Do not build a login for this — a fake login on a demo is worse than no login.
