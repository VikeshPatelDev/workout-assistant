# Testing PWA on Mobile - Step by Step Guide

## ⚠️ Important: Deploy First!

You must deploy the new build for PWA features to work:

```bash
npm run deploy
```

Wait 1-2 minutes for GitHub Pages to update, then follow these steps.

## What to Look For on Mobile

### Android (Chrome/Edge)

1. **Install Prompt** (may appear automatically):
   - Look for a banner at the bottom saying "Add to Home screen" or "Install app"
   - Or check the browser menu (⋮) → "Add to Home screen" or "Install app"

2. **After Installing**:
   - App icon appears on home screen
   - Opens in standalone mode (no browser UI)
   - Can work offline after first visit

3. **Check Service Worker**:
   - Open Chrome DevTools (if possible) or use chrome://inspect
   - Go to Application → Service Workers
   - Should see "activated and running"

### iOS (Safari)

1. **Add to Home Screen**:
   - Tap the Share button (square with arrow)
   - Select "Add to Home Screen"
   - Customize the name if desired
   - Tap "Add"

2. **After Adding**:
   - App icon appears on home screen
   - Opens in standalone mode
   - Status bar matches theme color

3. **Note**: iOS doesn't show automatic install prompts like Android

## How to Verify PWA is Working

### Method 1: Check Manifest
Visit: `https://your-github-pages-url.github.io/workout-assistant/manifest.webmanifest`

Should return JSON with app details.

### Method 2: Check Service Worker
Visit: `https://your-github-pages-url.github.io/workout-assistant/sw.js`

Should return JavaScript code (not 404).

### Method 3: Browser DevTools (Desktop)
1. Open your site in Chrome/Edge
2. Press F12 → Application tab
3. Check:
   - **Manifest**: Should show app name, icons, theme
   - **Service Workers**: Should show "activated and running"
   - **Cache Storage**: Should show cached files

### Method 4: Test Offline
1. Visit your site (let it load completely)
2. Turn on airplane mode or disable WiFi
3. Refresh the page
4. Should still load (cached assets)

## Troubleshooting

### No Install Prompt?
- **Android**: Menu (⋮) → "Add to Home screen" or "Install app"
- **iOS**: Share button → "Add to Home Screen"
- Make sure you're on HTTPS (GitHub Pages provides this)

### Service Worker Not Registering?
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors
- Verify you deployed the new build

### Icons Not Showing?
- Verify icons exist in `dist/` folder after build
- Check manifest.webmanifest references correct icon paths
- Clear browser cache

## Quick Test Checklist

- [ ] Deployed new build (`npm run deploy`)
- [ ] Waited 1-2 minutes for GitHub Pages update
- [ ] Visited site on mobile
- [ ] Can see "Add to Home Screen" option
- [ ] After adding, app opens in standalone mode
- [ ] App works offline (after first visit)

