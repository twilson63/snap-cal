# FoodLog App Store Submission Guide

## Current Status

✅ Backend API deployed (Railway): https://api-production-2c2c.up.railway.app
✅ Vision API configured with OpenAI GPT-4o-mini
✅ Mobile app code ready (Expo 52)
✅ Privacy Policy ready
✅ Terms of Service ready
✅ App icons generated (icon.png, splash.png, adaptive-icon.png)
✅ Screenshots captured (web-based, see assets/screenshots/)
✅ Store listing copy ready (STORE_LISTING.md)

⚠️ **Requires user action:**
- EAS login and project linking
- Apple App Store Connect setup
- Google Play Console setup
- Final device screenshots

---

## Phase 1: EAS Project Setup

### Step 1.1: Login to EAS
```bash
cd mobile
npx eas login
```

### Step 1.2: Configure Project
```bash
npx eas project:configure
```

This will:
- Create a new EAS project (or link existing)
- Update `app.json` with the correct `projectId`
- Enable EAS Update and Build services

### Step 1.3: Update eas.json
After project configuration, update `eas.json` with your Apple ID:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com"
      }
    }
  }
}
```

---

## Phase 2: App Store Connect (iOS)

### Step 2.1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Name**: FoodLog - AI Calorie Tracker
   - **Primary Language**: English
   - **Bundle ID**: com.foodlog.app
   - **SKU**: foodlog
   - **Platforms**: iOS

### Step 2.2: App Information

- **Category**: Health & Fitness
- **Content Rights**: No, does not contain third-party content
- **Age Rating**: 4+ (no objectionable content)

### Step 2.3: Privacy Policy URL
Host the privacy policy at: `https://foodlog.app/privacy` (or use a GitHub Pages URL)

You can temporarily use: `https://raw.githubusercontent.com/YOUR_USERNAME/food-log/main/mobile/PRIVACY_POLICY.md`

### Step 2.4: Build and Submit iOS

```bash
cd mobile
npx eas build --platform ios --profile production
```

Wait for build to complete, then:

```bash
npx eas submit --platform ios
```

### Step 2.5: App Store Screenshots (iOS Required)

Required device sizes:
- 6.7" (iPhone 15 Pro Max): 1290 x 2796 px
- 6.5" (iPhone 11 Pro Max, 14 Plus): 1242 x 2688 px
- 5.5" (iPhone 8 Plus): 1242 x 2208 px

**Generate screenshots:**
The easiest way is using the iOS Simulator:
```bash
# Run on simulator
npx expo run:ios

# Take screenshots with Cmd+S or using simctl
xcrun simctl io booted screenshot screenshot-name.png
```

---

## Phase 3: Google Play Console (Android)

### Step 3.1: Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - **App name**: FoodLog - AI Calorie Tracker
   - **Language**: English (US)
   - **Free or paid**: Free
   - **Availability**: All countries (or select specific)

### Step 3.2: App Content

- **Privacy Policy URL**: https://foodlog.app/privacy
- **App access**: All functionality is available to all users
- **Ads**: No, this app does not contain ads
- **Target audience**: All ages
- **News apps**: No

### Step 3.3: Content Rating

Complete the questionnaire:
- Category: Health & Fitness
- No violence, profanity, sexual content, etc.
- Should receive "Everyone" rating

### Step 3.4: Build and Submit Android

```bash
cd mobile
npx eas build --platform android --profile production
```

Wait for build to complete, then:

```bash
npx eas submit --platform android
```

Or download the AAB and upload manually.

### Step 3.5: Store Listing (Android)

- **Short description** (80 chars max): 
  "AI-powered food tracker: snap a photo, get instant calorie & macro estimates"

- **Full description**:
  See STORE_LISTING.md

- **Screenshots**: 
  - Phone: 1080 x 1920 px (at least 2 screenshots, max 8)
  - 7" Tablet: 1080 x 1920 px (optional)
  - 10" Tablet: 1080 x 1920 px (optional)

---

## Phase 4: Post-Submission

### iOS Review Timeline
- Typically 24-48 hours for first submission
- May take longer if additional questions

### Android Review Timeline
- Typically 1-3 days for new apps
- May be faster for subsequent updates

### Common Rejection Reasons to Avoid

1. **Missing privacy policy URL** - Must be accessible
2. **Crashes on launch** - Test thoroughly
3. **Camera/photo permissions unclear** - Ensure permission text is user-friendly
4. **Misleading app description** - Be accurate
5. **Broken functionality** - Ensure API is accessible

---

## Quick Commands Reference

```bash
# Start development
cd mobile && npm start

# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android

# Build for production (iOS)
npx eas build --platform ios --profile production

# Build for production (Android)
npx eas build --platform android --profile production

# Build for both platforms
npx eas build --platform all --profile production

# Submit to App Store
npx eas submit --platform ios

# Submit to Google Play
npx eas submit --platform android

# Check build status
npx eas build:list

# Update app ( OTA )
npx eas update --branch production
```

---

## Files Checklist

### App Configuration
- [x] `app.json` - Expo config
- [x] `eas.json` - EAS build profiles
- [x] `package.json` - Dependencies

### Assets
- [x] `assets/icon.png` - App icon (1024x1024)
- [x] `assets/splash.png` - Splash screen (1284x2778)
- [x] `assets/adaptive-icon.png` - Android adaptive icon (1024x1024)
- [x] `assets/favicon.png` - Web favicon
- [ ] `assets/screenshots/` - Device screenshots (need to generate from device)

### Legal
- [x] `PRIVACY_POLICY.md`
- [x] `TERMS_OF_SERVICE.md`

### Store Listing
- [x] `STORE_LISTING.md` - Copy for both stores

---

## Support URLs

If you don't have a website, you can use:
- **Privacy Policy**: Host on GitHub Pages or S3
- **Support URL**: GitHub issues page
- **Marketing URL**: Optional

Example GitHub Pages setup:
1. Create a gh-pages branch
2. Add privacy.html and terms.html
3. Enable GitHub Pages in repo settings

---

## Troubleshooting

### Build Fails
- Check `npx eas build:list` for error logs
- Ensure all dependencies are compatible
- Check for native module issues

### iOS Submission Fails
- Verify Apple ID in eas.json
- Check bundle identifier matches App Store Connect
- Ensure certificates are valid

### Android Submission Fails
- Verify package name matches Play Console
- Check AAB file is correctly signed
- Ensure version codes are incremented

### API Connection Issues
- Verify API URL in `.env.production`
- Ensure CORS is configured on backend
- Test API health endpoint: `/health`

---

## Need Help?

- EAS Documentation: https://docs.expo.dev/build/introduction/
- App Store Connect Help: https://help.apple.com/app-store-connect/
- Google Play Console Help: https://support.google.com/googleplay/android-developer/