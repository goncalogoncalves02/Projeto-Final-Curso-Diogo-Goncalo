/*
 * ============================================================================
 * TokenManager.kt – Gestão segura do token JWT com DataStore
 * ============================================================================
 * Decisão: Usar Jetpack DataStore em vez de SharedPreferences porque:
 * 1. DataStore é assíncrono (não bloqueia a UI thread)
 * 2. É type-safe e não sofre de problemas de concorrência
 * 3. É a solução recomendada pela Google para armazenamento de preferências
 *
 * O token JWT é guardado aqui após um login bem-sucedido e é lido
 * automaticamente pelo AuthInterceptor para adicionar aos pedidos HTTP.
 *
 * Também guarda dados básicos do utilizador (nome, email, role)
 * para mostrar no dashboard sem necessidade de chamada extra à API.
 * ============================================================================
 */

package com.atec.gestao.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

// Extensão para criar o DataStore como propriedade do Context
// O nome "atec_prefs" identifica o ficheiro de preferências
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "atec_prefs")

class TokenManager(private val context: Context) {

    companion object {
        // Chaves para os dados guardados no DataStore
        private val TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
        private val USER_ROLE_KEY = stringPreferencesKey("user_role")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_AVATAR_KEY = stringPreferencesKey("user_avatar_url")
    }

    // === Flows reativos para observar mudanças nos dados ===

    /** Flow do token JWT – emite null se não autenticado */
    val token: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[TOKEN_KEY]
    }

    /** Flow do nome do utilizador */
    val userName: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_NAME_KEY]
    }

    /** Flow do email do utilizador */
    val userEmail: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_EMAIL_KEY]
    }

    /** Flow do role do utilizador (admin, professor, estudante, secretaria) */
    val userRole: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_ROLE_KEY]
    }

    /** Flow do ID do utilizador */
    val userId: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_ID_KEY]
    }

    /** Flow do avatar URL do utilizador (URI local ou URL do backend) */
    val userAvatarUrl: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_AVATAR_KEY]
    }

    // === Operações de escrita ===

    /**
     * Guarda o token JWT no DataStore.
     * Chamado após login bem-sucedido.
     */
    suspend fun saveToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
        }
    }

    /**
     * Guarda os dados do utilizador no DataStore.
     * Chamado após obter os dados com GET /auth/me.
     */
    suspend fun saveUserData(name: String, email: String, role: String, id: Int) {
        context.dataStore.edit { prefs ->
            prefs[USER_NAME_KEY] = name
            prefs[USER_EMAIL_KEY] = email
            prefs[USER_ROLE_KEY] = role
            prefs[USER_ID_KEY] = id.toString()
        }
    }

    /**
     * Guarda o URL do avatar do utilizador.
     * Pode ser um URI local (galeria) ou URL do backend.
     */
    suspend fun saveAvatarUrl(url: String) {
        context.dataStore.edit { prefs ->
            prefs[USER_AVATAR_KEY] = url
        }
    }

    /**
     * Remove todos os dados guardados (token e dados do utilizador).
     * Chamado no logout – garante que não ficam dados residuais.
     */
    suspend fun clearAll() {
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
