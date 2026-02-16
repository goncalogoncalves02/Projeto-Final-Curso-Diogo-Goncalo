/*
 * ============================================================================
 * Adapters.kt – RecyclerView Adapters para todas as listas da aplicação
 * ============================================================================
 * Decisão: Todos os adapters num único ficheiro para simplicidade e coesão.
 * Cada adapter usa o padrão ViewHolder do RecyclerView para performance:
 * - As views são recicladas em vez de recriadas (evita overhead de inflate)
 * - ViewBinding usado para acesso type-safe aos elementos do layout
 *
 * Callbacks via lambda (onItemClick) para comunicar cliques ao Activity,
 * seguindo o princípio de separação de responsabilidades.
 * ============================================================================
 */

package com.atec.gestao.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.atec.gestao.R
import com.atec.gestao.data.model.*
import com.atec.gestao.databinding.*

// =============================================
// ADAPTER DE CURSOS
// =============================================

/**
 * Adapter para a lista de cursos.
 * Mostra nome, área, datas e badge de status (com cores diferentes).
 * @param onItemClick callback executado quando o utilizador clica num curso
 */
class CourseAdapter(
    private val onItemClick: (Course) -> Unit
) : RecyclerView.Adapter<CourseAdapter.ViewHolder>() {

    // Lista mutável de cursos – atualizada via submitList()
    private var courses = mutableListOf<Course>()

    /**
     * Atualiza a lista de cursos e notifica o RecyclerView.
     * Decisão: Usar notifyDataSetChanged() para simplicidade.
     * Em produção, usar DiffUtil para melhor performance.
     */
    fun submitList(newCourses: List<Course>) {
        courses.clear()
        courses.addAll(newCourses)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemCourseBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(courses[position])
    }

    override fun getItemCount() = courses.size

    inner class ViewHolder(
        private val binding: ItemCourseBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(course: Course) {
            binding.tvCourseName.text = course.name
            binding.tvCourseArea.text = course.area
            binding.tvCourseDates.text = "${course.startDate} → ${course.endDate}"

            // Configurar badge de status com cor apropriada
            val context = binding.root.context
            when (course.status) {
                "active" -> {
                    binding.chipStatus.text = "A Decorrer"
                    binding.chipStatus.setChipBackgroundColorResource(R.color.status_active)
                    binding.chipStatus.setTextColor(ContextCompat.getColor(context, R.color.white))
                }
                "planned" -> {
                    binding.chipStatus.text = "Planeado"
                    binding.chipStatus.setChipBackgroundColorResource(R.color.status_planned)
                    binding.chipStatus.setTextColor(ContextCompat.getColor(context, R.color.white))
                }
                "finished" -> {
                    binding.chipStatus.text = "Terminado"
                    binding.chipStatus.setChipBackgroundColorResource(R.color.status_finished)
                    binding.chipStatus.setTextColor(ContextCompat.getColor(context, R.color.white))
                }
                else -> {
                    binding.chipStatus.text = course.status
                }
            }

            // Clique no card navega para os detalhes do curso
            binding.root.setOnClickListener { onItemClick(course) }
        }
    }
}

// =============================================
// ADAPTER DE UTILIZADORES (Formandos e Formadores)
// =============================================

/**
 * Adapter genérico para listas de utilizadores (formandos e formadores).
 * Reutilizado por StudentsActivity e TrainersActivity.
 * Mostra avatar, nome e email.
 */
class UserAdapter(
    private val onItemClick: (User) -> Unit
) : RecyclerView.Adapter<UserAdapter.ViewHolder>() {

    private var users = mutableListOf<User>()

    fun submitList(newUsers: List<User>) {
        users.clear()
        users.addAll(newUsers)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemUserBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(users[position])
    }

    override fun getItemCount() = users.size

    inner class ViewHolder(
        private val binding: ItemUserBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(user: User) {
            // Mostrar nome ou email se nome não disponível
            binding.tvUserName.text = user.fullName ?: "Sem nome"
            binding.tvUserEmail.text = user.email

            // Clique navega para detalhes do utilizador
            binding.root.setOnClickListener { onItemClick(user) }
        }
    }
}

