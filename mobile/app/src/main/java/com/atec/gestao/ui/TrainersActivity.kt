/*
 * ============================================================================
 * TrainersActivity.kt – Lista de formadores com pesquisa
 * ============================================================================
 * Similar a StudentsActivity mas pesquisa formadores (role=professor).
 * Ao clicar, navega para TrainerDetailActivity com dados via Intent.
 * O detalhe do formador também mostra o horário de aulas.
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

class TrainersActivity : AppCompatActivity() {

    private lateinit var binding: ActivityListBinding
    private lateinit var adapter: UserAdapter
    private var searchJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.toolbar.title = getString(R.string.trainers_title)
        binding.toolbar.setNavigationOnClickListener { finish() }

        setupRecyclerView()
        setupSearch()
        loadTrainers()
    }

    private fun setupRecyclerView() {
        adapter = UserAdapter { user ->
            val intent = Intent(this, TrainerDetailActivity::class.java).apply {
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
        binding.etSearch.hint = getString(R.string.search_trainers_hint)
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                searchJob?.cancel()
                searchJob = lifecycleScope.launch {
                    delay(500)
                    loadTrainers(s?.toString())
                }
            }
        })
    }

    /** Carrega formadores da API (GET /search/trainers) */
    private fun loadTrainers(query: String? = null) {
        binding.progressBar.visibility = View.VISIBLE
        binding.emptyState.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@TrainersActivity)
                val q = if ((query?.length ?: 0) >= 2) query else null
                val response = apiService.searchTrainers(q = q, limit = 100)

                if (response.isSuccessful && response.body() != null) {
                    val trainers = response.body()!!.items
                    adapter.submitList(trainers)
                    binding.emptyState.visibility =
                        if (trainers.isEmpty()) View.VISIBLE else View.GONE
                }
            } catch (e: Exception) {
                binding.emptyState.visibility = View.VISIBLE
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
