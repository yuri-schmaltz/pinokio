# Pinokio Vendor Files

This directory contains vendored/customized files from the `pinokiod` dependency that include UX improvements and fixes.

## Purpose

Files in `node_modules/pinokiod/` are not version-controlled and are overwritten on every `npm install`. By vendoring these files here and using a postinstall script, we ensure our improvements persist.

## Structure

```
pinokio_vendor/
└── server/
    ├── views/           # EJS templates
    │   ├── index.ejs           # Dashboard with accessibility improvements
    │   ├── download.ejs        # Installation flow with contextual feedback
    │   ├── discover_native.ejs # App discovery (already had alt text)
    │   └── item_native.ejs     # App details with alt text
    └── public/
        └── style.css    # Design System with tokens and organization
```

## How It Works

1. **Installation**: `npm install` triggers `postinstall` hook
2. **Sync**: `scripts/sync-vendor.js` copies files from here to `node_modules/pinokiod/`
3. **Runtime**: Application uses the improved files

## Changes Made

See [UX_AUDIT.md](../.gemini/antigravity/brain/2e5bd48c-e7f2-4f3d-996e-daf4a5519aa0/UX_AUDIT.md) and [DESIGN_SYSTEM.md](../.gemini/antigravity/brain/2e5bd48c-e7f2-4f3d-996e-daf4a5519aa0/DESIGN_SYSTEM.md) for details.

**Summary of improvements:**
- ♿ Accessibility: Alt text on all images
- 🎨 Design Tokens: Standardized CSS variables
- 💬 Installation UX: Contextual feedback and status icons
- 🗂️ CSS Organization: Clear section headers
