/*
 * ============================================================================
 * RetrofitClient.kt – Singleton que configura e fornece o Retrofit
 * ============================================================================
 * Decisão: Padrão Singleton para garantir que existe apenas uma instância
 * do Retrofit e do OkHttpClient em toda a aplicação.
 *
 * Inclui:
 * - Logging interceptor para debug (mostra pedidos/respostas no Logcat)
 * - AuthInterceptor para adicionar token JWT automaticamente
 * - Timeout de 30 segundos (adequado para redes móveis lentas)
 * - Converter Gson para serialização/deserialização JSON
 *
 * A URL base é definida como BuildConfig.API_BASE_URL, configurada
 * no build.gradle.kts (10.0.2.2 para emulador, IP real para dispositivo).
 * ============================================================================
 */

package com.atec.gestao.data.api

import android.content.Context
import com.atec.gestao.BuildConfig
import com.atec.gestao.data.local.TokenManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    // Instância do ApiService (lazy – criada apenas quando necessária)
    private var apiService: ApiService? = null

    /**
     * Obtém a instância do ApiService, criando-a se necessário.
     * @param context Contexto Android para aceder ao DataStore
     * @return ApiService configurado com autenticação e logging
     */
    fun getApiService(context: Context): ApiService {
        if (apiService == null) {
            // Logging interceptor – mostra pedidos HTTP no Logcat para debug
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            // Token manager para obter o JWT do DataStore
            val tokenManager = TokenManager(context)

            // Auth interceptor – adiciona Bearer token a todos os pedidos
            val authInterceptor = AuthInterceptor(tokenManager)

            // Configurar OkHttpClient com interceptors e timeouts
            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)      // Primeiro: adiciona token
                .addInterceptor(loggingInterceptor)    // Segundo: faz log (com token)
                .connectTimeout(30, TimeUnit.SECONDS)  // Timeout de conexão
                .readTimeout(30, TimeUnit.SECONDS)     // Timeout de leitura
                .writeTimeout(30, TimeUnit.SECONDS)    // Timeout de escrita
                .build()

            // Construir Retrofit com URL base e conversor Gson
            val retrofit = Retrofit.Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            apiService = retrofit.create(ApiService::class.java)
        }
        return apiService!!
    }
}
