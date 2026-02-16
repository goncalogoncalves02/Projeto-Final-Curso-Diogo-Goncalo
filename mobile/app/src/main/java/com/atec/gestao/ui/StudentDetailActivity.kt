/*
 * ============================================================================
 * StudentDetailActivity.kt – Detalhe de um formando
 * ============================================================================
 * Mostra o perfil do formando: avatar, nome, email e role.
 * Recebe todos os dados via Intent extras (passagem de dados entre Activities).
 *
 * Nota: A secção de horário está oculta para formandos (apenas formadores
 * têm horário de aulas no sistema).
 * ============================================================================
 */

package com.atec.gestao.ui

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.atec.gestao.R
import com.atec.gestao.databinding.ActivityUserDetailBinding

class StudentDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityUserDetailBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUserDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Toolbar com título e botão de voltar
        binding.toolbar.title = getString(R.string.student_detail_title)
        binding.toolbar.setNavigationOnClickListener { finish() }

        // Receber dados do Intent extras (passados pela StudentsActivity)
        val userName = intent.getStringExtra("USER_NAME") ?: "Sem nome"
        val userEmail = intent.getStringExtra("USER_EMAIL") ?: ""
        val userRole = intent.getStringExtra("USER_ROLE") ?: ""

        // Preencher o layout com os dados recebidos
        binding.tvUserName.text = userName
        binding.tvUserEmail.text = userEmail

        // Configurar chip de role com cor verde para estudantes
        binding.chipRole.text = "Formando"
        binding.chipRole.setChipBackgroundColorResource(R.color.card_students)
        binding.chipRole.setTextColor(ContextCompat.getColor(this, R.color.white))

        // A secção de horário fica oculta para formandos
        // (apenas formadores têm aulas atribuídas)
    }
}
