# Mobile Development Setup

## Overview

ProManage mobile app is built with React Native and Expo for iOS and Android platforms.

## Prerequisites

### Required Software

**Node.js** (v20+)
```bash
node --version
```

**pnpm** (v8+)
```bash
pnpm --version
```

**Expo CLI**
```bash
npm install -g expo-cli eas-cli
```

**Watchman** (macOS/Linux)
```bash
# macOS
brew install watchman

# Linux
# Follow: https://facebook.github.io/watchman/docs/install.html
```

### iOS Development (macOS only)

**Xcode** (latest version)
- Install from Mac App Store
- Open Xcode and accept license agreement
- Install Command Line Tools:
  ```bash
  xcode-select --install
  ```

**iOS Simulator**
- Included with Xcode
- Open Xcode > Preferences > Components > Download simulators

**CocoaPods**
```bash
sudo gem install cocoapods
```

### Android Development

**Android Studio**
- Download from: https://developer.android.com/studio
- Install Android SDK
- Install Android Virtual Device (AVD)

**Environment Variables**
Add to `~/.zshrc` or `~/.bashrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Java Development Kit (JDK)**
```bash
# macOS
brew install openjdk@17

# Verify
java --version
```

## Project Setup

### 1. Install Dependencies

```bash
# From project root
cd apps/mobile
pnpm install
```

### 2. iOS Pod Install

```bash
# macOS only
cd ios
pod install
cd ..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env`:
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_WS_URL=ws://localhost:3001
EXPO_PUBLIC_ENV=development
```

**Note**: For iOS simulator, use `http://localhost:3001`
For Android emulator, use `http://10.0.2.2:3001`

## Running the App

### Expo Go (Quick Start)

```bash
cd apps/mobile

# Start Expo dev server
pnpm start

# Or with specific options
pnpm start --clear
```

**Options:**
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on physical device

### iOS Simulator

```bash
# Start iOS simulator directly
pnpm ios

# Or specify device
pnpm ios --simulator="iPhone 15 Pro"
```

### Android Emulator

```bash
# Start Android emulator (must be running first)
pnpm android

# Or specify emulator
pnpm android --device "Pixel_7_Pro"
```

### Physical Devices

**iOS:**
1. Install Expo Go from App Store
2. Ensure device on same WiFi network
3. Scan QR code from terminal

**Android:**
1. Install Expo Go from Play Store
2. Ensure device on same WiFi network
3. Scan QR code from terminal

## Development Workflow

### Hot Reload

Changes automatically reload in app:
- Fast Refresh for React components
- Full reload for native code changes

```bash
# Trigger reload manually
Press 'r' in terminal
```

### Debug Menu

**iOS Simulator:**
- Cmd + D

**Android Emulator:**
- Cmd + M (macOS)
- Ctrl + M (Windows/Linux)

**Physical Device:**
- Shake device

**Options:**
- Reload
- Open Debugger
- Toggle Element Inspector
- Toggle Performance Monitor

### Debugging

**React DevTools:**
```bash
# Terminal
Press 'j' to open debugger
```

**Flipper:**
```bash
# Install Flipper
brew install --cask flipper

# Run app in development mode
# Flipper will auto-connect
```

**Chrome DevTools:**
1. Open debug menu
2. Select "Debug Remote JS"
3. Open `chrome://inspect` in Chrome

### Logs

**View logs:**
```bash
# iOS
pnpm ios --device-log

# Android
pnpm android --device-log

# Or use separate terminals
npx react-native log-ios
npx react-native log-android
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth-related screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # React components
├── hooks/                 # Custom hooks
├── services/              # API clients, storage
├── stores/                # State management
├── utils/                 # Utility functions
├── constants/             # App constants
├── assets/                # Images, fonts
├── app.json               # Expo configuration
├── package.json
└── tsconfig.json
```

## Expo Router

### File-based Routing

