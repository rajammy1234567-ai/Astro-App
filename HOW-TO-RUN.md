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

## 🛠️ 3. Standalone APKs Crash Issue (Why it happens and how to fix it)
If you built standalone APKs previously and they crashed on launch ("open-band"):
1. **Stale Cache / Location Change**:
   - If you moved the folder (e.g., from Desktop to a different directory), the old Metro build cache was pointing to the old paths. Clean the cache by running the packagers with the `-c --clear` flags (which our batch scripts do automatically).
2. **Proguard/R8 Obfuscation**:
   - In production release builds, the code shrinker (R8) obfuscates native classes. Since Agora RTC utilizes native C++ binaries (`.so` files), you must add Proguard rules to prevent these classes from being removed.
   - We can help you add these configurations to your build profile if you are ready to configure EAS builds.
