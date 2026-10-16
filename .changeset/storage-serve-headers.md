---
"@concile/storage": patch
---

Files streamed from `/api/storage/:id` can no longer run script on the app's origin. Every
response now sends `X-Content-Type-Options: nosniff`, and any type outside a small inline-safe
allowlist (raster images, audio, video, `text/plain`, PDF) is served with
`Content-Disposition: attachment`. Previously an uploader-chosen `text/html` or `image/svg+xml`
content type was echoed back and rendered inline. `fetch()`, `<img>` and `<video>` are unaffected.
