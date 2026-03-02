# App Store Submission Checklist

## Pre-Submission Status

**Last Updated:** March 2, 2026

---

## ✅ COMPLETED

### App Development
- [x] All screens implemented (Dashboard, Add, History, Settings, Entry Details, Edit)
- [x] SQLite persistence with migrations
- [x] OpenAI Vision API integration
- [x] Open Food Facts barcode scanning
- [x] Food presets for quick logging
- [x] Search functionality
- [x] Export (JSON/CSV)
- [x] Daily calorie/macro tracking
- [x] Custom goals
- [x] 7-day history with charts

### Testing
- [x] All 18 backend tests passing
- [x] TypeScript compiles without errors
- [x] Expo Doctor 17/17 checks passed
- [x] iOS export successful
- [x] Android export successful
- [x] Web PWA deployable

### App Configuration
- [x] app.json configured (name, version, bundle ID)
- [x] iOS permissions defined (camera, photo library)
- [x] Android permissions defined
- [x] EAS build profiles configured
- [x] App icons (1024x1024)
- [x] Splash screen
- [x] Adaptive icon (Android)

### Assets
- [x] App icon (icon.png)
- [x] Splash screen (splash.png)
- [x] Adaptive icon (adaptive-icon.png)
- [x] Favicon (favicon.png)
- [x] Screenshots (captured from live web app)
  - 01-dashboard.png (empty dashboard)
  - 02-dashboard-with-data.png (with food entries)
  - 03-add-entry.png (add food options)
  - 04-history.png (7-day history view)
  - 05-stats.png (statistics screen)
  - 06-settings.png (settings screen)
- [x] Feature Graphic for Google Play (feature-graphic.png - 1024x500)
- [x] Privacy Policy URL (https://foodlog-app.surge.sh/privacy)
- [x] Terms of Service URL (https://foodlog-app.surge.sh/terms)

### Documentation
- [x] README.md
- [x] PRIVACY_POLICY.md
- [x] TERMS_OF_SERVICE.md
- [x] STORE_LISTING.md
- [x] Daily memory log (memory/2026-03-02.md)

### Deployment
- [x] Backend API on Railway
- [x] Web PWA on Surge.sh
- [x] GitHub repository

---

## ⏳ PENDING (Requires User Action)

### EAS Setup
- [ ] Login to EAS: `npx eas login`
- [ ] Configure project: `npx eas project:configure`
- [ ] Note the projectId for app.json

### Apple App Store
- [ ] Create Apple Developer account ($99/year)
- [ ] Accept Apple Developer Agreement
- [ ] Create App ID with bundle identifier: `com.foodlog.app`
- [ ] Create App Store Connect app
- [ ] Generate iOS Distribution Certificate
- [ ] Create Provisioning Profile
- [ ] Run: `eas build --platform ios --profile production`
- [ ] Run: `eas submit --platform ios`
- [ ] Upload device screenshots (iPhone sizes)
- [ ] Fill App Store Connect listing
- [ ] Submit for review

### Google Play Store
- [ ] Create Google Play Console account ($25 one-time)
- [ ] Create app with package name: `com.foodlog.app`
- [ ] Create Service Account for EAS submit
- [ ] Download google-services.json
- [ ] Place google-services.json in mobile/ folder
- [ ] Run: `eas build --platform android --profile production`
- [ ] Run: `eas submit --platform android`
- [ ] Upload device screenshots (Phone + Tablet)
- [ ] Fill Google Play listing
- [ ] Submit for review

### Production Environment
- [ ] Add OpenAI API key to Railway environment
- [ ] Update backend URL in mobile app if changed

---

## 📋 Store Listing Requirements

### iOS App Store
| Item | Required | Status |
|------|----------|--------|
| App Name | ✅ | FoodLog - Calorie & Food Tracker |
| Subtitle | ✅ | AI-powered nutrition tracking |
| Description | ✅ | See STORE_LISTING.md |
| Keywords | ✅ | See STORE_LISTING.md |
| Category | ✅ | Health & Fitness |
| Age Rating | ✅ | 4+ |
| Privacy Policy URL | ✅ | Required - have copy |
| Screenshots | ✅ | Have web screenshots (device preferred) |
| App Icon | ✅ | 1024x1024 |
| Support URL | ✅ | GitHub issues |

### Google Play Store
| Item | Required | Status |
|------|----------|--------|
| App Name | ✅ | FoodLog |
| Short Description | ✅ | 80 chars |
| Full Description | ✅ | See STORE_LISTING.md |
| Category | ✅ | Health & Fitness |
| Age Rating | ✅ | Everyone |
| Privacy Policy URL | ✅ | Required - have copy |
| Screenshots | ✅ | Have web screenshots (device preferred) |
| App Icon | ✅ | 512x512+ |
| Feature Graphic | ✅ | 1024x500 created |

---

## 🚀 Build Commands (When Ready)

```bash
# iOS
cd mobile
npx eas login
npx eas build --platform ios --profile production
npx eas submit --platform ios

# Android
npx eas build --platform android --profile production
npx eas submit --platform android

# Both
npx eas build --platform all --profile production
npx eas submit --platform all
```

---

## 📱 Screenshot Sizes Needed

### iOS (at least one required)
- iPhone 6.7": 1290 x 2796 px
- iPhone 6.5": 1242 x 2688 px
- iPhone 5.5": 1242 x 2208 px

### Android
- Phone: 1080 x 1920 px minimum
- 7" Tablet: 1080 x 1920 px
- 10" Tablet: 1080 x 1920 px

---

## 🔗 Important URLs

- **Backend API:** https://api-production-6869.up.railway.app
- **Web PWA:** https://foodlog-app.surge.sh
- **GitHub:** https://github.com/twilson63/food-log

---

## 📝 Notes

- Backend uses SQLite with WAL mode for reliability
- OpenAI Vision works in mock mode without API key
- App works fully offline once loaded
- All data stored locally by default
- No account required to use the app