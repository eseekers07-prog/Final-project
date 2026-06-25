# Pet Owner Mobile App (Kotlin / Jetpack Compose)

Native Android app for the Pet Owner role of the Vet Clinic Management System.
Targets Android 13 (API 33), minimum Android 8 (API 26).

## How to open
1. Open Android Studio (Hedgehog or later recommended).
2. **File → Open** → select this `PetOwnerApp` folder.
3. Let Gradle sync (it will download the Gradle 8.4 wrapper automatically).
4. Run on an emulator (API 26+) or device.

## Before running against your real server
Edit the base URL here:

```
app/src/main/java/com/vetclinic/petowner/data/remote/RetrofitClient.kt
```

```kotlin
private const val BASE_URL = "https://your-vet-clinic-domain.com/"
```

- If testing against a PHP server running on your own machine via the Android
  **emulator**, use `http://10.0.2.2:8000/` (maps to your machine's localhost).
- If testing on a **physical device** on the same Wi-Fi, use your machine's
  LAN IP, e.g. `http://192.168.1.50:8000/`.
- `usesCleartextTraffic="false"` is set in the manifest — switch it to `true`
  temporarily for local HTTP testing, or better, set up HTTPS even for local dev.

## Backend addition required
The web app never exposed a plain "list all vets" endpoint (the existing
`manage-vets.html` is admin-only and write-focused). The booking flow's
**Select Vet** step needs one, so a new file is included:

```
backend_addon/vets.php
```

Copy it into your existing PHP project at `backend/api/vets.php`. It reuses
your existing `Database` and `AuthGuard` classes — no schema changes needed.

## Project structure

```
PetOwnerApp/
├── app/
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/vetclinic/petowner/
│       │   ├── MainActivity.kt
│       │   ├── PetOwnerApp.kt              (Application class — initializes RetrofitClient)
│       │   ├── data/
│       │   │   ├── model/Models.kt          (Pet, Appointment, HealthRecord, etc.)
│       │   │   ├── remote/ApiService.kt     (Retrofit interface)
│       │   │   ├── remote/RetrofitClient.kt
│       │   │   ├── remote/PersistentCookieJar.kt  (PHP session persistence)
│       │   │   └── repository/PetOwnerRepository.kt
│       │   └── ui/
│       │       ├── theme/Theme.kt
│       │       ├── navigation/NavGraph.kt    (bottom nav + screen routes)
│       │       ├── auth/                     (Login screen + SessionViewModel)
│       │       ├── home/                     (Dashboard)
│       │       ├── pets/                     (My Pets list)
│       │       ├── booking/                  (3-step appointment booking)
│       │       ├── records/                  (Medical timeline)
│       │       └── profile/                  (Logout)
│       └── res/
├── backend_addon/vets.php   (copy into your PHP backend/api/)
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Known backend quirks intentionally preserved
The field names below are kept exactly as-is to match your existing PHP API
without requiring backend changes:
- `resone` (typo for "reason") on appointments
- `adminstered_vet_id` (typo for "administered") on vaccinations

## Still to wire up for production
- Real vet **availability** (the time-slot screen currently shows fixed hours,
  not actual open slots)
- "Add Pet" form screen (FAB on My Pets is wired to a callback but no modal yet)
- Push notification scheduling for vaccination due dates
