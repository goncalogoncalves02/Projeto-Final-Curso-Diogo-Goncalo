/*
 * ============================================================================
 * ClassroomsActivity.kt – Lista de salas com pesquisa
 * ============================================================================
 * Lista todas as salas do sistema, permitindo pesquisa por nome.
 * Ao clicar numa sala, navega para ClassroomScheduleActivity
 * onde se pode ver a ocupação para um dia específico.
 *
 * Demonstra passagem de dados da sala via Intent extras.
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
import com.atec.gestao.databinding.ActivityListBinding
import com.atec.gestao.ui.adapters.ClassroomAdapter
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class ClassroomsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityListBinding
    private lateinit var adapter: ClassroomAdapter
    private var searchJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbar.title = getString(R.string.classrooms_title)
        binding.toolbar.setNavigationOnClickListener { finish() }

        setupRecyclerView()
        setupSearch()
        loadClassrooms()
    }

    private fun setupRecyclerView() {
        adapter = ClassroomAdapter { classroom ->
            // Passagem de dados da sala via Intent extras
            val intent = Intent(this, ClassroomScheduleActivity::class.java).apply {
                putExtra("CLASSROOM_ID", classroom.id)
                putExtra("CLASSROOM_NAME", classroom.name)
                putExtra("CLASSROOM_TYPE", classroom.type ?: "N/A")
                putExtra("CLASSROOM_CAPACITY", classroom.capacity ?: 0)
            }
            startActivity(intent)
        }
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter
    }

    private fun setupSearch() {
        binding.etSearch.hint = getString(R.string.search_classrooms_hint)
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                searchJob?.cancel()
                searchJob = lifecycleScope.launch {
                    delay(500)
                    loadClassrooms(s?.toString())
                }
            }
        })
    }

    /** Carrega salas da API (GET /classrooms/) */
    private fun loadClassrooms(query: String? = null) {
        binding.progressBar.visibility = View.VISIBLE
        binding.emptyState.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@ClassroomsActivity)
                val q = if ((query?.length ?: 0) >= 2) query else null
                val response = apiService.getClassrooms(q = q, limit = 100)

                if (response.isSuccessful && response.body() != null) {
                    val classrooms = response.body()!!.items
                    adapter.submitList(classrooms)
                    binding.emptyState.visibility =
                        if (classrooms.isEmpty()) View.VISIBLE else View.GONE
                }
            } catch (e: Exception) {
                binding.emptyState.visibility = View.VISIBLE
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
