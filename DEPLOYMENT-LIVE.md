# 🚀 Deployment Guide - API + Frontend

**Status**: ✅ Ready to Deploy  
**Cost**: 💰 100% FREE  
**Time**: ⏱️ ~30 minutes total

---

## 📋 Prerequisites

You need:
1. A GitHub account (already done ✅ - repo at DET-APP/malikina)
2. A Render account (free - for API)
3. A Vercel account (free - for Frontend)

---

## 🔵 STEP 1: Deploy API to Render.com

### A. Create Render Account & Get API Key

1. Go to https://render.com
2. Click "Sign Up" (use GitHub to connect)
3. Authorize DET-APP/malikina repository
4. Go to Dashboard → Account Settings → API Keys
5. Create new API key (save it somewhere)

### B. Create New Web Service for API

1. Go to https://dashboard.render.com/new/web
2. Select "Deploy an existing GitHub repo"
3. Search for `DET-APP/malikina`
4. Click "Connect"
5. Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `malikina-api` |
| **Runtime** | `Node` |
| **Build Command** | `cd api && npm install --legacy-peer-deps && npm run build` |
| **Start Command** | `cd api && npm start` |
| **Plan** | `Free` |

### C. Set Environment Variables

Click "Advanced" → Add Environment Variables:

```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://malikina.vercel.app
```

