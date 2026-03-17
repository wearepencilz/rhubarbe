# Quick Start Guide

## ✅ What's Set Up

1. **Vercel Project Linked** - Your local project is connected to Vercel
2. **Deployment Scripts** - Easy commands to deploy
3. **Database Adapter** - Works locally (JSON) and production (Redis)
4. **Auto-Deploy** - Pushes to GitHub automatically deploy to Vercel

## 🚀 Deploy Now

### Option 1: Automatic (Recommended)
```bash
git add -A
git commit -m "your changes"
git push origin main
```
Vercel automatically deploys! ✨

### Option 2: Manual
```bash
npm run deploy
```

## 📋 Next Steps

### 1. Set Up Database (Required for Production)

Go to [vercel.com](https://vercel.com/dashboard) → Your Project → Integrations

1. Search for "Upstash Redis"
2. Click "Add Integration"
3. Follow setup wizard
4. Done! Environment variables are auto-configured

### 2. Set Up File Storage (Optional)

For persistent image uploads, add Vercel Blob:

```bash
npm install @vercel/blob
```

Then update `server.js` to use Blob storage instead of local files.

## 🛠️ Development Workflow

```bash
# Local development
npm run server    # Terminal 1 - API server
npm run dev       # Terminal 2 - Frontend

# Make changes, test locally

# Deploy
git add -A
git commit -m "description"
git push origin main

# Or manual deploy
npm run deploy
```

## 📊 Monitor Your Site

- **Live Site**: Check Vercel dashboard for your URL
- **Logs**: Vercel Dashboard → Logs
- **Analytics**: Vercel Dashboard → Analytics

## 🔑 CMS Access

- **URL**: `your-site.vercel.app/cms`
- **Username**: `admin`
- **Password**: `admin123`

⚠️ Change these credentials in production!

## 📚 More Info

- Full deployment guide: See `DEPLOYMENT.md`
- Project structure: See `.kiro/steering/structure.md`
- Tech stack: See `.kiro/steering/tech.md`

## 🆘 Need Help?

Common issues:

1. **Build fails**: Check Vercel logs
2. **Data not saving**: Set up Upstash Redis integration
3. **Images not showing**: Set up Vercel Blob storage
4. **API errors**: Check function logs in Vercel dashboard
