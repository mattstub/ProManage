# Mobile Testing Guide

## Overview

Testing strategy for ProManage mobile app includes unit tests, component tests, integration tests, and E2E tests.

## Testing Stack

- **Jest**: Test runner (bundled with Expo)
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing
- **jest-expo**: Expo-specific test utilities

## Setup

### Install Dependencies

```bash
cd apps/mobile

# Testing dependencies already in package.json
pnpm install
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/.expo/**',
  ],
}
```

### Jest Setup File

```typescript
// jest-setup.ts
import '@testing-library/jest-native/extend-expect'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(() => ({
    status: 'granted',
  })),
}))

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => ({
    status: 'granted',
  })),
  getCurrentPositionAsync: jest.fn(() => ({
    coords: {
      latitude: 37.78825,
      longitude: -122.4324,
    },
  })),
}))
```

## Running Tests

### All Tests

```bash
cd apps/mobile

# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Specific Tests

```bash
# Run specific test file
pnpm test Button.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="should render"

# Update snapshots
pnpm test -u
```

## Unit Testing

### Testing Utilities

```typescript
// utils/format-date.test.ts
import { formatDate } from './format-date'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2026-02-02T10:00:00Z')
    expect(formatDate(date)).toBe('Feb 2, 2026')
  })

  it('should handle invalid date', () => {
    expect(formatDate(null)).toBe('Invalid Date')
  })
})
```

### Testing Hooks

```typescript
// hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  it('should handle login error', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('test@example.com', 'wrong')
    })

    expect(result.current.error).toBeDefined()
  })
})
```

## Component Testing

### Basic Component

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Button } from './Button'

describe('Button', () => {
  it('should render with label', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeTruthy()
  })

  it('should call onPress when pressed', () => {
    const onPress = jest.fn()
    render(<Button onPress={onPress}>Click me</Button>)

    fireEvent.press(screen.getByText('Click me'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    const onPress = jest.fn()
    render(<Button disabled onPress={onPress}>Click me</Button>)

    const button = screen.getByText('Click me')
    fireEvent.press(button)

    expect(onPress).not.toHaveBeenCalled()
  })

  it('should show loading state', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByTestId('loading-indicator')).toBeTruthy()
  })
})
```

### Component with Navigation

```typescript
// screens/ProjectScreen.test.tsx
import { render, screen } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { ProjectScreen } from './ProjectScreen'

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  )
}

describe('ProjectScreen', () => {
  it('should render project details', () => {
    const route = {
      params: { projectId: '123' },
    }

    renderWithNavigation(<ProjectScreen route={route} />)
    expect(screen.getByText('Project Details')).toBeTruthy()
  })
})
```

### Component with API

```typescript
// screens/ProjectListScreen.test.tsx
import { render, screen, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProjectListScreen } from './ProjectListScreen'
import * as api from '@/services/api'

jest.mock('@/services/api')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('ProjectListScreen', () => {
  it('should display projects', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' },
    ]

    ;(api.getProjects as jest.Mock).mockResolvedValue(mockProjects)

    render(<ProjectListScreen />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeTruthy()
      expect(screen.getByText('Project 2')).toBeTruthy()
    })
  })

  it('should show loading state', () => {
    ;(api.getProjects as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    )

    render(<ProjectListScreen />, { wrapper: createWrapper() })
    expect(screen.getByTestId('loading-indicator')).toBeTruthy()
  })

  it('should show error state', async () => {
    ;(api.getProjects as jest.Mock).mockRejectedValue(
      new Error('Network error')
    )

    render(<ProjectListScreen />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeTruthy()
    })
  })
})
```

### Snapshot Testing

```typescript
// components/ProjectCard.test.tsx
import { render } from '@testing-library/react-native'
import { ProjectCard } from './ProjectCard'

describe('ProjectCard', () => {
  it('should match snapshot', () => {
    const project = {
      id: '1',
      name: 'Test Project',
      status: 'active',
    }

    const { toJSON } = render(<ProjectCard project={project} />)
    expect(toJSON()).toMatchSnapshot()
  })
})
```