```typescript
// app/index.tsx - Home screen
export default function HomeScreen() {
  return <View><Text>Home</Text></View>
}

// app/projects/[id].tsx - Dynamic route
import { useLocalSearchParams } from 'expo-router'

export default function ProjectScreen() {
  const { id } = useLocalSearchParams()
  return <Text>Project {id}</Text>
}
```

### Navigation

```typescript
import { useRouter, Link } from 'expo-router'

function MyComponent() {
  const router = useRouter()

  // Programmatic navigation
  router.push('/projects/123')
  router.back()

  // Or use Link component
  return <Link href="/projects/123">View Project</Link>
}
```

## State Management

### Zustand for Global State

```typescript
// stores/auth-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

### React Query for Server State

```typescript
// hooks/useProjects.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  })
}
```

## Offline Storage

### AsyncStorage (Key-Value)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Store data
await AsyncStorage.setItem('key', 'value')
await AsyncStorage.setItem('user', JSON.stringify(user))

// Retrieve data
const value = await AsyncStorage.getItem('key')
const user = JSON.parse(await AsyncStorage.getItem('user') || '{}')

// Remove data
await AsyncStorage.removeItem('key')

// Clear all
await AsyncStorage.clear()
```

### WatermelonDB (Local Database)

For complex offline data:

```typescript
// models/Project.ts
import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export class Project extends Model {
  static table = 'projects'

  @field('name') name!: string
  @field('status') status!: string
  @field('budget') budget!: number
  @date('created_at') createdAt!: Date
}
```

## Native Modules

### Camera

```typescript
import * as ImagePicker from 'expo-image-picker'

async function takePictureture() {
  // Request permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') return

  // Take photo
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  })

  if (!result.canceled) {
    const uri = result.assets[0].uri
    // Upload photo
  }
}
```

### Location

```typescript
import * as Location from 'expo-location'

async function getLocation() {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') return

  // Get current location
  const location = await Location.getCurrentPositionAsync({})
  console.log(location.coords)
}
```

### Push Notifications

```typescript
import * as Notifications from 'expo-notifications'

// Request permission
const { status } = await Notifications.requestPermissionsAsync()

// Get push token
const token = (await Notifications.getExpoPushTokenAsync()).data

// Listen for notifications
Notifications.addNotificationReceivedListener((notification) => {
  console.log(notification)
})
```

## Styling

### NativeWind (Tailwind for React Native)

```typescript
import { View, Text } from 'react-native'

export function MyComponent() {
  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-lg font-bold">Hello</Text>
    </View>
  )
}
```

### StyleSheet

```typescript
import { StyleSheet, View, Text } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
})

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  )
}
```

## Performance

### List Optimization

```typescript
import { FlashList } from '@shopify/flash-list'

function ProjectList({ projects }: Props) {
  return (
    <FlashList
      data={projects}
      renderItem={({ item }) => <ProjectCard project={item} />}
      estimatedItemSize={100}
      keyExtractor={(item) => item.id}
    />
  )
}
```

### Image Optimization

```typescript
import { Image } from 'expo-image'

function ProjectPhoto({ uri }: Props) {
  return (
    <Image
      source={{ uri }}
      placeholder={blurhash}
      contentFit="cover"
      transition={200}
      style={{ width: 200, height: 200 }}
    />
  )
}
```

## Troubleshooting

### Clear Cache

```bash
# Clear Metro bundler cache
pnpm start --clear

# Clear watchman
watchman watch-del-all

# Clear node_modules
rm -rf node_modules
pnpm install

# iOS: Clear pods
cd ios
rm -rf Pods
pod install
```

### iOS Build Issues

```bash
# Clean Xcode build
cd ios
xcodebuild clean

# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

### Android Build Issues

```bash
# Clean Gradle
cd android
./gradlew clean

# Reset AVD
# Delete and recreate in Android Studio
```

### Metro Bundler Port Conflict

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or specify different port
pnpm start --port 8082
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://expo.github.io/router/docs/)

---

**Last Updated**: 2026-02-02
**Status**: Complete
