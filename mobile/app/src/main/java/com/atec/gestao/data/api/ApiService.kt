/*
 * ============================================================================
 * ApiService.kt – Interface Retrofit que define todos os endpoints da API
 * ============================================================================
 * Decisão: Usar Retrofit porque é a biblioteca standard para APIs REST
 * em Android. Os métodos desta interface mapeiam diretamente para os
 * endpoints do backend FastAPI.
 *
 * Todos os métodos usam suspend (coroutines) para execução assíncrona,
 * evitando bloquear a UI thread e possíveis ANR (App Not Responding).
 *
 * A autenticação é feita via Bearer token JWT, injetado automaticamente
 * pelo AuthInterceptor (ver AuthInterceptor.kt).
 * ============================================================================
 */

package com.atec.gestao.data.api

import com.atec.gestao.data.model.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // =============================================
    // AUTENTICAÇÃO
    // =============================================

    /**
     * Login com email e password.
     * A API FastAPI usa OAuth2PasswordRequestForm, que espera dados
     * no formato x-www-form-urlencoded (username + password).
     * Nota: O campo "username" na verdade recebe o email do utilizador,
     * conforme convenção OAuth2.
     */
    @FormUrlEncoded
    @POST("/auth/login")
    suspend fun login(
        @Field("username") email: String,
        @Field("password") password: String
    ): Response<LoginResponse>

    /**
     * Obtém os dados do utilizador autenticado.
     * Usado após login para mostrar nome e role no dashboard.
     * Requer header Authorization: Bearer {token}.
     */
    @GET("/auth/me")
    suspend fun getCurrentUser(): Response<User>

    // =============================================
    // PESQUISA (Consultas Rápidas)
    // =============================================

    /**
     * Pesquisa cursos com paginação.
     * @param q Termo de pesquisa (nome ou área do curso)
     * @param page Página atual (começa em 1)
     * @param limit Número de items por página (máx 100)
     */
    @GET("/search/courses")
    suspend fun searchCourses(
        @Query("q") q: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<Course>>

    /**
     * Pesquisa formandos (estudantes) com paginação.
     * @param q Termo de pesquisa (nome ou email)
     */
    @GET("/search/students")
    suspend fun searchStudents(
        @Query("q") q: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<User>>

    /**
     * Pesquisa formadores (professores) com paginação.
     * @param q Termo de pesquisa (nome ou email)
     */
    @GET("/search/trainers")
    suspend fun searchTrainers(
        @Query("q") q: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<User>>

    // =============================================
    // CURSOS
    // =============================================

    /**
     * Lista todos os cursos com paginação e filtro opcional.
     * Endpoint genérico que aceita pesquisa por nome ou área.
     */
    @GET("/courses/")
    suspend fun getCourses(
        @Query("q") q: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<Course>>

    /**
     * Obtém os módulos de um curso específico.
     * Mostra a estrutura curricular: módulos, formadores e salas.
     */
    @GET("/courses/{courseId}/modules")
    suspend fun getCourseModules(
        @Path("courseId") courseId: Int
    ): Response<List<CourseModule>>

    // =============================================
    // SALAS E HORÁRIOS
    // =============================================

    /**
     * Lista todas as salas com paginação.
     */
    @GET("/classrooms/")
    suspend fun getClassrooms(
        @Query("q") q: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedResponse<Classroom>>

    /**
     * Obtém as aulas/ocupação de uma sala para um dia específico.
     * Usado para verificar disponibilidade de salas (requisito 3.b.iv).
     * @param classroomId ID da sala
     * @param date Data no formato "YYYY-MM-DD"
     */
    @GET("/lessons/by-classroom/{classroomId}")
    suspend fun getLessonsByClassroom(
        @Path("classroomId") classroomId: Int,
        @Query("date") date: String? = null
    ): Response<List<LessonWithDetails>>

    /**
     * Obtém as aulas de um formador.
     * Usado para mostrar o horário do formador no detalhe.
     */
    @GET("/lessons/by-trainer/{trainerId}")
    suspend fun getLessonsByTrainer(
        @Path("trainerId") trainerId: Int,
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null
    ): Response<List<LessonWithDetails>>

    // =============================================
    // AVATAR
    // =============================================

    /**
     * Upload da foto de perfil do utilizador autenticado.
     * Envia ficheiro como multipart/form-data.
     * O backend guarda em uploads/avatars/{user_id}/ e atualiza avatar_url na BD.
     */
    @Multipart
    @POST("/users/me/avatar")
    suspend fun uploadAvatar(
        @Part file: MultipartBody.Part
    ): Response<User>
}
