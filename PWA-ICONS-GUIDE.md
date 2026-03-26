# PWA Icons Guide

## Required Icon Files

Place these files in `/public/icons/`:

### App Icons
- **icon-192.png** (192×192px) - Standard app icon
- **icon-192-maskable.png** (192×192px) - Maskable icon (with safe zone)
- **icon-512.png** (512×512px) - Large app icon
- **icon-512-maskable.png** (512×512px) - Maskable large icon

### Shortcuts Icons (Optional)
- **prayer-icon.png** (192×192px) - Prayer times shortcut
- **quran-icon.png** (192×192px) - Quran shortcut

### Screenshots (Optional)
- **screenshot-1.png** (540×720px) - Mobile screenshot
- **screenshot-2.png** (1280×720px) - Tablet/desktop screenshot

## Quick Generation Tools

### Using Online Tools
- **Favicon Generator:** https://www.favicongenerator.com
- **PWA Asset Generator:** https://www.pwabuilder.com/imageGenerator
- **Maskable Icon Generator:** https://maskable.app/

### Using ImageMagick (CLI)
```bash
# Create 192x192 icon
convert source-image.png -resize 192x192 icon-192.png

# Create 512x512 icon
convert source-image.png -resize 512x512 icon-512.png

# Create maskable icon (add padding)
convert icon-192.png -bordercolor white -border 45 icon-192-maskable.png
```

### Using FFmpeg
```bash
# Create icons from SVG
ffmpeg -i icon.svg -s 192x192 icon-192.png
ffmpeg -i icon.svg -s 512x512 icon-512.png
```

## Specifications

### Minimum Requirements
- Total of 4 files: `icon-192.png`, `icon-192-maskable.png`, `icon-512.png`, `icon-512-maskable.png`
- File format: PNG with transparency
- Color space: sRGB
- Favicon: Include `favicon.ico` at `/public/`

### Maskable Icons
Maskable icons have a **safe zone** where content must fit:
- Safe zone: Center 80% of the image (45px padding for 192×192)
- Can be used as adaptive icons on Android
- Background should be transparent with solid content

### UX Best Practices
1. **Consistency:** Use the same design across all sizes
2. **Padding:** Maskable icons need 45px padding for 192×192
3. **Colors:** Use colors from your theme (matches `theme_color` in manifest)
4. **Transparency:** Keep transparency for app shelf visibility

## Testing PWA

### Chrome DevTools
1. Open DevTools → Application tab
2. Check "Manifest" to validate manifest.json
3. Check "Service Workers" to verify registration
4. Use Lighthouse audit for PWA score

### Testing Installation
1. Chrome: Three dots → "Install app"
2. Firefox: Hamburger menu → "Install"
3. Edge: Three dots → "Apps" → "Install this site as an app"

### Offline Testing
1. DevTools → Network tab → Offline checkbox
2. Refresh page - app should load from cache
3. Check Console for service worker logs

## Manifest Configuration

The `manifest.json` already includes:
- Basic metadata (name, description, colors)
- App shortcuts (Prayer Times, Quran)
- Screenshot configuration
- Display mode: `standalone` (full-screen app)

## Next Steps

1. **Generate icon files** using one of the tools above
2. **Place PNG files** in `/public/icons/`
3. **Update `manifest.json`** if you change icon paths
4. **Test in DevTools:** Application → Manifest
5. **Build & deploy:** `npm run build`
6. **Test on mobile:** Install app from home screen

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Web app not installable" | Check manifest.json in DevTools, ensure icons exist |
| Icons don't show | Verify file paths in manifest.json and public/icons folder |
| "Invalid icon format" | Ensure PNG format with transparency, correct dimensions |
| Service worker not registering | Check console for errors, verify public/service-worker.js exists |

## Resources

- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder - Icon Generator](https://www.pwabuilder.com)
- [Maskable Icons](https://maskable.app)
- [Google PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist)
