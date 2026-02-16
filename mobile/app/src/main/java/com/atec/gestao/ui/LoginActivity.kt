/*
 * ============================================================================
 * LoginActivity.kt – Ecrã de autenticação (ponto de entrada da app)
 * ============================================================================
 * Decisão: Esta é a launcher activity (primeira a abrir).
 * Implementa login com email/password using OAuth2 (POST /auth/token).
 *
 * Fluxo:
 * 1. Verificar se já existe token guardado → ir direto ao Dashboard
 * 2. Utilizador insere credenciais → validar campos
 * 3. Chamar API de login → guardar token no DataStore
 * 4. Obter dados do utilizador (GET /auth/me) → guardar no DataStore
 * 5. Navegar para MainActivity (Dashboard)
 *
 * Coroutines são usadas para chamadas assíncronas à API.
 * lifecycleScope garante que as coroutines são canceladas ao destruir a activity.
 * ============================================================================
 */

package com.atec.gestao.ui

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.atec.gestao.R
import com.atec.gestao.data.api.RetrofitClient
import com.atec.gestao.data.local.TokenManager
import com.atec.gestao.databinding.ActivityLoginBinding
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    // ViewBinding – acesso type-safe aos elementos do layout
    private lateinit var binding: ActivityLoginBinding
    private lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)

        // Verificar se já tem sessão ativa (token guardado)
        checkExistingSession()

        // Configurar botão de login
        binding.btnLogin.setOnClickListener {
            performLogin()
        }
    }

    /**
     * Verifica se existe um token JWT guardado.
     * Se sim, navega diretamente para o Dashboard sem pedir credenciais.
     * Isto melhora a experiência do utilizador (não precisa de fazer login cada vez).
     */
    private fun checkExistingSession() {
        lifecycleScope.launch {
            val token = tokenManager.token.first()
            if (token != null) {
                navigateToMain()
            }
        }
    }

    /**
     * Executa o processo de login:
     * 1. Valida campos (email e password não vazios, email válido)
     * 2. Chama POST /auth/token com as credenciais
     * 3. Em caso de sucesso, guarda token e dados do user
     * 4. Navega para o Dashboard
     */
    private fun performLogin() {
        // Limpar erros anteriores
        binding.tvError.visibility = View.GONE
        binding.tilEmail.error = null
        binding.tilPassword.error = null

        // Obter valores dos campos
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        // Validar campo email
        if (email.isEmpty()) {
            binding.tilEmail.error = getString(R.string.error_empty_email)
            return
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = getString(R.string.error_invalid_email)
            return
        }

        // Validar campo password
        if (password.isEmpty()) {
            binding.tilPassword.error = getString(R.string.error_empty_password)
            return
        }

        // Mostrar loading e desativar botão (evitar cliques duplos)
        setLoading(true)

        // Chamada assíncrona à API
        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@LoginActivity)

                // Passo 1: Login – obter token JWT
                val loginResponse = apiService.login(email, password)

                if (loginResponse.isSuccessful && loginResponse.body() != null) {
                    val token = loginResponse.body()!!.accessToken

                    // Passo 2: Guardar token no DataStore
                    tokenManager.saveToken(token)

                    // Passo 3: Obter dados do utilizador autenticado
                    val userResponse = apiService.getCurrentUser()
                    if (userResponse.isSuccessful && userResponse.body() != null) {
                        val user = userResponse.body()!!
                        // Guardar dados do user para mostrar no dashboard
                        tokenManager.saveUserData(
                            name = user.fullName ?: user.email,
                            email = user.email,
                            role = user.role,
                            id = user.id
                        )
                        // Guardar avatar URL se existir
                        user.avatarUrl?.let { url ->
                            tokenManager.saveAvatarUrl(url)
                        }
                    }

                    // Passo 4: Navegar para o Dashboard
                    navigateToMain()
                } else {
                    // Login falhou – mostrar erro
                    showError(getString(R.string.error_login_failed))
                }
            } catch (e: Exception) {
                // Erro de rede ou outro – mostrar mensagem genérica
                showError(getString(R.string.error_network))
            } finally {
                setLoading(false)
            }
        }
    }

    /**
     * Mostra/esconde o indicador de carregamento.
     * Desativa o botão durante o loading para evitar cliques múltiplos.
     */
    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled = !loading
    }

    /** Mostra mensagem de erro abaixo dos campos. */
    private fun showError(message: String) {
        binding.tvError.text = message
        binding.tvError.visibility = View.VISIBLE
    }

    /**
     * Navega para o Dashboard (MainActivity).
     * FLAG_ACTIVITY_NEW_TASK + CLEAR_TASK limpa a stack de navegação,
     * impedindo que o utilizador volte ao login com o botão Back.
     */
    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}