// =============================================
// ADAPTER DE SALAS
// =============================================

/**
 * Adapter para a lista de salas.
 * Mostra nome, tipo, capacidade e badge de disponibilidade.
 */
class ClassroomAdapter(
    private val onItemClick: (Classroom) -> Unit
) : RecyclerView.Adapter<ClassroomAdapter.ViewHolder>() {

    private var classrooms = mutableListOf<Classroom>()

    fun submitList(newClassrooms: List<Classroom>) {
        classrooms.clear()
        classrooms.addAll(newClassrooms)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemClassroomBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(classrooms[position])
    }

    override fun getItemCount() = classrooms.size

    inner class ViewHolder(
        private val binding: ItemClassroomBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(classroom: Classroom) {
            binding.tvRoomName.text = classroom.name
            binding.tvRoomType.text = classroom.type ?: "N/A"
            binding.tvRoomCapacity.text = "Cap: ${classroom.capacity ?: "N/A"}"

            // Badge de disponibilidade
            val context = binding.root.context
            if (classroom.isAvailable == true) {
                binding.tvAvailability.text = context.getString(R.string.room_available)
                binding.tvAvailability.setTextColor(
                    ContextCompat.getColor(context, R.color.success)
                )
            } else {
                binding.tvAvailability.text = context.getString(R.string.room_unavailable)
                binding.tvAvailability.setTextColor(
                    ContextCompat.getColor(context, R.color.error)
                )
            }

            binding.root.setOnClickListener { onItemClick(classroom) }
        }
    }
}

// =============================================
// ADAPTER DE AULAS/LIÇÕES
// =============================================

/**
 * Adapter para a lista de aulas.
 * Mostra hora de início/fim, módulo, curso e formador.
 * Usado no ecrã de ocupação de salas e detalhe de formadores.
 */
class LessonAdapter : RecyclerView.Adapter<LessonAdapter.ViewHolder>() {

    private var lessons = mutableListOf<LessonWithDetails>()

    fun submitList(newLessons: List<LessonWithDetails>) {
        lessons.clear()
        lessons.addAll(newLessons)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemLessonBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(lessons[position])
    }

    override fun getItemCount() = lessons.size

    inner class ViewHolder(
        private val binding: ItemLessonBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(lesson: LessonWithDetails) {
            // Formatar horas (remover segundos: "09:00:00" -> "09:00")
            binding.tvStartTime.text = lesson.startTime.substring(0, 5)
            binding.tvEndTime.text = lesson.endTime.substring(0, 5)
            binding.tvModuleName.text = lesson.moduleName
            binding.tvCourseName.text = lesson.courseName
            binding.tvTrainerName.text = "👤 ${lesson.trainerName}"
        }
    }
}

// =============================================
// ADAPTER DE MÓDULOS DO CURSO
// =============================================

/**
 * Adapter para a lista de módulos de um curso.
 * Mostra ordem, nome do módulo, formador e horas.
 */
class ModuleAdapter : RecyclerView.Adapter<ModuleAdapter.ViewHolder>() {

    private var modules = mutableListOf<CourseModule>()

    fun submitList(newModules: List<CourseModule>) {
        modules.clear()
        modules.addAll(newModules)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemModuleBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(modules[position], position)
    }

    override fun getItemCount() = modules.size

    inner class ViewHolder(
        private val binding: ItemModuleBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(courseModule: CourseModule, position: Int) {
            // Número de ordem (usar o campo order ou posição na lista)
            binding.tvOrder.text = (courseModule.order ?: (position + 1)).toString()

            // Nome do módulo (se tiver objeto module, usar o nome; senão, mostrar ID)
            binding.tvModuleName.text = courseModule.module?.name ?: "Módulo #${courseModule.moduleId}"

            // Nome do formador
            binding.tvTrainerName.text = courseModule.trainer?.fullName
                ?: courseModule.trainer?.email
                ?: "Sem formador"

            // Horas totais
            binding.tvHours.text = "${courseModule.totalHours ?: 0}h"
        }
    }
}
