# Smart Trade Tracker - Application Android

Application Android native WebView pour Smart Trade Tracker.

## Prérequis

- **Java JDK 17** ou supérieur
- **Android Studio** (optionnel, pour le développement)
- **Android SDK** avec API level 34

## Configuration initiale

Avant la première compilation, vous devez générer le fichier `gradle-wrapper.jar` :

```bash
cd android-app

# Option 1: Si Gradle est installé globalement
gradle wrapper

# Option 2: Télécharger manuellement
# Téléchargez gradle-wrapper.jar depuis:
# https://github.com/gradle/gradle/raw/v8.4.0/gradle/wrapper/gradle-wrapper.jar
# Et placez-le dans: gradle/wrapper/gradle-wrapper.jar
```

## Compilation

### Debug APK

```bash
cd android-app
chmod +x gradlew
./gradlew assembleDebug
```

L'APK sera généré dans: `app/build/outputs/apk/debug/app-debug.apk`

### Release APK

```bash
./gradlew assembleRelease
```

L'APK sera généré dans: `app/build/outputs/apk/release/app-release-unsigned.apk`

## Structure du projet

```
android-app/
├── gradlew                 # Script Gradle pour Unix/macOS
├── gradlew.bat             # Script Gradle pour Windows
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties
├── settings.gradle         # Configuration du projet
├── build.gradle            # Build script racine
├── app/
│   ├── build.gradle        # Build script de l'application
│   ├── proguard-rules.pro  # Règles ProGuard
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/smarttradetracker/app/
│       │   ├── MainActivity.kt
│       │   └── SplashActivity.kt
│       └── res/
│           ├── layout/
│           ├── values/
│           ├── drawable/
│           └── mipmap-*/
└── README.md
```

## Personnalisation de l'icône

Pour remplacer l'icône de l'application:

1. Générez des icônes adaptatives avec [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)
2. Remplacez les fichiers dans les dossiers `mipmap-*`

## Sécurité

L'application inclut:
- ✅ HTTPS uniquement (pas de cleartext)
- ✅ Validation des certificats SSL
- ✅ Whitelist des domaines autorisés
- ✅ Protection contre les injections JavaScript
- ✅ Configuration réseau sécurisée

## Support

URL de l'application: https://smarttradetracker.lovable.app
