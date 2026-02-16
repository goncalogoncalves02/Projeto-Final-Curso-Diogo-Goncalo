/*
 * ============================================================================
 * StudentsActivity.kt – Lista de formandos com pesquisa
 * ============================================================================
 * Reutiliza o layout genérico activity_list.xml.
 * Pesquisa formandos via GET /search/students com paginação.
 * Ao clicar num formando, navega para StudentDetailActivity
 * passando os dados via Intent extras.
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
import com.atec.gestao.ui.adapters.UserAdapter
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class StudentsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityListBinding
    private lateinit var adapter: UserAdapter
    private var searchJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbar.title = getString(R.string.students_title)
        binding.toolbar.setNavigationOnClickListener { finish() }

        setupRecyclerView()
        setupSearch()
        loadStudents()
    }

    private fun setupRecyclerView() {
        adapter = UserAdapter { user ->
            // Passagem de dados para o ecrã de detalhe via Intent
            val intent = Intent(this, StudentDetailActivity::class.java).apply {
                putExtra("USER_ID", user.id)
                putExtra("USER_NAME", user.fullName ?: "Sem nome")
                putExtra("USER_EMAIL", user.email)
                putExtra("USER_ROLE", user.role)
            }
            startActivity(intent)
        }
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter
    }

    private fun setupSearch() {
        binding.etSearch.hint = getString(R.string.search_students_hint)
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                searchJob?.cancel()
                searchJob = lifecycleScope.launch {
                    delay(500)
                    loadStudents(s?.toString())
                }
            }
        })
    }

    /** Carrega formandos da API (GET /search/students) */
    private fun loadStudents(query: String? = null) {
        binding.progressBar.visibility = View.VISIBLE
        binding.emptyState.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@StudentsActivity)
                val q = if ((query?.length ?: 0) >= 2) query else null
                val response = apiService.searchStudents(q = q, limit = 100)

                if (response.isSuccessful && response.body() != null) {
                    val students = response.body()!!.items
                    adapter.submitList(students)
                    binding.emptyState.visibility =
                        if (students.isEmpty()) View.VISIBLE else View.GONE
                }
            } catch (e: Exception) {
                binding.emptyState.visibility = View.VISIBLE
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
