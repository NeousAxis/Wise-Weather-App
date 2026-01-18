# Mobile Store Deployment Guide (iOS & Android)

This guide outlines the necessary steps to ensure your **Notifications** and **Deep Links** (e.g., clicking a quote notification to open the Contribution Modal) work perfectly when you publish **Wise Weather** to the Apple App Store and Google Play Store.

## 1. The Technology: Capacitor
Since Wise Weather is a modern React/Vite application, the best way to publish it as a native mobile app is using **Capacitor**.

### Setup (When you are ready):
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/app
npx cap init
```

---

## 2. Essential Code Change for Deep Linking
The current web logic (`window.location.search`) works for Cold Starts (app closed). However, for an app running in the background on iOS/Android, you often need an active **Listener**.

**Copy/Paste this logic into `index.tsx` when you start the mobile migration:**

### Step A: Import the Plugin
```typescript
import { App as CapacitorApp } from '@capacitor/app'; // npm install @capacitor/app
```

### Step B: Add the Listener in `App()` component
Update your existing `useEffect` in `index.tsx` (where `handleUrlParams` is presently located) to include this native listener:

```typescript
  useEffect(() => {
    // 1. Existing Web Logic (Keep this for PWA/Web)
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'contribution') {
        const select = params.get('select');
        if (select) setInitialSelection(select);
        setShowContribution(true);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    handleUrlParams();
    setTimeout(handleUrlParams, 500);

    // 2. NEW: Native Deep Link Listener (For App Store / Play Store)
    const setupNativeListener = async () => {
      CapacitorApp.addListener('appUrlOpen', (data: any) => {
        // data.url contains the full link (e.g., "wiseweather://?action=contribution")
        console.log('App opened with URL:', data.url);
        
        // Check if the URL contains our target action
        if (data.url.includes('action=contribution')) {
            // Extract optional params if needed
            if (data.url.includes('select=Sunny')) setInitialSelection('Sunny');
            // ... check other conditions ...

            // Force open the modal
            setShowContribution(true);
        }
      });
    };

    setupNativeListener();

    // ... existing visibility change listeners ...
  }, []);
```

---

## 3. Configuration for Stores

### iOS (`Info.plist`)
To allow your app to open from standard links (Universal Links), add your domain:
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:wise-weather-app.web.app</string>
</array>
```

### Android (`AndroidManifest.xml`)
To capture links, inside the `<activity>` tag:
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="wise-weather-app.web.app" />
</intent-filter>
```

---

**Summary:**
Keep this file safe. When you are ready to build the `.ipa` (iOS) or `.apk` (Android), applying **Step 2** will guarantee that your users are seamlessly redirected to the Contribution screen every morning!
