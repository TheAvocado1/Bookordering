# 🚀 Complete GitHub Pages Deployment Guide

This step-by-step guide will get your Booklet Processor live on the web for FREE using GitHub Pages.

## 📋 Prerequisites

- GitHub account (free at [github.com](https://github.com))
- Git installed on your computer
- Your 3 web app files: `index.html`, `booklet-processor.js`, `style.css`

## 🔧 Step 1: Install Git (if needed)

**Windows:**
- Download from [git-scm.com](https://git-scm.com/download/win)
- Install with default settings
- Restart your computer

**Check if Git is installed:**
```bash
git --version
```

## 🆕 Step 2: Create GitHub Repository

1. **Go to [github.com](https://github.com) and sign in**

2. **Click the green "New" button** (or the "+" icon → "New repository")

3. **Repository settings:**
   ```
   Repository name: booklet-processor
   Description: PDF Booklet Page Reordering Tool
   ☑️ Public (required for free GitHub Pages)
   ☐ Add a README file (we'll create our own)
   ☐ Add .gitignore
   ☐ Choose a license
   ```

4. **Click "Create repository"**

5. **Copy the repository URL** (it looks like):
   ```
   https://github.com/YOUR_USERNAME/booklet-processor.git
   ```

## 💻 Step 3: Setup Local Repository

1. **Open Terminal/Command Prompt in your project folder**
   ```bash
   # Navigate to your folder (example path)
   cd "C:\Users\katea\Documents\GitHub\Bookordering"
   ```

2. **Initialize Git repository:**
   ```bash
   git init
   ```

3. **Configure Git (first time only):**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

4. **Add your files:**
   ```bash
   git add index.html
   git add booklet-processor.js  
   git add style.css
   ```

5. **Create first commit:**
   ```bash
   git commit -m "Initial booklet processor web app"
   ```

6. **Set main branch:**
   ```bash
   git branch -M main
   ```

7. **Connect to GitHub repository:**
   ```bash
   # Replace YOUR_USERNAME with your actual GitHub username
   git remote add origin https://github.com/YOUR_USERNAME/booklet-processor.git
   ```

8. **Push to GitHub:**
   ```bash
   git push -u origin main
   ```

## 🌐 Step 4: Enable GitHub Pages

1. **Go to your repository on GitHub.com**
   ```
   https://github.com/YOUR_USERNAME/booklet-processor
   ```

2. **Click the "Settings" tab** (at the top of the repository)

3. **Scroll down to "Pages" section** (in the left sidebar)

4. **Configure Pages settings:**
   ```
   Source: Deploy from a branch
   Branch: main
   Folder: / (root)
   ```

5. **Click "Save"**

6. **Wait 1-5 minutes** for deployment

7. **Your site will be live at:**
   ```
   https://YOUR_USERNAME.github.io/booklet-processor/
   ```

## ✅ Step 5: Verify Deployment

1. **Visit your live site**
2. **Test uploading a PDF**
3. **Check that processing works**
4. **Share the URL with others!**

## 🔄 Step 6: Making Updates

When you want to update your web app:

1. **Edit your files locally**
2. **Add, commit, and push changes:**
   ```bash
   git add .
   git commit -m "Updated styling/features"
   git push
   ```
3. **Changes appear live in 1-5 minutes**

## 🎯 Quick Commands Reference

```bash
# Clone existing repository
git clone https://github.com/YOUR_USERNAME/booklet-processor.git

# Check status
git status

# Add all changed files
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Pull latest changes
git pull
```

## 🚨 Troubleshooting

### Problem: "Permission denied" or authentication errors
**Solution:** Use Personal Access Token instead of password
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with "repo" permissions
3. Use token as password when prompted

### Problem: Site not updating
**Solutions:**
- Wait 5-10 minutes for GitHub Pages to rebuild
- Hard refresh browser (Ctrl+F5)
- Check repository Actions tab for build errors

### Problem: 404 error on site
**Solutions:**
- Ensure repository is public
- Check file names are exactly: `index.html`, `booklet-processor.js`, `style.css`
- Verify Pages is enabled and source is set to "main" branch

### Problem: JavaScript not working
**Solutions:**
- Check browser console (F12) for errors
- Ensure files uploaded correctly
- Try different browser

## 📱 Bonus: Custom Domain (Optional)

1. **Buy domain** (GoDaddy, Namecheap, etc.)
2. **In repository Settings → Pages:**
   - Add your domain in "Custom domain" field
3. **Update DNS settings** at your domain provider:
   ```
   Type: CNAME
   Name: www (or @)
   Value: YOUR_USERNAME.github.io
   ```

## 🔒 Security Notes

- Repository must be **public** for free GitHub Pages
- All code is visible to anyone
- No sensitive information in your code (which is good - no API keys needed!)

## 🎉 You're Live!

Once deployed, anyone can visit your URL and use your booklet processor without installing anything. Perfect for sharing with friends, colleagues, or the world!

**Example live URLs:**
- `https://katea.github.io/booklet-processor/`
- `https://johndoe.github.io/booklet-processor/`

## 📈 Next Steps

1. **Add README.md** with description
2. **Star your own repo** (why not! 😄)
3. **Share on social media**
4. **Consider adding more features**
5. **Maybe submit to awesome-lists**

Your booklet processor is now accessible worldwide! 🌍✨