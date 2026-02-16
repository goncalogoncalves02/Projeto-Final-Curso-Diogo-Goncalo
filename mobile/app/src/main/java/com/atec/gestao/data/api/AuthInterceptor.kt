/*
 * ============================================================================
 * AuthInterceptor.kt – Interceptor OkHttp para autenticação JWT
 * ============================================================================
 * Decisão: Usar um interceptor OkHttp para adicionar automaticamente
 * o header "Authorization: Bearer {token}" a TODOS os pedidos HTTP.
 *
 * Isto evita ter de passar o token manualmente em cada chamada à API,
 * centralizando a lógica de autenticação num único local.
 *
 * O token é lido do TokenManager (DataStore) de forma síncrona
 * usando runBlocking, o que é aceitável num interceptor OkHttp
 * porque já executa noutra thread.
 * ============================================================================
 */

package com.atec.gestao.data.api

import com.atec.gestao.data.local.TokenManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val tokenManager: TokenManager
) : Interceptor {

    /**
     * Interceta cada pedido HTTP e adiciona o token JWT ao header.
     * Se não houver token guardado (utilizador não autenticado),
     * o pedido é enviado sem o header Authorization.
     */
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()

        // Obter o token guardado no DataStore
        // runBlocking é seguro aqui porque estamos na thread de rede do OkHttp
        val token = runBlocking {
            tokenManager.token.first()
        }

        // Se existe token, adicionar ao header Authorization
        return if (token != null) {
            val authenticatedRequest = request.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            chain.proceed(authenticatedRequest)
        } else {
            // Sem token – enviar pedido sem autenticação (ex: login)
            chain.proceed(request)
        }
    }
}