⚠️ **IMPORTANT**: Replace `malikina.vercel.app` with your actual Vercel URL (you'll get it in STEP 2)

### D. Deploy

1. Click "Create Web Service"
2. Wait for build to complete (2-3 minutes)
3. You'll get a URL like: `https://malikina-api-xxxxx.onrender.com`
4. **Copy this URL** - you'll need it for Vercel!

✅ **API is now LIVE!**

Test it:
```bash
curl https://malikina-api-xxxxx.onrender.com/api/authors
```

---

## 🟢 STEP 2: Deploy Frontend to Vercel

### A. Create Vercel Account & Connect Repo

1. Go to https://vercel.com
2. Click "Sign Up" (use GitHub to connect)
3. Click "Import Project"
4. Search for `DET-APP/malikina`
5. Click "Import"

### B. Configure Build Settings

1. **Project Name**: `malikina`
2. **Framework Preset**: `Vite`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install --legacy-peer-deps`

### C. Add Environment Variables

Before deploying, add environment variable:

```
VITE_API_URL=https://malikina-api-xxxxx.onrender.com/api
```

Replace `malikina-api-xxxxx` with your actual Render API URL from STEP 1!

### D. Deploy

1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. You'll get a URL like: `https://malikina.vercel.app`

✅ **Frontend is now LIVE!**

---

## ⚙️ STEP 3: Update Render with Vercel URL

Now that you have the Vercel URL, update Render:

1. Go back to https://dashboard.render.com
2. Click on `malikina-api` service
3. Go to "Environment" tab
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://malikina.vercel.app
   ```
5. Click "Save Changes"
6. Service will redeploy automatically

---

## 🧪 STEP 4: Test the Deployment

### Test API Health
```bash
curl https://malikina-api-xxxxx.onrender.com/api/authors
# Should return: []
```

### Test Frontend
1. Open https://malikina.vercel.app in browser
2. Wait for app to load (~5 seconds first time)
3. Click Menu (☰) → "Admin Xassidas" ⚙️
4. Try to create an Author

### Test Full Integration
1. Frontend at https://malikina.vercel.app
2. API at https://malikina-api-xxxxx.onrender.com/api
3. Should be able to create authors/xassidas and upload PDFs

---

## 🔄 OPTIONAL: Update Deployment URLs

If you want prettier URLs:

### Custom Domain for API (Render)
1. Go to `malikina-api` service
2. "Settings" → "Custom Domain"
3. Add domain like `api.malikina.com`
4. Update DNS records

### Custom Domain for Frontend (Vercel)
1. Go to Project Settings
2. "Domains" → Add custom domain
3. Add domain like `malikina.com`
4. Update DNS records

---

## 📝 Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Spins down after 15 min of inactivity
- ~0.5 second delay on first request
- 400MB disk space
- Suitable for development/demo

**Vercel Free Tier:**
- Zero cold starts
- Automatic scaling
- Serverless functions
- Suitable for production

### Database Persistence

Your SQLite database (`xassidas.db`) is stored on Render disk:
- ✅ Data persists between deployments
- ⚠️ Data lost if you delete the service
- 🔒 Backed up by Render automatically for paid plans

**Recommendation**: For production, consider:
1. PostgreSQL on Render (has free tier)
2. MongoDB Atlas (has free tier)
3. Regular database exports

---

## 🚨 Troubleshooting

### API Returns 502 Error
- Check Render logs: Dashboard → Service → Logs
- Common causes:
  - Database not initialized
  - PORT environment variable missing
  - Node.js version mismatch

### Frontend Shows "API Not Found"
- Check `.env` has correct `VITE_API_URL`
- Make sure Render service is running
- Check CORS is enabled in API

### PDF Upload Not Working
- File size limit on free tier (~10MB)
- Check that xassidas.db is writable
- Verify Node.js version (20+)

### "Cannot find module" Error
- Run rebuild on Render: Settings → Manual Deploy
- Clear npm cache: `npm install --legacy-peer-deps`

### Service Keeps Spinning Down
- Normal on free tier (after 15 min inactivity)
- Consider upgrading to paid plan
- Or ping API every 14 min to keep alive

---

## 📊 Monitoring

### Check API Health
```bash
# Health check
curl https://malikina-api-xxxxx.onrender.com/api/authors

# Get xassidas
curl https://malikina-api-xxxxx.onrender.com/api/xassidas
```

### Check Render Logs
1. Dashboard → malikina-api → Logs
2. Look for errors in real-time

### Check Vercel Analytics
1. Vercel Dashboard → Malikina → Analytics
2. See visitor counts, performance, etc.

---

## 🔐 Security Checklist

- [x] GitHub repository is public/private (your choice)
- [x] Environment variables in Render/Vercel (not in code)
- [x] CORS configured in API
- [x] PDF file size limits enforced
- [x] Input validation on API endpoints
- [x] No sensitive data in commits

---

## 💾 Backup & Recovery

### Export Database from Render

```bash
# Via Render dashboard
# API Console → Database (if using PostgreSQL)
# For SQLite, download xassidas.db from service

# Via SSH
# Settings → SSH Key → Connect via SSH
# Then: cat xassidas.db > backup.db
```

### Restore Database

1. Delete the service
2. Recreate it (new blank database)
3. Use API to re-create authors/xassidas
4. Or push data via API

---

## 🆘 Support

### If Deployment Fails

1. **Check Logs**
   - Render: Service → Logs
   - Vercel: Project → Deployments → Logs

2. **Restart Service**
   - Render: Settings → Manual Deploy
   - Vercel: Redeploy

3. **Check Environment Variables**
   - Make sure `VITE_API_URL` matches
   - Make sure `FRONTEND_URL` is correct
   - No typos!

4. **Test Locally First**
   ```bash
   npm run dev  # Frontend
   cd api && npm run dev  # API
   ```

---

## 🎉 Deployment Complete!

Your Malikina app is now live:

| Component | Tier | URL |
|-----------|------|-----|
| **API** | Render Free | `https://malikina-api-xxxxx.onrender.com/api` |
| **Frontend** | Vercel Free | `https://malikina.vercel.app` |
| **Database** | SQLite (Render) | Included |
| **Backup** | Manual | Via Render SSH |
| **Cost** | 💰 | $0/month |

---

## 📈 Next Steps

### After Deployment

1. [ ] Test all features (create author, xassida, PDF upload)
2. [ ] Monitor logs for errors
3. [ ] Get feedback from users
4. [ ] Consider upgrading for production stability

### Scaling (If Popular)

1. [ ] Move database to PostgreSQL
2. [ ] Add CDN for static files
3. [ ] Set up monitoring/alerts
4. [ ] Implement user authentication
5. [ ] Add analytics

---

## 🔗 URLs Summary

```
📡 GitHub Repo:    https://github.com/DET-APP/malikina
🌐 Frontend:       https://malikina.vercel.app
⚙️  API:            https://malikina-api-xxxxx.onrender.com/api
📚 Admin Panel:    https://malikina.vercel.app → Menu → Admin Xassidas
```

---

**You can now access Malikina from anywhere! 🌍**

Share the URL: `https://malikina.vercel.app`

All features working:
- ✅ Display xassidas with translations
- ✅ Admin interface (auth optional)
- ✅ PDF upload for new verses
- ✅ Database persistence
- ✅ API for other clients

Enjoy! 🚀
