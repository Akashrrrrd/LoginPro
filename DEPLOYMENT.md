# 🚀 Deployment Guide

## Why Camera Doesn't Work on Mobile (HTTP)

**The Issue**: Modern browsers require **HTTPS** for camera access due to security policies. If you're testing on mobile over HTTP (like `http://192.168.x.x:3000`), the camera will be blocked.

## ✅ Solution: Deploy with HTTPS

### Option 1: Vercel (Easiest - Recommended)

1. **Push to GitHub** (already done ✓)

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository: `Akashrrrrd/LoginPro`
   - Click "Deploy"
   - Done! You'll get a HTTPS URL like: `https://login-pro.vercel.app`

3. **Test on Mobile**:
   - Open the Vercel URL on your phone
   - Camera will work! ✅

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

### Option 3: Local HTTPS (For Testing)

If you want to test locally on mobile with HTTPS:

1. **Install mkcert**:
   ```bash
   # Windows (with Chocolatey)
   choco install mkcert
   
   # Or download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Create local certificates**:
   ```bash
   mkcert -install
   mkcert localhost 192.168.x.x
   ```

3. **Update package.json**:
   ```json
   {
     "scripts": {
       "dev": "next dev --experimental-https"
     }
   }
   ```

4. **Access via**: `https://192.168.x.x:3000`

## 📱 Testing on Mobile

### After Deployment:

1. Open the HTTPS URL on your mobile browser
2. Click "SCAN PUZZLE"
3. Browser will ask: "Allow camera access?" → Click **Allow**
4. Camera should now work! 📸

### If Still Not Working:

**Check Browser Permissions**:
- **Chrome**: Settings → Site Settings → Camera → Allow
- **Safari**: Settings → Safari → Camera → Allow
- **Firefox**: Settings → Permissions → Camera → Allow

**Try Different Browser**:
- Chrome (recommended)
- Safari (iOS)
- Firefox

**Clear Cache**:
- Settings → Privacy → Clear browsing data

## 🔧 Environment Variables (Optional)

If you need to add environment variables:

Create `.env.local`:
```bash
# Add any API keys or config here
NEXT_PUBLIC_API_URL=https://your-api.com
```

## 📊 Monitoring

After deployment, you can monitor:
- **Vercel Dashboard**: Analytics, logs, performance
- **Browser Console**: Check for errors (F12 → Console)

## 🎯 Quick Deploy Commands

```bash
# Build locally
npm run build

# Test production build
npm start

# Deploy to Vercel (if CLI installed)
vercel --prod
```

## ⚠️ Common Issues

### Issue: "Camera not supported"
**Solution**: Make sure you're using HTTPS

### Issue: "Permission denied"
**Solution**: Check browser settings and allow camera

### Issue: "Camera already in use"
**Solution**: Close other apps using the camera

### Issue: Build fails
**Solution**: 
```bash
rm -rf node_modules .next
npm install
npm run build
```

## 🌐 Custom Domain (Optional)

After deploying to Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate is automatic! ✅

---

**Need Help?** Check the main [README.md](./README.md) or open an issue on GitHub.
