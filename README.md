# adx-convert-browser
React Native app to have an all-in-one interface for searching and downloading songs/charts converted from the maimai arcade games for AstroDX.

The song database ([songs.json](/songs.json)) is built with the scripts in [adx-convert-db](/trustytrojan/adx-convert-db). Currently it is "hard-coded" into the app, but in the future I'll add the ability for the app to download a `songs.json` from my webserver so that I can update it if necessary with new convert data.

## Installing/Running the app

### Android
APKs are built on every commit with GitHub Actions. You can download the latest build [here](https://nightly.link/trustytrojan/adx-convert-browser/workflows/build-android/master/android-build.zip).

### iOS/iPadOS
Since I don't own a new enough Mac, and I don't want to give Apple my personal info, I'm going to be hosting a tunneled Expo development server. This means you can simply install [Expo Go from the App Store](https://apps.apple.com/us/app/expo-go/id982107779), scan the QR code below (whenever it is there) with the Camera app, and the app should download and run within Expo Go.

## Development
Have Node.js and NPM installed, then run `npm i`. Run the Expo dev server with `npx expo`.

### Build for Android
I only built an APK on Linux, but given that Android tooling is available for all OSes, you can follow these steps.

1. Get [sdkmanager](https://developer.android.com/tools/sdkmanager) on your system.
2. Install the necessary packages with `sdkmanager`:
   ```sh
   sdkmanager 'build-tools;35.0.0' 'build-tools;36.0.0' 'cmake;3.22.1' 'ndk;27.1.12297006' 'platforms;android-36'
   ```
3. Run `expo prebuild -p android` to let Expo generate the Android build environment.
4. Run `cd android` then `./gradlew assemble`. The APK is located at `android/app/build/outputs/apk/release/app-release.apk` relative to the project root.

## To-Do List
- Expand the app to list & download fanmade charts with the [Majdata-Online](https://majdata.net/) API
  - Base URL: `https://majdata.net/api3/api/maichart`
  - List/Search endpoint: `/list?sort=<|likep|commp|playp>&page=0&search=<query>`
  - Download endpoints: `/<song-id>/<track|chart|video>`
- Maybe switch to [NativeScript](https://nativescript.org/) once you're familiar with it, though this will be a big workload
