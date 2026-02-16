/*
 * ============================================================================
 * Models.kt – Data classes que representam os dados da API
 * ============================================================================
 * Decisão: Todas as data classes estão num único ficheiro para simplicidade,
 * dado que são poucas e inter-relacionadas. Cada classe mapeia diretamente
 * para o JSON devolvido pela API FastAPI do backend.
 *
 * Atenção: Os nomes dos campos devem corresponder exatamente aos campos JSON
 * da API (snake_case). O Gson faz a conversão automática com @SerializedName.
 * ============================================================================
 */

package com.atec.gestao.data.model

import com.google.gson.annotations.SerializedName

/**
 * Resposta de login da API.
 * A API FastAPI devolve um token OAuth2 com access_token e token_type.
 */
data class LoginResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String
)

/**
 * Representa um utilizador do sistema.
 * Pode ser: admin, secretaria, professor (formador), ou estudante (formando).
 * Mapeado do schema User do backend (schemas/user.py).
 */
data class User(
    val id: Int,
    val email: String,
    @SerializedName("full_name") val fullName: String?,
    val role: String,                    // "admin", "secretaria", "professor", "estudante"
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("is_superuser") val isSuperuser: Boolean,
    @SerializedName("is_2fa_enabled") val is2faEnabled: Boolean = false,
    @SerializedName("avatar_url") val avatarUrl: String? = null
)

/**
 * Representa um curso da escola ATEC.
 * Campos incluem datas de início/fim e status (planned, active, finished).
 * Mapeado do schema Course do backend (schemas/course.py).
 */
data class Course(
    val id: Int,
    val name: String,
    val area: String,
    val description: String?,
    @SerializedName("start_date") val startDate: String,  // formato "YYYY-MM-DD"
    @SerializedName("end_date") val endDate: String,
    val status: String                   // "planned", "active", "finished"
)

/**
 * Representa uma sala de aula.
 * Inclui tipo (Teórica/Prática), capacidade e disponibilidade.
 * Mapeado do schema Classroom do backend (schemas/classroom.py).
 */
data class Classroom(
    val id: Int,
    val name: String,
    val type: String?,
    val capacity: Int?,
    @SerializedName("is_available") val isAvailable: Boolean?
)

/**
 * Representa um módulo de um curso.
 * Liga módulos a cursos com informação do formador e sala atribuída.
 */
data class CourseModule(
    val id: Int,
    @SerializedName("course_id") val courseId: Int,
    @SerializedName("module_id") val moduleId: Int,
    @SerializedName("trainer_id") val trainerId: Int?,
    @SerializedName("classroom_id") val classroomId: Int?,
    val order: Int?,
    @SerializedName("total_hours") val totalHours: Float?,
    val module: Module? = null,
    val trainer: User? = null,
    val classroom: Classroom? = null
)

/**
 * Representa um módulo do catálogo.
 */
data class Module(
    val id: Int,
    val name: String,
    @SerializedName("default_duration_hours") val defaultDurationHours: Float?
)

/**
 * Representa uma aula/lição com detalhes enriquecidos.
 * A API devolve dados agregados: nome do módulo, curso, formador e sala.
 * Usado no ecrã de ocupação de salas e detalhes de formadores.
 */
data class LessonWithDetails(
    val id: Int,
    val date: String,                    // formato "YYYY-MM-DD"
    @SerializedName("start_time") val startTime: String,  // formato "HH:MM:SS"
    @SerializedName("end_time") val endTime: String,
    val notes: String?,
    @SerializedName("module_name") val moduleName: String,
    @SerializedName("module_id") val moduleId: Int,
    @SerializedName("course_name") val courseName: String,
    @SerializedName("course_id") val courseId: Int,
    @SerializedName("trainer_name") val trainerName: String,
    @SerializedName("trainer_id") val trainerId: Int,
    @SerializedName("classroom_name") val classroomName: String?,
    @SerializedName("classroom_id") val classroomId: Int?,
    @SerializedName("duration_hours") val durationHours: Float?
)

/**
 * Resposta paginada genérica da API.
 * Todos os endpoints de listagem/pesquisa devolvem este formato.
 * O campo "items" contém os objetos do tipo T (Course, User, Classroom).
 */
data class PaginatedResponse<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pages: Int,
    val limit: Int
)
