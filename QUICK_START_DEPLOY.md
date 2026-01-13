# Quick Start: Deploy to GitHub Pages

## Step 1: Install gh-pages (for manual deployment option)
```bash
cd workout-assistant
npm install --save-dev gh-pages
```

## Step 2: Update package.json homepage
Edit `package.json` and add this line (replace with your GitHub username and repo name):
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
}
```

**Example:**
```json
{
  "homepage": "https://johndoe.github.io/youtube-fitness"
}
```

## Step 3: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. Save

## Step 4: Push to GitHub

```bash
# Make sure you're in the root directory (youtube-fitness)
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

## Step 5: Wait for Deployment

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You'll see a workflow running called "Deploy to GitHub Pages"
4. Wait for it to complete (usually 2-3 minutes)

## Step 6: Access Your App

Once deployment is complete, your app will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME
```

**Note:** URLs will have `#` in them (e.g., `https://username.github.io/repo/#/category/chest`). This is normal with HashRouter and works perfectly!

---

## Manual Deployment (Alternative)

If you prefer manual deployment instead of GitHub Actions:

```bash
cd workout-assistant
npm run deploy
```

This will deploy to the `gh-pages` branch. Then in GitHub Settings → Pages, select the `gh-pages` branch as the source.

---

## Troubleshooting

### Build fails in GitHub Actions
- Check that `package-lock.json` exists
- Verify Node.js version (should be 18+)

### 404 errors
- Make sure you're using HashRouter (already updated in App.jsx)
- Verify `base: './'` is set in vite.config.js (already updated)

### Assets not loading
- Check that `base: './'` is in vite.config.js
- Clear browser cache and try again

