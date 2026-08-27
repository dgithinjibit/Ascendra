# Deployment Checklist - SyncSenta

**Status**: Ready for Initial Deployment
**Last Updated**: Implementation Phase Complete

---

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Create Supabase project
- [ ] Run database migration (`supabase/migrations/001_core_schema.sql`)
- [ ] Get Supabase credentials (URL, anon key, service role key)
- [ ] Get Groq API key
- [ ] Create Upstash Redis database (optional for production)
- [ ] Set up environment variables in `.env.local`

### 2. Dependencies
- [ ] Run `npm install` in `studio/` directory
- [ ] Verify all packages installed successfully
- [ ] Check for security vulnerabilities (`npm audit`)

### 3. Local Testing
- [ ] Start development server (`npm run dev`)
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test chat functionality
- [ ] Test progress tracking
- [ ] Verify data persists in Supabase
- [ ] Test rate limiting
- [ ] Test offline mode (disable network in DevTools)

### 4. Build Verification
- [ ] Run production build (`npm run build`)
- [ ] Check for build errors
- [ ] Verify bundle size (<200KB gzipped target)
- [ ] Test production build locally (`npm start`)

---

## 🚀 Deployment Steps

### Option A: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production-ready deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set **Root Directory** to `studio`
   - Add environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
     GROQ_API_KEY=gsk_...
     GROQ_MODEL=llama-3.3-70b-versatile
     UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io (optional)
     UPSTASH_REDIS_REST_TOKEN=xxxxx (optional)
     ```
   - Click "Deploy"

3. **Configure Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

4. **Enable Analytics** (Optional)
   - Go to Project Settings → Analytics
   - Enable Vercel Analytics
   - Enable Web Vitals monitoring

### Option B: Self-Hosted

1. **Build for Production**
   ```bash
   cd studio
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **Use Process Manager** (PM2 recommended)
   ```bash
   npm install -g pm2
   pm2 start npm --name "syncsenta" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Reverse Proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **SSL Certificate** (Let's Encrypt)
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🔧 Post-Deployment Configuration

### 1. Supabase Configuration

**Enable Google OAuth** (if using):
1. Go to Supabase → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials from Google Cloud Console
4. Add authorized redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://your-project.supabase.co/auth/v1/callback`

**Configure Email Templates**:
1. Go to Supabase → Authentication → Email Templates
2. Customize confirmation email
3. Customize password reset email
4. Add your branding

**Set up RLS Policies** (already done in migration):
- Verify policies are active
- Test with different user roles

### 2. Monitoring Setup

**Sentry** (Error Tracking):
```bash
# Add to .env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**PostHog** (Analytics):
```bash
# Add to .env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 3. Performance Optimization

**Enable Caching**:
- Vercel automatically caches static assets
- Configure CDN for images (Vercel Image Optimization)

**Database Optimization**:
- Enable Supabase connection pooling
- Set up read replicas (if needed)
- Monitor query performance

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Check error rate (Sentry dashboard)
- [ ] Monitor API response times
- [ ] Review user feedback
- [ ] Check rate limit hits

### Weekly Checks
- [ ] Review user growth metrics
- [ ] Analyze engagement data (PostHog)
- [ ] Check database size and performance
- [ ] Review and respond to user feedback

### Monthly Checks
- [ ] Security audit (npm audit, Snyk)
- [ ] Dependency updates
- [ ] Performance optimization review
- [ ] Cost analysis (Supabase, Groq, Upstash)
- [ ] Backup verification

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Verify all three Supabase env vars are set in Vercel/production environment.

### Issue: "Rate limit exceeded" errors
**Solution**: 
- Check Upstash Redis is configured
- Verify Redis credentials are correct
- Consider increasing rate limits for premium users

### Issue: "Failed to fetch" in chat
**Solution**:
- Verify Groq API key is valid
- Check Groq API status
- Review API usage limits

### Issue: Users can't sign up
**Solution**:
- Check Supabase email settings
- Verify email confirmation is enabled/disabled as intended
- Check SMTP configuration if using custom email

### Issue: PWA not installing
**Solution**:
- Verify manifest.json is accessible
- Check service worker registration
- Ensure HTTPS is enabled
- Test on different browsers

---

## 🔐 Security Checklist

- [ ] All API keys are in environment variables (not hardcoded)
- [ ] Service role key is NEVER exposed to browser
- [ ] RLS policies are enabled on all tables
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Input validation is in place
- [ ] SQL injection protection (using Supabase client)
- [ ] XSS protection (React escapes by default)
- [ ] CSRF protection (Next.js handles this)

---

## 📈 Success Metrics to Track

### Technical Metrics
- Uptime: Target 99.9%
- API response time: Target <200ms (p95)
- Error rate: Target <0.1%
- Lighthouse score: Target 90+ (all categories)

### User Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- Retention rate (Day 1, Day 7, Day 30)
- Average session duration
- Messages per user per day

### Business Metrics
- Sign-up conversion rate
- Free-to-paid conversion rate
- Churn rate
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Net Promoter Score (NPS)

---

## 🎯 Launch Day Checklist

### T-1 Week
- [ ] Complete all testing
- [ ] Prepare marketing materials
- [ ] Set up support channels
- [ ] Train support team
- [ ] Prepare FAQ document

### T-1 Day
- [ ] Final production deployment
- [ ] Smoke test all critical paths
- [ ] Verify monitoring is active
- [ ] Prepare incident response plan
- [ ] Schedule team availability

### Launch Day
- [ ] Monitor error rates closely
- [ ] Watch server performance
- [ ] Respond to user feedback quickly
- [ ] Track key metrics in real-time
- [ ] Be ready to rollback if needed

### T+1 Day
- [ ] Review launch metrics
- [ ] Address critical issues
- [ ] Collect user feedback
- [ ] Plan immediate improvements

---

## 📞 Support Contacts

- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
- **Groq Support**: https://console.groq.com/support
- **Upstash Support**: https://upstash.com/support

---

## 🔄 Rollback Plan

If critical issues arise:

1. **Immediate Rollback** (Vercel):
   - Go to Deployments
   - Find last stable deployment
   - Click "Promote to Production"

2. **Database Rollback** (if needed):
   - Supabase has automatic backups
   - Go to Database → Backups
   - Restore to previous point

3. **Communication**:
   - Post status update
   - Notify users via email/social media
   - Provide ETA for fix

---

## ✅ Final Pre-Launch Verification

Run through this checklist one final time before going live:

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Authentication working (email + Google)
- [ ] Chat functionality working
- [ ] Progress tracking working
- [ ] Rate limiting active
- [ ] PWA installable
- [ ] Offline mode working
- [ ] Mobile responsive
- [ ] Error tracking active
- [ ] Analytics tracking active
- [ ] Backup system verified
- [ ] Support channels ready
- [ ] Documentation complete

---

**Ready to launch? Let's go! 🚀**

For questions or issues, refer to SETUP_GUIDE.md or IMPLEMENTATION_PROGRESS.md.
