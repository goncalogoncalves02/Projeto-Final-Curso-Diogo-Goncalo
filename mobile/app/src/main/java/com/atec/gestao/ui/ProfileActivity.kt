/*
 * ============================================================================
 * ProfileActivity.kt – Perfil do utilizador + upload de foto para o backend
 * ============================================================================
 * Mostra os dados do utilizador autenticado (nome, email, role).
 * Permite selecionar uma foto da galeria e enviá-la para o backend
 * via POST /users/me/avatar (multipart).
 *
 * Demonstra:
 * - Leitura de dados do DataStore
 * - ActivityResultLauncher para abrir a galeria (nova API)
 * - Upload multipart com Retrofit (MultipartBody.Part)
 * - Uso do Glide para carregar e exibir imagem
 * ============================================================================
 */

package com.atec.gestao.ui

import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.atec.gestao.BuildConfig
import com.atec.gestao.R
import com.atec.gestao.data.api.RetrofitClient
import com.atec.gestao.data.local.TokenManager
import com.atec.gestao.databinding.ActivityProfileBinding
import com.bumptech.glide.Glide
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private lateinit var tokenManager: TokenManager

    /**
     * Launcher para selecionar imagem da galeria.
     * Ao selecionar, a foto é:
     * 1. Mostrada na ImageView com Glide
     * 2. Enviada para o backend via POST /users/me/avatar
     * 3. O avatar_url devolvido pelo backend é guardado no DataStore
     */
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            // Mostrar foto imediatamente na UI
            binding.ivProfilePhoto.imageTintList = null
            Glide.with(this)
                .load(uri)
                .circleCrop()
                .into(binding.ivProfilePhoto)

            // Fazer upload para o backend
            uploadAvatarToBackend(uri)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)

        // Toolbar com botão de voltar
        binding.toolbar.setNavigationOnClickListener { finish() }

        // Carregar dados do utilizador do DataStore
        loadUserProfile()

        // Botão para alterar foto (selecionar da galeria)
        binding.btnChangePhoto.setOnClickListener {
            pickImageLauncher.launch("image/*")
        }
    }

    /**
     * Carrega os dados do utilizador guardados no DataStore.
     * Preenche os campos de texto e carrega a foto de perfil do backend.
     */
    private fun loadUserProfile() {
        lifecycleScope.launch {
            val name = tokenManager.userName.first() ?: "N/A"
            val email = tokenManager.userEmail.first() ?: "N/A"
            val role = tokenManager.userRole.first() ?: "N/A"
            val avatarUrl = tokenManager.userAvatarUrl.first()

            binding.etName.setText(name)
            binding.etEmail.setText(email)
            binding.etRole.setText(when (role) {
                "admin" -> "Administrador"
                "secretaria" -> "Secretaria"
                "professor" -> "Formador"
                "estudante" -> "Formando"
                else -> role
            })

            // Carregar foto do backend (se existir)
            if (!avatarUrl.isNullOrEmpty()) {
                // Construir URL completo: baseUrl + avatarUrl
                val fullUrl = BuildConfig.API_BASE_URL.trimEnd('/') + "/" + avatarUrl.trimStart('/')
                binding.ivProfilePhoto.imageTintList = null
                Glide.with(this@ProfileActivity)
                    .load(fullUrl)
                    .circleCrop()
                    .placeholder(R.drawable.ic_person_placeholder)
                    .into(binding.ivProfilePhoto)
            }
        }
    }

    /**
     * Envia a foto selecionada para o backend via POST /users/me/avatar.
     * O backend devolve o User atualizado com o novo avatar_url,
     * que é guardado no DataStore para persistir entre sessões e logins.
     */
    private fun uploadAvatarToBackend(uri: Uri) {
        lifecycleScope.launch {
            try {
                // Ler bytes da imagem da galeria via ContentResolver
                val inputStream = contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes() ?: return@launch
                inputStream.close()

                // Determinar tipo MIME (image/jpeg, image/png, etc.)
                val mimeType = contentResolver.getType(uri) ?: "image/jpeg"

                // Criar body multipart para o Retrofit
                val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
                val part = MultipartBody.Part.createFormData("file", "avatar.jpg", requestBody)

                // Enviar para o backend
                val apiService = RetrofitClient.getApiService(this@ProfileActivity)
                val response = apiService.uploadAvatar(part)

                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!
                    // Guardar avatar_url do backend no DataStore
                    user.avatarUrl?.let { url ->
                        tokenManager.saveAvatarUrl(url)
                    }
                    Toast.makeText(
                        this@ProfileActivity,
                        getString(R.string.photo_updated),
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    Toast.makeText(
                        this@ProfileActivity,
                        "Erro ao enviar foto: ${response.code()}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@ProfileActivity,
                    "Erro de rede: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
}
