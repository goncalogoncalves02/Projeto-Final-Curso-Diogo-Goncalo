/*
 * ============================================================================
 * TrainerDetailActivity.kt – Detalhe de um formador + horário
 * ============================================================================
 * Mostra o perfil do formador e as suas aulas agendadas.
 * Diferente do StudentDetailActivity porque carrega o horário do formador
 * via API (GET /lessons/by-trainer/{id}).
 *
 * Demonstra:
 * - Recepção de dados via Intent extras
 * - Chamada a endpoint adicional para enriquecer a vista
 * - RecyclerView aninhado dentro de ScrollView
 * ============================================================================
 */

package com.atec.gestao.ui

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.atec.gestao.R
import com.atec.gestao.data.api.RetrofitClient
import com.atec.gestao.databinding.ActivityUserDetailBinding
import com.atec.gestao.ui.adapters.LessonAdapter
import kotlinx.coroutines.launch

class TrainerDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityUserDetailBinding
    private lateinit var lessonAdapter: LessonAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUserDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbar.title = getString(R.string.trainer_detail_title)
        binding.toolbar.setNavigationOnClickListener { finish() }

        // Receber dados do formador via Intent extras
        val trainerId = intent.getIntExtra("USER_ID", 0)
        val userName = intent.getStringExtra("USER_NAME") ?: "Sem nome"
        val userEmail = intent.getStringExtra("USER_EMAIL") ?: ""

        // Preencher perfil
        binding.tvUserName.text = userName
        binding.tvUserEmail.text = userEmail

        // Chip de role com cor laranja para formadores
        binding.chipRole.text = "Professor"
        binding.chipRole.setChipBackgroundColorResource(R.color.card_trainers)
        binding.chipRole.setTextColor(ContextCompat.getColor(this, R.color.white))

        // Mostrar secção de horário (oculta por defeito no layout)
        binding.tvScheduleTitle.visibility = View.VISIBLE
        binding.rvLessons.visibility = View.VISIBLE

        // Configurar RecyclerView de aulas
        lessonAdapter = LessonAdapter()
        binding.rvLessons.layoutManager = LinearLayoutManager(this)
        binding.rvLessons.adapter = lessonAdapter

        // Carregar aulas do formador
        loadTrainerLessons(trainerId)
    }

    /**
     * Carrega as aulas do formador via API.
     * Endpoint: GET /lessons/by-trainer/{trainerId}
     */
    private fun loadTrainerLessons(trainerId: Int) {
        if (trainerId == 0) return

        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@TrainerDetailActivity)
                val response = apiService.getLessonsByTrainer(trainerId)

                if (response.isSuccessful && response.body() != null) {
                    val lessons = response.body()!!
                    if (lessons.isEmpty()) {
                        binding.tvNoLessons.visibility = View.VISIBLE
                    }
                    lessonAdapter.submitList(lessons)
                }
            } catch (e: Exception) {
                binding.tvNoLessons.visibility = View.VISIBLE
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
