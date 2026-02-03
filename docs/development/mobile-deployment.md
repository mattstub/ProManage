# Mobile Deployment Guide

## Overview

Guide for building and deploying ProManage mobile app to iOS App Store and Google Play Store using Expo Application Services (EAS).

## Prerequisites

### EAS CLI

```bash
npm install -g eas-cli

# Login to Expo account
eas login
```

### Apple Developer Account

- Enrolled in Apple Developer Program ($99/year)
- Have Apple ID with Admin role
- Two-factor authentication enabled

### Google Play Developer Account

- Google Play Developer account ($25 one-time)
- Access to Google Play Console

## EAS Configuration

### 1. Initialize EAS

```bash
cd apps/mobile

# Configure EAS
eas build:configure
```

This creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "bundler": "metro"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEF1234"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 2. App Configuration

Update `app.json`:

```json
{
  "expo": {
    "name": "ProManage",
    "slug": "promanage",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.promanage.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app requires camera access for photo documentation.",
        "NSPhotoLibraryUsageDescription": "This app needs access to your photos.",
        "NSLocationWhenInUseUsageDescription": "This app requires location for GPS tagging."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.promanage.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos for documentation."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow ProManage to use your location for GPS tagging."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## iOS Deployment

### 1. Apple Developer Setup

**Create App ID:**
1. Go to [developer.apple.com](https://developer.apple.com)
2. Certificates, IDs & Profiles > Identifiers
3. Create new App ID
4. Bundle ID: `com.promanage.app`
5. Enable capabilities: Push Notifications, Sign in with Apple (if needed)

**Create App Store Connect App:**
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps > + > New App
3. Fill in app information
4. Bundle ID: Select the one created above

### 2. Build for iOS

```bash
# Development build (for testing)
eas build --platform ios --profile development

# Production build (for App Store)
eas build --platform ios --profile production
```

**Build Process:**
1. EAS uploads your code
2. Builds on EAS servers
3. Signs with Apple certificates (auto-managed)
4. Provides download link

### 3. TestFlight Distribution

**Option 1: EAS Submit**
```bash
# Submit to TestFlight
eas submit --platform ios

# Or automatically after build
eas build --platform ios --profile production --auto-submit
```

**Option 2: Manual Upload**
1. Download IPA from EAS
2. Open Transporter app (macOS)
3. Upload IPA to App Store Connect
4. Wait for processing
5. Add to TestFlight

**Add Testers:**
1. App Store Connect > TestFlight
2. Internal Testing or External Testing
3. Add testers by email

### 4. App Store Submission

**Prepare App Store Listing:**
1. App Store Connect > App Information
2. Fill in:
   - Name
   - Subtitle
   - Description
   - Keywords
   - Support URL
   - Marketing URL
   - Screenshots (required sizes)
   - App Preview videos (optional)
   - Privacy Policy URL

**Submit for Review:**
1. Create new version
2. Upload build from TestFlight
3. Fill in "What's New in This Version"
4. Select content ratings
5. Submit for review

**Review Time:**
- Usually 24-48 hours
- Can take up to 1 week

## Android Deployment

### 1. Google Play Console Setup

**Create App:**
1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app
3. Fill in app details

**Create Service Account:**
1. Google Cloud Console
2. IAM & Admin > Service Accounts
3. Create service account
4. Grant "Service Account User" role
5. Create JSON key
6. Save as `service-account-key.json`

### 2. Build for Android

```bash
# Development build (APK)
eas build --platform android --profile development

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

**Build Types:**
- **APK**: For direct installation/testing
- **AAB** (Android App Bundle): For Play Store (recommended)

### 3. Internal Testing

```bash
# Submit to Internal Testing track
eas submit --platform android

# Specify track
eas submit --platform android --track internal
```

**Tracks:**
- `internal`: Internal testing (up to 100 testers)
- `alpha`: Closed testing
- `beta`: Open or closed testing
- `production`: Production release

**Add Testers:**
1. Google Play Console > Testing > Internal testing
2. Create email list
3. Add tester emails
4. Share opt-in link

### 4. Production Release

**Prepare Store Listing:**
1. Store Listing section
2. Fill in:
   - App name
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (various sizes)
   - Feature graphic
   - App icon
   - Privacy Policy URL

**Content Rating:**
1. Complete questionnaire
2. Get rating (Everyone, Teen, etc.)

**Submit for Review:**
1. Release > Production
2. Create new release
3. Upload AAB
4. Add release notes
5. Review and rollout

