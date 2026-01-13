# GitHub Pages Deployment Plan

## Overview
This guide will help you deploy your React + Vite workout assistant app to GitHub Pages.

## Prerequisites
- GitHub account
- Repository already created on GitHub
- Git installed locally

---

## Option 1: HashRouter (Recommended - Simpler)

### Step 1: Install gh-pages package
```bash
cd workout-assistant
npm install --save-dev gh-pages
```

### Step 2: Update package.json
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
}
```
**Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.**

### Step 3: Update App.jsx to use HashRouter
Change `BrowserRouter` to `HashRouter` in `src/App.jsx`:

```jsx
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
// ... rest of the code stays the same
```

### Step 4: Update vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Important for GitHub Pages
})
```

### Step 5: Deploy
```bash
npm run deploy
```

This will:
1. Build your app
2. Deploy the `dist` folder to the `gh-pages` branch
3. Make your app available at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

---

## Option 2: BrowserRouter with Base Path (More Complex)

### Step 1: Install gh-pages package
```bash
cd workout-assistant
npm install --save-dev gh-pages
```

### Step 2: Update package.json
Same as Option 1, but the `homepage` should be:
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"
}
```

### Step 3: Update vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/YOUR_REPO_NAME/', // Replace with your repo name
})
```

### Step 4: Update App.jsx
Keep `BrowserRouter` but wrap it with `basename`:
```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router basename="/YOUR_REPO_NAME"> {/* Replace with your repo name */}
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:id" element={<Category />} />
        </Routes>
      </div>
    </Router>
  );
}
```

### Step 5: Deploy
```bash
npm run deploy
```

---

## Option 3: GitHub Actions (Automatic Deployment)

This automatically deploys on every push to main branch.

### Step 1: Create GitHub Actions workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: workout-assistant/package-lock.json
      
      - name: Install dependencies
        working-directory: ./workout-assistant
        run: npm ci
      
      - name: Build
        working-directory: ./workout-assistant
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './workout-assistant/dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 2: Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save

### Step 3: Use HashRouter (Recommended)
Follow Step 3 from Option 1 to switch to HashRouter.

### Step 4: Update vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
})
```

### Step 4: Push to GitHub
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

The workflow will automatically build and deploy your app!

---

## Recommended Approach

**I recommend Option 1 (HashRouter) + Option 3 (GitHub Actions)** for the best experience:
- HashRouter works perfectly with GitHub Pages (no base path issues)
- GitHub Actions automates deployment on every push
- No manual deployment needed

---

## Troubleshooting

### 404 Errors on Refresh
- **Solution**: Use HashRouter instead of BrowserRouter

### Assets Not Loading
- **Solution**: Make sure `base: './'` is set in `vite.config.js`

### Routes Not Working
- **Solution**: Verify you're using HashRouter (URLs will have `#` in them)

### Build Fails
- Check Node.js version (should be 18+)
- Run `npm install` to ensure dependencies are installed
- Check for any linting errors: `npm run lint`

---

## After Deployment

Your app will be available at:
- `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

**Note**: If using HashRouter, URLs will look like:
- `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/#/`
- `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/#/category/chest`

This is normal and works perfectly!

