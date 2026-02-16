/*
 * ============================================================================
 * CourseDetailActivity.kt – Detalhes de um curso + lista de módulos
 * ============================================================================
 * Decisão: Recebe dados do curso via Intent extras (passagem de dados
 * entre Activities – requisito do enunciado).
 *
 * Também carrega os módulos do curso via API (GET /courses/{id}/modules)
 * para mostrar a estrutura curricular com formadores e horas.
 *
 * Demonstra:
 * - Recepção de dados via Intent extras (getIntExtra, getStringExtra)
 * - Chamada a sub-recurso da API (módulos de um curso)
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
import com.atec.gestao.databinding.ActivityCourseDetailBinding
import com.atec.gestao.ui.adapters.ModuleAdapter
import kotlinx.coroutines.launch

class CourseDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCourseDetailBinding
    private lateinit var moduleAdapter: ModuleAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCourseDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Configurar toolbar com botão de voltar
        binding.toolbar.setNavigationOnClickListener { finish() }

        // Receber dados do curso passados via Intent extras
        displayCourseData()

        // Configurar RecyclerView de módulos
        setupModulesRecyclerView()

        // Carregar módulos da API
        loadModules()
    }

    /**
     * Exibe os dados do curso recebidos via Intent extras.
     * Demonstra a recepção de dados passados entre Activities.
     */
    private fun displayCourseData() {
        val name = intent.getStringExtra("COURSE_NAME") ?: ""
        val area = intent.getStringExtra("COURSE_AREA") ?: ""
        val description = intent.getStringExtra("COURSE_DESCRIPTION") ?: ""
        val startDate = intent.getStringExtra("COURSE_START_DATE") ?: ""
        val endDate = intent.getStringExtra("COURSE_END_DATE") ?: ""
        val status = intent.getStringExtra("COURSE_STATUS") ?: ""

        binding.tvCourseName.text = name
        binding.tvArea.text = area
        binding.tvStartDate.text = startDate
        binding.tvEndDate.text = endDate

        // Mostrar descrição se existir
        if (description.isNotEmpty()) {
            binding.tvDescription.text = description
            binding.tvDescription.visibility = View.VISIBLE
        }

        // Configurar badge de status com cor apropriada
        when (status) {
            "active" -> {
                binding.chipStatus.text = "A Decorrer"
                binding.chipStatus.setChipBackgroundColorResource(R.color.status_active)
                binding.chipStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            }
            "planned" -> {
                binding.chipStatus.text = "Planeado"
                binding.chipStatus.setChipBackgroundColorResource(R.color.status_planned)
                binding.chipStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            }
            "finished" -> {
                binding.chipStatus.text = "Terminado"
                binding.chipStatus.setChipBackgroundColorResource(R.color.status_finished)
                binding.chipStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            }
        }
    }

    private fun setupModulesRecyclerView() {
        moduleAdapter = ModuleAdapter()
        binding.rvModules.layoutManager = LinearLayoutManager(this)
        binding.rvModules.adapter = moduleAdapter
    }

    /**
     * Carrega os módulos do curso a partir da API.
     * Endpoint: GET /courses/{courseId}/modules
     * Retorna a estrutura curricular com formador e horas de cada módulo.
     */
    private fun loadModules() {
        val courseId = intent.getIntExtra("COURSE_ID", 0)
        if (courseId == 0) return

        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@CourseDetailActivity)
                val response = apiService.getCourseModules(courseId)

                if (response.isSuccessful && response.body() != null) {
                    val modules = response.body()!!
                    if (modules.isEmpty()) {
                        binding.tvNoModules.visibility = View.VISIBLE
                    } else {
                        moduleAdapter.submitList(modules)
                    }
                }
            } catch (e: Exception) {
                binding.tvNoModules.visibility = View.VISIBLE
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
