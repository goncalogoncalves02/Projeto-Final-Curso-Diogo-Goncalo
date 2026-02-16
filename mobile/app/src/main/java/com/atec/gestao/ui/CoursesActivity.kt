/*
 * ============================================================================
 * CoursesActivity.kt – Lista de cursos com pesquisa e filtros
 * ============================================================================
 * Decisão: Reutiliza o layout activity_list.xml genérico.
 * Adiciona filtros por status (Todos, A Decorrer, Planeado, Terminado)
 * usando Material Chips, que não existem nos outros ecrãs de lista.
 *
 * Demonstra:
 * - RecyclerView com Adapter personalizado
 * - Pesquisa com debounce (espera o utilizador parar de escrever)
 * - Filtros visuais com Chips
 * - Passagem de dados para CourseDetailActivity via Intent extras
 * - Chamadas assíncronas à API com coroutines
 * ============================================================================
 */

package com.atec.gestao.ui

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.atec.gestao.R
import com.atec.gestao.data.api.RetrofitClient
import com.atec.gestao.data.model.Course
import com.atec.gestao.databinding.ActivityListBinding
import com.atec.gestao.ui.adapters.CourseAdapter
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class CoursesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityListBinding
    private lateinit var adapter: CourseAdapter

    // Lista completa de cursos (sem filtro) para aplicar filtros localmente
    private var allCourses = listOf<Course>()
    private var currentFilter = "all"    // Filtro de status atual
    private var searchJob: Job? = null   // Job para debounce da pesquisa

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupRecyclerView()
        setupSearch()
        setupFilters()
        loadCourses()
    }

    private fun setupToolbar() {
        binding.toolbar.title = getString(R.string.courses_title)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }

    /**
     * Configura o RecyclerView com LinearLayoutManager e o CourseAdapter.
     * O adapter recebe um lambda que é executado ao clicar num curso,
     * navegando para CourseDetailActivity com os dados do curso via Intent.
     */
    private fun setupRecyclerView() {
        adapter = CourseAdapter { course ->
            // Passagem de dados entre Activities via Intent extras
            // Enviamos todos os campos necessários para o ecrã de detalhe
            val intent = Intent(this, CourseDetailActivity::class.java).apply {
                putExtra("COURSE_ID", course.id)
                putExtra("COURSE_NAME", course.name)
                putExtra("COURSE_AREA", course.area)
                putExtra("COURSE_DESCRIPTION", course.description ?: "")
                putExtra("COURSE_START_DATE", course.startDate)
                putExtra("COURSE_END_DATE", course.endDate)
                putExtra("COURSE_STATUS", course.status)
            }
            startActivity(intent)
        }
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter
    }

    /**
     * Configura pesquisa com debounce de 500ms.
     * Decisão: Debounce evita chamar a API a cada tecla pressionada,
     * reduzindo o número de pedidos e melhorando a performance.
     */
    private fun setupSearch() {
        binding.etSearch.hint = getString(R.string.search_courses_hint)
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                // Cancelar pesquisa anterior e esperar 500ms
                searchJob?.cancel()
                searchJob = lifecycleScope.launch {
                    delay(500) // debounce
                    loadCourses(s?.toString())
                }
            }
        })
    }

    /**
     * Configura os Chips de filtro por status.
     * Decisão: Usar ChipGroup com singleSelection para filtros mutuamente exclusivos.
     * Os filtros são aplicados localmente sobre a lista já carregada.
     */
    private fun setupFilters() {
        // Tornar ChipGroup visível (está escondido por defeito no layout genérico)
        binding.chipGroup.visibility = View.VISIBLE

        binding.chipAll.setOnClickListener { currentFilter = "all"; applyFilter() }
        binding.chipActive.setOnClickListener { currentFilter = "active"; applyFilter() }
        binding.chipPlanned.setOnClickListener { currentFilter = "planned"; applyFilter() }
        binding.chipFinished.setOnClickListener { currentFilter = "finished"; applyFilter() }
    }

    /**
     * Carrega cursos da API com pesquisa opcional.
     * Usa GET /search/courses (endpoint paginado).
     */
    private fun loadCourses(query: String? = null) {
        binding.progressBar.visibility = View.VISIBLE
        binding.emptyState.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@CoursesActivity)
                // Passar query apenas se tiver 2+ caracteres (mínimo da API)
                val q = if ((query?.length ?: 0) >= 2) query else null
                val response = apiService.searchCourses(q = q, limit = 100)

                if (response.isSuccessful && response.body() != null) {
                    allCourses = response.body()!!.items
                    applyFilter()
                }
            } catch (e: Exception) {
                // Falha silenciosa – mostrar empty state
                binding.emptyState.visibility = View.VISIBLE
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    /**
     * Aplica o filtro de status localmente sobre a lista de cursos.
     * Decisão: Filtrar localmente em vez de chamar API novamente
     * é mais rápido e reduz chamadas de rede.
     */
    private fun applyFilter() {
        val filtered = if (currentFilter == "all") {
            allCourses
        } else {
            allCourses.filter { it.status == currentFilter }
        }
        adapter.submitList(filtered)
        binding.emptyState.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
    }
}
