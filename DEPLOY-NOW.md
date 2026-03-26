# 🚀 DEPLOYMENT - Quick Start

## Your code is READY to deploy!

Everything is committed to GitHub at:  
**https://github.com/DET-APP/malikina** (branch: `dev`)

---

## 🎯 3-Step Deployment

### Step 1️⃣ : Deploy API to Render (5 min)

Go to: **https://render.com/dashboard/new/web**

```
Name: malikina-api
GitHub Repo: DET-APP/malikina
Build Command: cd api && npm install --legacy-peer-deps && npm run build
Start Command: cd api && npm start
Plan: Free
```

Environment Variables:
```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://malikina.vercel.app
```

Click "Create Web Service" → Wait 3-5 min → **Get your API URL** ✅

---

### Step 2️⃣ : Deploy Frontend to Vercel (5 min)

Go to: **https://vercel.com/new**

```
Import: DET-APP/malikina
Framework: Vite
```

Environment Variables:
```
VITE_API_URL=https://malikina-api-xxxxx.onrender.com/api
```

(Replace xxxxx with your Render service name)

Click "Deploy" → Wait 3-5 min → **Get your Frontend URL** ✅

---

### Step 3️⃣ : Update Render with Frontend URL (1 min)

1. Go back to Render dashboard
2. Select `malikina-api`
3. Go to "Environment"
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://malikina.vercel.app
   ```
5. Save → Service redeploys automatically ✅

---

## ✨ Done! Your app is LIVE 🎉

Access it at: **https://malikina.vercel.app**

Test it:
1. Open https://malikina.vercel.app
2. Click Menu (☰) → Admin Xassidas ⚙️
3. Create an author
4. Create a xassida
5. Upload a PDF

All working? **SUCCESS!** 🚀

---

## 📚 Full Guides

For detailed instructions:
- **DEPLOYMENT-LIVE.md** - Complete step-by-step guide with troubleshooting
- **PRE-DEPLOYMENT-CHECKLIST.md** - Final checklist before deploying
- **API-SETUP.md** - API documentation
- **SETUP-COMPLETE.md** - Local development setup

---

## 💡 Tips

- **Render Free Tier**: API will sleep after 15 min (normal, wakes up on next request)
- **Vercel Free**: Always fast, no cold starts
- **Total Cost**: $0/month
- **Custom Domain**: You can add later via both platforms

---

## 🆘 If Something Goes Wrong

1. **Check Logs**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Deployments → Logs

2. **Restart Service**
   - Render: Settings → Manual Deploy
   - Vercel: Redeploy from Dashboard

3. **Check Environment Variables**
   - Make sure `VITE_API_URL` and `FRONTEND_URL` match your actual URLs
   - No typos!

---

## 📞 Support

Your GitHub repo: **https://github.com/DET-APP/malikina**

Deployment guides:
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs

---

**Ready? Go to https://render.com and deploy! 🚀**

You've got this! 💪
