/*
 * ============================================================================
 * MainActivity.kt – Dashboard principal (ecrã após login)
 * ============================================================================
 * Decisão: Dashboard com 4 cards coloridos para navegação rápida.
 * Cada card abre uma Activity diferente via Intent (passagem de dados).
 *
 * Funcionalidades:
 * - Mostra nome e role do utilizador (lidos do DataStore)
 * - 4 cards: Cursos, Formandos, Formadores, Salas
 * - Botão de perfil (navega para ProfileActivity)
 * - Botão de logout com dialog de confirmação
 *
 * Demonstra passagem de dados entre activities via Intent extras.
 * ============================================================================
 */

package com.atec.gestao.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.atec.gestao.BuildConfig
import com.atec.gestao.R
import com.atec.gestao.data.local.TokenManager
import com.atec.gestao.databinding.ActivityMainBinding
import com.bumptech.glide.Glide
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)

        // Carregar dados do utilizador do DataStore para mostrar no header
        loadUserData()

        // Configurar cliques nos cards de navegação
        setupNavigation()
    }

    /**
     * Recarrega os dados (incluindo avatar) ao voltar de outra Activity.
     * Ex: se o utilizador altera a foto no ProfileActivity.
     */
    override fun onResume() {
        super.onResume()
        loadUserData()
    }

    /**
     * Carrega nome e role do utilizador guardados no DataStore.
     * Usa Flows reativos para observar mudanças.
     */
    private fun loadUserData() {
        lifecycleScope.launch {
            val name = tokenManager.userName.first() ?: "Utilizador"
            val role = tokenManager.userRole.first() ?: "N/A"
            val avatarUrl = tokenManager.userAvatarUrl.first()

            binding.tvUserName.text = name
            // Traduzir role para português para melhor UX
            binding.tvUserRole.text = when (role) {
                "admin" -> "Administrador"
                "secretaria" -> "Secretaria"
                "professor" -> "Formador"
                "estudante" -> "Formando"
                else -> role
            }

            // Mostrar foto de perfil do backend (se existir)
            if (!avatarUrl.isNullOrEmpty()) {
                val fullUrl = BuildConfig.API_BASE_URL.trimEnd('/') + "/" + avatarUrl.trimStart('/')
                binding.ivAvatar.imageTintList = null
                Glide.with(this@MainActivity)
                    .load(fullUrl)
                    .circleCrop()
                    .placeholder(R.drawable.ic_profile)
                    .into(binding.ivAvatar)
            }
        }
    }

    /**
     * Configura os cliques nos 4 cards de navegação.
     * Cada card abre uma Activity diferente usando Intent.
     *
     * Exemplo de passagem de dados entre Activities:
     * O título da secção é passado como extra no Intent.
     */
    private fun setupNavigation() {
        // Card Cursos → CoursesActivity
        binding.cardCourses.setOnClickListener {
            startActivity(Intent(this, CoursesActivity::class.java))
        }

        // Card Formandos → StudentsActivity
        binding.cardStudents.setOnClickListener {
            startActivity(Intent(this, StudentsActivity::class.java))
        }

        // Card Formadores → TrainersActivity
        binding.cardTrainers.setOnClickListener {
            startActivity(Intent(this, TrainersActivity::class.java))
        }

        // Card Salas → ClassroomsActivity
        binding.cardClassrooms.setOnClickListener {
            startActivity(Intent(this, ClassroomsActivity::class.java))
        }

        // Botão Perfil → ProfileActivity
        binding.btnProfile.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }

        // Botão Logout – mostrar dialog de confirmação
        binding.btnLogout.setOnClickListener {
            showLogoutDialog()
        }
    }

    /**
     * Mostra dialog de confirmação antes de fazer logout.
     * Decisão: Usar AlertDialog nativo para simplicidade.
     * No logout, limpar token do DataStore e voltar ao LoginActivity.
     */
    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.dialog_logout_title))
            .setMessage(getString(R.string.dialog_logout_message))
            .setPositiveButton(getString(R.string.btn_confirm)) { _, _ ->
                // Limpar dados de sessão
                lifecycleScope.launch {
                    tokenManager.clearAll()
                    // Voltar ao login, limpando toda a stack de navegação
                    val intent = Intent(this@MainActivity, LoginActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    }
                    startActivity(intent)
                    finish()
                }
            }
            .setNegativeButton(getString(R.string.btn_cancel), null)
            .show()
    }
}
