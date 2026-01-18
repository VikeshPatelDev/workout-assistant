# PWA Setup Guide

Your Workout Assistant app is now a Progressive Web App (PWA)! 🎉

## Features Enabled

✅ **Installable**: Users can install the app on their devices (mobile and desktop)
✅ **Offline Support**: Service worker caches assets for offline use
✅ **App-like Experience**: Standalone display mode (no browser UI)
✅ **Smart Caching**: 
   - YouTube thumbnails cached for 30 days
   - YouTube API responses cached for 1 day
   - All app assets precached

## Testing the PWA

### Development
1. Run `npm run build` to create a production build
2. Run `npm run preview` to test the production build
3. Open DevTools → Application tab → Service Workers to verify registration

### Production Testing
1. Deploy your app (e.g., `npm run deploy` for GitHub Pages)
2. Visit the deployed URL on a mobile device or desktop
3. Look for the "Install" prompt in the browser
4. Test offline functionality by going offline after first visit

## Browser Support

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Android & Desktop)
- ✅ Samsung Internet

## Icons

Icons are located in the `public` folder:
- `pwa-192x192.png` - Standard PWA icon
- `pwa-512x512.png` - Large PWA icon
- `apple-touch-icon.png` - iOS home screen icon
- `mask-icon.svg` - Safari pinned tab icon

To regenerate icons, run:
```bash
node generate-icons.js
```

Or use the browser-based generator: `public/generate-icons.html`

## Configuration

PWA settings are configured in `vite.config.js`:
- Manifest settings (name, theme, icons)
- Service worker caching strategies
- Workbox configuration

## Notes

- The app requires HTTPS in production (GitHub Pages provides this automatically)
- Service worker updates automatically when new versions are deployed
- Users will see update prompts when new versions are available

