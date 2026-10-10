---
"@concile/cli": patch
---

`concile init` in a folder with files but no package.json now asks what to set up: a project inside it, or a new app folder. It never suggests a folder name that is already taken.
