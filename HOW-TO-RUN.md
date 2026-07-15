# 🚀 AstroTalk — How to Run & Test the Apps Correctly

AstroTalk is a monorepo containing **1 Backend Server** and **3 Expo Mobile Apps** (User, Admin, Astrologer/Partner).

---

## 📱 1. How to Open the Apps on Your Phone (Using Expo Go)

The APK files named `Expo-Go-57.0.2.apk` in the folder are **not** the standalone AstroTalk apps; they are the **Expo Go** runner application. Expo Go is used to load and run your apps during development.

### Step-by-Step Instructions:
1. **Install Expo Go on your Android Phone**:
   - Install `Expo-Go-57.0.2.apk` on your phone, or download "Expo Go" directly from the Google Play Store.
2. **Connect to the Same WiFi**:
   - Ensure your **PC/Laptop** and your **Phone** are connected to the **same Wi-Fi network**.
   - *Tip: Disable Mobile Data on your phone to prevent routing issues.*
3. **Start the Apps**:
   - Double-click **`START-EVERYTHING.bat`** at the root folder.
   - This script will:
     1. Automatically detect your PC's WiFi IP address.
     2. Update `.env` files with your local server IP.
     3. Start the Backend API Server (running on port `5000`).
     4. Start the User App Metro Bundler (running on port `8081`).
   - If you want to start the **Astrologer** or **Admin** apps, run their specific batch files:
     - **`START-EXPO-ASTRO.bat`** (Astrologer App, port `8083`)
     - **`START-EXPO-ADMIN.bat`** (Admin App, port `8082`)
4. **Open the Apps in Expo Go**:
   - Open the **Expo Go** app on your phone.
   - Scan the QR code printed in the terminal window, or choose **"Enter URL manually"** and enter:
     - **User App**: `exp://YOUR_PC_IP:8081` (e.g., `exp://192.168.1.5:8081`)
     - **Astrologer App**: `exp://YOUR_PC_IP:8083` (e.g., `exp://192.168.1.5:8083`)
     - **Admin App**: `exp://YOUR_PC_IP:8082` (e.g., `exp://192.168.1.5:8082`)

---

## ⚡ Login slow? (30–60 seconds)

Most common cause: apps point at **Render free tier** (`https://astro-app-ru1d.onrender.com/api`). Free dynos **sleep after idle**; first request wakes them (30–90s).

### Fastest for daily testing (recommended)
1. Double-click **`START-EVERYTHING.bat`** — sets LAN IP in `.env` + starts local server + Expo.
2. Phone + PC same Wi‑Fi.
3. Expo Go se open karo.

Dev mode ab **local PC API prefer** karta hai (Render HTTPS se pehle), isliye login 1–2 sec me hona chahiye.

### Agar APK / cloud API use kar rahe ho
- Login screen pe status dikhega: *“Render server wake ho raha hai…”*
- Pehli login slow normal hai; uske baad 15 min tak fast rehta hai.
- Permanent fast cloud chahiye to Render pe **paid always-on** plan ya external uptime ping lagao.

### Force cloud API from Expo (optional)
`.env` me:
```
EXPO_PUBLIC_FORCE_REMOTE=1
EXPO_PUBLIC_API_URL=https://astro-app-ru1d.onrender.com/api
```

---

## 💬 2. Chat & Calling Test Flow

We have verified that the chat and calling signaling code is fully integrated. Here is how they work and how to test them:

### A. Chat Consultation (Fully Working)
1. **User requests chat**:
   - Open the **User App**, select an astrologer, and tap **"Chat"**.
   - Submit the birth details and click **"Send Chat Request"**.
   - The user screen will enter the waiting state ("Waiting for astrologer...").
2. **Astrologer accepts**:
   - Ensure the **Astrologer App** is running, logged in, and set to **"Online"** (via the toggle on the dashboard).
   - The astrologer will receive a WhatsApp-style popup banner showing the incoming request.
   - The astrologer taps **"Accept"**.
3. **Chat Session Live**:
   - The user's screen will automatically refresh, and the chat window will open.
   - Both can now exchange real-time messages and media (photos/videos).

### B. Voice/Video Calling (Soft Live Mode & Native SDK)
* **Soft Live Mode (Expo Go / Test Mode)**:
  - Because **Expo Go** does not contain custom native binaries like the Agora Voice/Video SDK, we have implemented a fallback **Soft Live Mode** for safe testing.
  - When the User starts a call and the Astrologer accepts, the call screen opens, the call timer ticks, and the session status is handled correctly. However, **no real audio will be transmitted** because the native Agora SDK is omitted in Expo Go.
* **Real Call Audio (Custom APK Build)**:
  - To test real voice and video transmission, you need to build custom standalone APKs (using `npm run user:apk` / `npm run astro:apk` via EAS Build).
  - Standalone builds compile the native Agora SDK code directly into the APKs. Note that building custom APKs requires an Expo account and proper Google service configuration.

---

## 🛠️ 3. Standalone APKs Crash on Open (instant close)

### Root cause (v1.0.2 builds)
`react-native-agora` was re-linked into User + Astrologer APKs. On **React Native 0.86 / Expo 57**, loading Agora’s native `.so` libraries often **kills the app immediately on launch** (before any JS error screen).

### Fix (v1.0.3+)
Agora is **disabled for stability** in both apps:
1. `package.json` → `expo.autolinking.exclude: ["react-native-agora"]`
2. `react-native.config.js` → Android/iOS platforms set to `null`
3. `metro.config.js` → stubs `react-native-agora` as an empty module

Apps open normally. Chat works. Calls use **soft live mode** (UI + timer + session) without real RTC audio until a compatible Agora build is re-enabled later.

### What you must do after this fix
1. **Uninstall** the old crashing APK completely from the phone.
2. Build a **new** APK: `npm run user:apk` / `npm run astro:apk` (or EAS profile `apk`).
3. Install the new **v1.0.3** APK and open it.

### Expo Go (dev) — if the project won’t open
1. PC + phone same Wi‑Fi; mobile data off.
2. Run `START-EVERYTHING.bat` (User) or `START-EXPO-ASTRO.bat` (Partner).
3. Open **Expo Go** → scan QR or enter `exp://YOUR_PC_IP:8081` / `:8083`.
4. If Metro fails: `npx expo start -c` inside `user-panel` or `astro-app`.

### Other historical crash notes
1. **Stale cache after folder move**: clear with `-c --clear` (batch scripts do this).
2. **R8 minify**: our configs keep minify/shrink **off** on Android release for stability.
