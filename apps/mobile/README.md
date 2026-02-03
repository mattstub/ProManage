# ProManage Mobile App

Mobile companion app built with React Native and Expo for iOS and Android, focused on field tasks.

## Overview

The ProManage mobile app provides field workers with essential tools for daily operations (10% of use cases). It focuses on time tracking, photo documentation, daily reports, and real-time communication with the office.

## Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: Expo Router
- **UI Components**: NativeWind (Tailwind for RN)
- **State Management**: Zustand + React Query
- **Offline Storage**: AsyncStorage + WatermelonDB
- **Real-Time**: Socket.io Client

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Expo CLI
- iOS Simulator (macOS) or Android Emulator
- Running API server (see [apps/api](../api/README.md))

### Installation

```bash
# From project root
cd apps/mobile

# Install dependencies
pnpm install

# iOS only: Install pods
cd ios && pod install && cd ..

# Copy environment file
cp .env.example .env

# Start Expo dev server
pnpm start
```

### Running on Devices

```bash
# iOS Simulator
pnpm ios

# Android Emulator
pnpm android

# Physical device (scan QR code with Expo Go app)
pnpm start
```

## Development

### Available Scripts

```bash
# Development
pnpm start        # Start Expo dev server
pnpm ios          # Run on iOS simulator
pnpm android      # Run on Android emulator
pnpm web          # Run in web browser (limited)

# Testing & Quality
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript checking
pnpm test         # Run tests
pnpm test:e2e     # Run E2E tests with Detox

# Build & Deploy
pnpm build:ios    # Build iOS app with EAS
pnpm build:android # Build Android app with EAS
pnpm submit       # Submit to app stores
```

### Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `EXPO_PUBLIC_API_URL` - API server URL
- `EXPO_PUBLIC_WS_URL` - WebSocket server URL
- `EXPO_PUBLIC_ENV` - Environment

**Note**: For iOS simulator use `http://localhost:3001`
For Android emulator use `http://10.0.2.2:3001`

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens
│   ├── (tabs)/            # Tab navigation
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # React components
├── hooks/                 # Custom hooks
├── services/              # API clients, storage
├── stores/                # Zustand stores
├── utils/                 # Utility functions
├── constants/             # App constants
├── assets/                # Images, fonts
├── app.json               # Expo configuration
└── eas.json              # EAS Build configuration
```

## Key Features

### Field-Focused Tasks

- **Time Tracking**: Quick clock in/out with GPS
- **Photo Documentation**: Capture and upload with auto-tagging
- **Daily Reports**: End-of-day summaries
- **Real-Time Updates**: Instant sync with office

### Offline Capabilities

- Works offline for critical features
- Auto-sync when connection restored
- Local data persistence

### Mobile-Specific

- Camera integration
- GPS tagging
- Push notifications
- Biometric authentication

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires simulator/emulator)
pnpm test:e2e:ios
pnpm test:e2e:android

# With coverage
pnpm test:coverage
```

## Building & Deployment

### Development Builds

```bash
# iOS development build
eas build --profile development --platform ios

# Android development build
eas build --profile development --platform android
```

### Production Builds

```bash
# iOS production build
eas build --profile production --platform ios

# Android production build
eas build --profile production --platform android
```

### Submission to Stores

```bash
# Submit to both stores
eas submit --platform all

# Or individually
eas submit --platform ios
eas submit --platform android
```

## Over-the-Air Updates

```bash
# Publish OTA update (JS/assets only)
eas update --branch production --message "Bug fix"
```

## Debugging

### Common Issues

**Metro bundler cache:**
```bash
pnpm start --clear
```

**iOS build issues:**
```bash
cd ios
pod install
cd ..
```

**Android build issues:**
```bash
cd android
./gradlew clean
cd ..
```

## Documentation

- [Mobile Setup Guide](../../docs/development/mobile-setup.md)
- [Mobile Testing Guide](../../docs/development/mobile-testing.md)
- [Mobile Deployment Guide](../../docs/development/mobile-deployment.md)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
