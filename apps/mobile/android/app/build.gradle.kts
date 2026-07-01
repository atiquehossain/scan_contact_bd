import java.net.URI
import java.util.Base64

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val noNumQrApplicationId = providers.gradleProperty("NONUMQR_APPLICATION_ID")
    .orElse(providers.environmentVariable("NONUMQR_APPLICATION_ID"))
    .orElse("com.nexgenscript.nonumqr")
    .get()

fun flutterDartDefines(): Map<String, String> {
    val encodedDefines = providers.gradleProperty("dart-defines").orNull.orEmpty()
    if (encodedDefines.isBlank()) return emptyMap()

    return encodedDefines.split(",")
        .filter { it.isNotBlank() }
        .mapNotNull { encodedDefine ->
            val define = try {
                String(Base64.getDecoder().decode(encodedDefine), Charsets.UTF_8)
            } catch (_: IllegalArgumentException) {
                encodedDefine
            }

            val separatorIndex = define.indexOf("=")
            if (separatorIndex < 1) {
                null
            } else {
                define.substring(0, separatorIndex) to define.substring(separatorIndex + 1)
            }
        }
        .toMap()
}

fun validateHttpsDartDefine(dartDefines: Map<String, String>, name: String) {
    val value = dartDefines[name]?.trim()
    if (value.isNullOrEmpty()) {
        throw GradleException(
            "$name must be provided with --dart-define for release builds.",
        )
    }

    val uri = runCatching { URI(value) }.getOrNull()
    if (uri?.scheme == null || uri.host.isNullOrBlank()) {
        throw GradleException("$name must be an absolute HTTPS URL.")
    }

    if (!uri.scheme.equals("https", ignoreCase = true)) {
        throw GradleException("$name must use https:// for release builds.")
    }
}

tasks.register("validateReleaseDartDefines") {
    group = "verification"
    description = "Requires production HTTPS URLs for Flutter release builds."

    doLast {
        val dartDefines = flutterDartDefines()
        validateHttpsDartDefine(dartDefines, "API_BASE_URL")
        validateHttpsDartDefine(dartDefines, "WEB_BASE_URL")
    }
}

val releaseConfigTaskNames = setOf(
    "preReleaseBuild",
    "compileFlutterBuildRelease",
    "assembleRelease",
    "bundleRelease",
)

tasks.matching { it.name in releaseConfigTaskNames }.configureEach {
    dependsOn("validateReleaseDartDefines")
}

android {
    namespace = "com.nexgenscript.nonumqr"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // Override before publishing; the Play Store application ID is permanent.
        // The local default matches the checked-in Firebase google-services.json.
        applicationId = noNumQrApplicationId
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["usesCleartextTraffic"] = "false"
    }

    buildTypes {
        debug {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
        }

        release {
            manifestPlaceholders["usesCleartextTraffic"] = "false"
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