## E2E Testing (Detox)

### Setup Detox

```bash
# Install Detox CLI
npm install -g detox-cli

# Install dependencies
cd apps/mobile
pnpm add -D detox jest
```

### Detox Configuration

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/ProManage.app',
      build: 'xcodebuild -workspace ios/ProManage.xcworkspace -scheme ProManage -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_Pro',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
}
```

### E2E Test Example

```typescript
// e2e/login.test.ts
import { device, element, by, expect as detoxExpect } from 'detox'

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should show login screen', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible()
  })

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com')
    await element(by.id('password-input')).typeText('password123')
    await element(by.id('login-button')).tap()

    await detoxExpect(element(by.id('dashboard-screen'))).toBeVisible()
  })

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com')
    await element(by.id('password-input')).typeText('wrong')
    await element(by.id('login-button')).tap()

    await detoxExpect(element(by.text('Invalid credentials'))).toBeVisible()
  })
})
```

### Running E2E Tests

```bash
# Build app for testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug

# Android
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug
```

### E2E Best Practices

**Use testID:**
```typescript
<TextInput
  testID="email-input"
  placeholder="Email"
/>

<TouchableOpacity testID="login-button">
  <Text>Login</Text>
</TouchableOpacity>
```

**Wait for elements:**
```typescript
await waitFor(element(by.id('project-list')))
  .toBeVisible()
  .withTimeout(5000)
```

**Scroll to element:**
```typescript
await element(by.id('project-list')).scrollTo('bottom')
await element(by.id('project-list')).scroll(200, 'down')
```

## Mocking

### Mock Async Storage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

beforeEach(() => {
  AsyncStorage.clear()
})

it('should store data', async () => {
  await AsyncStorage.setItem('key', 'value')
  const value = await AsyncStorage.getItem('key')
  expect(value).toBe('value')
})
```

### Mock Navigation

```typescript
const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}))

it('should navigate to project screen', () => {
  render(<ProjectCard project={project} />)
  fireEvent.press(screen.getByText('View Details'))
  expect(mockNavigate).toHaveBeenCalledWith('Project', { id: '123' })
})
```

### Mock Native Modules

```typescript
// Mock camera
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    })
  ),
}))

// Mock location
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 37.78825, longitude: -122.4324 },
    })
  ),
}))
```

## Test Coverage

### Generate Coverage Report

```bash
pnpm test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

```javascript
// jest.config.js
module.exports = {
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/mobile-test.yml
name: Mobile Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: |
          cd apps/mobile
          pnpm install

      - name: Run tests
        run: |
          cd apps/mobile
          pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/mobile/coverage/coverage-final.json
```

## Debugging Tests

### Debug in VS Code

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/mobile/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--watchAll=false"
      ],
      "cwd": "${workspaceFolder}/apps/mobile",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debugging Tips

```typescript
// Use screen.debug() to print component tree
it('should render', () => {
  render(<MyComponent />)
  screen.debug() // Prints entire tree
  screen.debug(screen.getByTestId('my-element')) // Prints specific element
})

// Use console.log in tests
it('should work', () => {
  const result = myFunction()
  console.log('Result:', result)
  expect(result).toBe(expected)
})
```

## Best Practices

### Do's

- ✅ Test user behavior, not implementation
- ✅ Use testID for E2E test selectors
- ✅ Mock external dependencies
- ✅ Test error states
- ✅ Test loading states
- ✅ Keep tests simple and focused
- ✅ Use descriptive test names

### Don'ts

- ❌ Don't test third-party libraries
- ❌ Don't test styles
- ❌ Don't share state between tests
- ❌ Don't use timeouts instead of waitFor
- ❌ Don't test implementation details
- ❌ Don't write brittle selectors

---

**Last Updated**: 2026-02-02
**Status**: Complete
