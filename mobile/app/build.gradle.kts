/*
 * ============================================================================
 * build.gradle.kts (app) – Módulo principal da aplicação Android
 * ============================================================================
 * Decisão: Usar View-based UI (Activities + XML) em vez de Jetpack Compose
 * porque o enunciado pede explicitamente "multiplas activities" e
 * "passagem de dados entre activities", que é a abordagem clássica Android.
 *
 * Dependências principais:
 * - Retrofit: Comunicação com a API FastAPI do backend
 * - Gson: Serialização/deserialização JSON
 * - Glide: Carregamento eficiente de imagens (incluindo da galeria)
 * - DataStore: Armazenamento seguro do token JWT
 * - Material 3: Design visual moderno
 * - Coroutines: Operações assíncronas sem bloquear a UI thread
 * ============================================================================
 */

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.atec.gestao"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.atec.gestao"
        minSdk = 26          // Android 8.0 – cobre 95%+ dos dispositivos
        targetSdk = 34       // Android 14 – versão mais recente
        versionCode = 1
        versionName = "1.0"

        // URL base da API – usar 10.0.2.2 para emulador (mapeia para localhost da máquina)
        // Em dispositivo físico, substituir pelo IP real do servidor
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8000\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    // Habilita ViewBinding para acesso type-safe aos layouts XML
    // Evita findViewById() e reduz erros de null pointer
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // === Android Core ===
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // === UI: Material Design 3 ===
    // Decisão: Material 3 para um visual moderno e consistente
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("androidx.recyclerview:recyclerview:1.3.2")

    // === Rede: Retrofit + OkHttp ===
    // Decisão: Retrofit é a biblioteca padrão para APIs REST em Android
    // OkHttp logging interceptor facilita o debug das chamadas à API
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // === Serialização JSON ===
    implementation("com.google.code.gson:gson:2.10.1")

    // === Imagens: Glide ===
    // Decisão: Glide para carregamento eficiente de imagens (cache, resize)
    // Também suporta carregamento de imagens da galeria (requisito bonus)
    implementation("com.github.bumptech.glide:glide:4.16.0")
    annotationProcessor("com.github.bumptech.glide:compiler:4.16.0")

    // === Armazenamento Local: DataStore ===
    // Decisão: DataStore (substituto moderno de SharedPreferences)
    // para guardar o token JWT de forma segura e assíncrona
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // === Coroutines ===
    // Decisão: Coroutines para chamadas assíncronas à API
    // sem bloquear a thread principal (evita ANR)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}
