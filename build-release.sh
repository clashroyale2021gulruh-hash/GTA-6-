#!/bin/bash
set -e

export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export ANDROID_HOME="/app/applet/.tools/android-sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo "=== 1. Checking Java & Compiler ==="
java -version
javac -version

echo "=== 2. Configuring Android SDK ==="
echo "sdk.dir=$ANDROID_HOME" > /app/applet/android/local.properties

echo "=== 3. Ensuring Release Keystore ==="
if [ ! -f /app/applet/android/app/release.keystore ]; then
    keytool -genkey -v -keystore /app/applet/android/app/release.keystore \
        -alias gta6release -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass gta6releasepass -keypass gta6releasepass \
        -dname "CN=GTA6 Companion, OU=Mobile, O=GTA6, L=ViceCity, S=Florida, C=US"
fi

echo "=== 4. Building Web App Asset Bundle ==="
npm run build
npx cap sync android

echo "=== 5. Building Release APK via Gradle ==="
chmod +x /app/applet/android/gradlew
bash /app/applet/android/gradlew -p /app/applet/android assembleRelease --stacktrace

echo "=== 6. Copying APK to public/downloads for user web download ==="
mkdir -p /app/applet/public/downloads
cp /app/applet/android/app/build/outputs/apk/release/*.apk /app/applet/public/downloads/gta6-companion-release.apk

echo "=== 7. Finished successfully! ==="
ls -lh /app/applet/public/downloads/gta6-companion-release.apk
