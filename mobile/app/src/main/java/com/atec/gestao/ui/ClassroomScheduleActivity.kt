/*
 * ============================================================================
 * ClassroomScheduleActivity.kt – Ocupação/horário de uma sala
 * ============================================================================
 * Mostra as aulas agendadas para uma sala num dia específico.
 * O utilizador pode selecionar a data usando um DatePicker.
 *
 * Endpoint: GET /lessons/by-classroom/{classroomId}?date=YYYY-MM-DD
 *
 * Demonstra:
 * - Recepção de dados via Intent extras (ID e nome da sala)
 * - Uso de DatePickerDialog do Material Design
 * - Formatação de datas
 * - Chamada a endpoint com query parameters
 * ============================================================================
 */

package com.atec.gestao.ui

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.atec.gestao.data.api.RetrofitClient
import com.atec.gestao.databinding.ActivityClassroomScheduleBinding
import com.atec.gestao.ui.adapters.LessonAdapter
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class ClassroomScheduleActivity : AppCompatActivity() {

    private lateinit var binding: ActivityClassroomScheduleBinding
    private lateinit var lessonAdapter: LessonAdapter
    private var classroomId: Int = 0
    private var selectedDate: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityClassroomScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Receber dados da sala via Intent extras
        classroomId = intent.getIntExtra("CLASSROOM_ID", 0)
        val classroomName = intent.getStringExtra("CLASSROOM_NAME") ?: ""
        val classroomType = intent.getStringExtra("CLASSROOM_TYPE") ?: ""
        val classroomCapacity = intent.getIntExtra("CLASSROOM_CAPACITY", 0)

        // Configurar toolbar
        binding.toolbar.setNavigationOnClickListener { finish() }

        // Mostrar info da sala
        binding.tvRoomName.text = classroomName
        binding.tvRoomType.text = "Tipo: $classroomType"
        binding.tvRoomCapacity.text = "Capacidade: $classroomCapacity"

        setupRecyclerView()
        setupDatePicker()

        // Carregar aulas do dia atual por defeito
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        selectedDate = today
        binding.tvSelectedDate.text = "📅 $today"
        binding.tvSelectedDate.visibility = View.VISIBLE
        loadLessons()
    }

    private fun setupRecyclerView() {
        lessonAdapter = LessonAdapter()
        binding.rvLessons.layoutManager = LinearLayoutManager(this)
        binding.rvLessons.adapter = lessonAdapter
    }

    /**
     * Configura o botão de seleção de data.
     * Abre um DatePickerDialog do Android quando clicado.
     * Após selecionar, carrega as aulas para esse dia.
     */
    private fun setupDatePicker() {
        binding.btnSelectDate.setOnClickListener {
            val calendar = Calendar.getInstance()

            DatePickerDialog(
                this,
                { _, year, month, day ->
                    // Formatar data como "YYYY-MM-DD" para a API
                    selectedDate = String.format("%04d-%02d-%02d", year, month + 1, day)
                    binding.tvSelectedDate.text = "📅 $selectedDate"
                    binding.tvSelectedDate.visibility = View.VISIBLE
                    loadLessons()
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
    }

    /**
     * Carrega aulas da sala para a data selecionada.
     * Endpoint: GET /lessons/by-classroom/{id}?date=YYYY-MM-DD
     */
    private fun loadLessons() {
        binding.progressBar.visibility = View.VISIBLE
        binding.tvEmpty.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@ClassroomScheduleActivity)
                val response = apiService.getLessonsByClassroom(classroomId, selectedDate)

                if (response.isSuccessful && response.body() != null) {
                    val lessons = response.body()!!
                    if (lessons.isEmpty()) {
                        binding.tvEmpty.visibility = View.VISIBLE
                    }
                    lessonAdapter.submitList(lessons)
                }
            } catch (e: Exception) {
                binding.tvEmpty.visibility = View.VISIBLE
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