**Review Time:**
- Initial review: Can take several days
- Updates: Usually within hours

## Environment Variables

### Production Secrets

**DO NOT commit secrets to git!**

Use EAS Secrets:

```bash
# Add secret
eas secret:create --scope project --name API_KEY --value abc123

# List secrets
eas secret:list

# Delete secret
eas secret:delete --name API_KEY
```

**Use in app.json:**
```json
{
  "expo": {
    "extra": {
      "apiUrl": process.env.API_URL,
      "apiKey": process.env.API_KEY
    }
  }
}
```

**Access in app:**
```typescript
import Constants from 'expo-constants'

const apiUrl = Constants.expoConfig?.extra?.apiUrl
```

## Version Management

### Versioning Strategy

Follow semantic versioning: `MAJOR.MINOR.PATCH`

**iOS (app.json):**
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

**Android (app.json):**
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

**Incrementing:**
- `version`: User-facing version (1.0.0 → 1.0.1)
- `buildNumber` (iOS): Auto-increment each build
- `versionCode` (Android): Must increase each build

### Automated Versioning

```bash
# Use EAS Build to auto-increment
eas build --platform ios --auto-increment

# Or in eas.json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

## Over-the-Air (OTA) Updates

### EAS Update

For JS/asset changes (no native code):

```bash
# Configure EAS Update
eas update:configure

# Publish update
eas update --branch production --message "Fix: Daily report bug"

# Publish to specific channel
eas update --channel production --message "New feature"
```

**Limitations:**
- Only JS and assets
- Native code changes require new build
- Users must reopen app

### Update Configuration

```json
// app.json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/your-project-id",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/mobile-deploy.yml
name: Mobile Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - uses: pnpm/action-setup@v2

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: |
          cd apps/mobile
          pnpm install

      - name: Build iOS
        run: |
          cd apps/mobile
          eas build --platform ios --profile production --non-interactive

      - name: Build Android
        run: |
          cd apps/mobile
          eas build --platform android --profile production --non-interactive

      - name: Submit to stores
        run: |
          cd apps/mobile
          eas submit --platform all --profile production --non-interactive
```

## App Icons & Splash Screens

### Requirements

**App Icon:**
- Size: 1024x1024px
- Format: PNG
- No transparency
- No rounded corners (iOS handles this)

**Splash Screen:**
- Size: 1242x2688px (largest iPhone)
- Format: PNG
- Will be resized for different devices

**Generate Assets:**
```bash
# Using figma-export or similar
# Or manually create in assets/
```

## Troubleshooting

### Build Failures

```bash
# View build logs
eas build:list

# View specific build
eas build:view <build-id>

# Clear cache
eas build --platform ios --clear-cache
```

### Common Issues

**iOS Code Signing:**
- EAS handles automatically
- Check Apple Developer account status
- Verify bundle ID matches

**Android Build Errors:**
- Check `versionCode` is incrementing
- Verify service account permissions
- Check package name is unique

**OTA Update Not Working:**
- Verify runtime version compatibility
- Check update channel configuration
- Ensure app is reopened (not backgrounded)

## Monitoring

### Sentry Error Tracking

```bash
pnpm add @sentry/react-native
```

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: 'your-sentry-dsn',
  enableInExpoDevelopment: false,
  debug: __DEV__,
})
```

### Analytics

```typescript
import * as Analytics from 'expo-firebase-analytics'

// Track screen views
Analytics.logEvent('screen_view', {
  screen_name: 'Projects',
})

// Track events
Analytics.logEvent('project_created', {
  project_id: '123',
})
```

## Best Practices

### Pre-Release Checklist

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test all critical user flows
- [ ] Verify API endpoints (production)
- [ ] Test offline functionality
- [ ] Check app icon and splash screen
- [ ] Review app store screenshots
- [ ] Update version numbers
- [ ] Write release notes
- [ ] Tag release in git

### Store Optimization (ASO)

**App Name:**
- Clear and descriptive
- Include primary keyword if possible
- Max 30 characters (iOS), 50 (Android)

**Keywords (iOS):**
- Comma-separated
- No spaces after commas
- 100 character limit
- Research competitor keywords

**Description:**
- Front-load important information
- Use bullet points
- Include keywords naturally
- Call to action

**Screenshots:**
- Show key features
- Use captions
- Consistent branding
- Multiple device sizes

---

**Last Updated**: 2026-02-02
**Status**: Complete
