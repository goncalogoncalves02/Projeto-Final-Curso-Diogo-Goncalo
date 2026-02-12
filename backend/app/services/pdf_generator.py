"""
Servico de Geracao de PDF
--------------------------
Gera fichas PDF de estudantes e professores usando fpdf2.
"""

import os
from fpdf import FPDF
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.course_module import CourseModule

# Directorio base do backend (para resolver caminhos de ficheiros)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

# Traducoes de status para PT
STATUS_PT = {
    "active": "A Decorrer",
    "planned": "Planeado",
    "finished": "Terminado",
    "cancelled": "Cancelado",
    "completed": "Concluido",
    "dropped": "Desistiu",
}


def _get_avatar_path(user: User):
    """Resolve o caminho absoluto do avatar no disco."""
    if not user.avatar_url:
        return None
    abs_path = os.path.join(BASE_DIR, user.avatar_url)
    # fpdf2 suporta JPEG e PNG nativamente
    if os.path.exists(abs_path) and abs_path.lower().endswith((".jpg", ".jpeg", ".png")):
        return abs_path
    return None


def _format_date(d):
    """Formata uma data para dd/mm/aaaa."""
    if d is None:
        return "-"
    return d.strftime("%d/%m/%Y")


def _translate_status(status):
    """Traduz um status enum para PT."""
    val = status.value if hasattr(status, "value") else str(status)
    return STATUS_PT.get(val, val)


def _truncate(text, max_len=40):
    """Trunca texto se exceder max_len."""
    if not text:
        return "-"
    if len(text) > max_len:
        return text[:max_len - 3] + "..."
    return text


class ATECReport(FPDF):
    """Classe base PDF com cabecalho e rodape ATEC."""

    def __init__(self, title):
        super().__init__()
        self._report_title = title

    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, "ATEC", new_x="RIGHT", new_y="TOP")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, self._report_title, new_x="LMARGIN", new_y="NEXT", align="R")
        # Linha separadora
        self.set_draw_color(0, 51, 102)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}}", align="C")

    def section_title(self, text):
        """Titulo de seccao com fundo azul claro."""
        self.set_font("Helvetica", "B", 11)
        self.set_fill_color(230, 240, 250)
        self.set_text_color(0, 51, 102)
        self.cell(0, 8, f"  {text}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def info_line(self, label, value):
        """Linha de informacao: label a negrito + valor."""
        self.set_font("Helvetica", "B", 10)
        self.cell(40, 6, f"{label}:", new_x="RIGHT", new_y="TOP")
        self.set_font("Helvetica", "", 10)
        self.cell(0, 6, str(value or "-"), new_x="LMARGIN", new_y="NEXT")


def generate_student_pdf(db: Session, user: User) -> bytes:
    """
    Gera a Ficha do Formando em PDF.
    Inclui foto, dados pessoais, cursos inscritos e notas por modulo.
    """
    pdf = ATECReport("Ficha do Formando")
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # --- Dados Pessoais ---
    avatar_path = _get_avatar_path(user)
    y_start = pdf.get_y()

    if avatar_path:
        try:
            pdf.image(avatar_path, x=10, y=y_start, w=28, h=28)
            pdf.set_xy(42, y_start)
        except Exception:
            pdf.set_xy(10, y_start)
    else:
        pdf.set_xy(10, y_start)

    x_info = pdf.get_x()
    pdf.info_line("Nome", user.full_name or "-")
    pdf.set_x(x_info)
    pdf.info_line("Email", user.email)
    pdf.set_x(x_info)
    pdf.info_line("Telefone", user.phone_number or "-")
    pdf.set_x(x_info)
    pdf.info_line("Registo", _format_date(user.created_at))

    # Garantir que passamos abaixo da foto
    if avatar_path and pdf.get_y() < y_start + 30:
        pdf.set_y(y_start + 30)

    pdf.ln(5)

    # --- Cursos e Avaliacoes ---
    pdf.section_title("Cursos e Avaliacoes")

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id)
        .all()
    )

    if not enrollments:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 8, "Sem cursos registados.", new_x="LMARGIN", new_y="NEXT")
        return pdf.output()

    for enrollment in enrollments:
        course = enrollment.course

        # Cabecalho do curso
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_fill_color(245, 245, 245)
        pdf.cell(0, 7, f"  {course.name}", new_x="LMARGIN", new_y="NEXT", fill=True)

        pdf.set_font("Helvetica", "", 9)
        estado = _translate_status(enrollment.status)
        nota_final = str(enrollment.final_grade) if enrollment.final_grade is not None else "-"
        pdf.cell(0, 6, f"  Estado: {estado}  |  Nota Final: {nota_final}  |  Area: {course.area or '-'}", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(0, 6, f"  Periodo: {_format_date(course.start_date)} a {_format_date(course.end_date)}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        # Tabela de notas por modulo
        grades = enrollment.module_grades

        if grades:
            # Cabecalho da tabela
            col_widths = [70, 20, 30, 70]
            headers = ["Modulo", "Nota", "Data Aval.", "Observacoes"]

            pdf.set_font("Helvetica", "B", 9)
            pdf.set_fill_color(0, 51, 102)
            pdf.set_text_color(255, 255, 255)
            for i, header in enumerate(headers):
                pdf.cell(col_widths[i], 6, f" {header}", border=1, fill=True)
            pdf.ln()

            # Linhas de dados
            pdf.set_text_color(0, 0, 0)
            pdf.set_font("Helvetica", "", 9)
            fill = False
            for grade in grades:
                module_name = _truncate(grade.course_module.module.name, 35)
                nota = str(grade.grade) if grade.grade is not None else "-"
                data = _format_date(grade.evaluated_at)
                obs = _truncate(grade.comments, 35)

                if fill:
                    pdf.set_fill_color(248, 248, 248)
                else:
                    pdf.set_fill_color(255, 255, 255)

                pdf.cell(col_widths[0], 6, f" {module_name}", border=1, fill=True)
                pdf.cell(col_widths[1], 6, nota, border=1, align="C", fill=True)
                pdf.cell(col_widths[2], 6, data, border=1, align="C", fill=True)
                pdf.cell(col_widths[3], 6, f" {obs}", border=1, fill=True)
                pdf.ln()
                fill = not fill
        else:
            pdf.set_font("Helvetica", "I", 9)
            pdf.cell(0, 6, "  Sem avaliacoes registadas para este curso.", new_x="LMARGIN", new_y="NEXT")

        pdf.ln(4)

    return pdf.output()


def generate_professor_pdf(db: Session, user: User) -> bytes:
    """
    Gera a Ficha do Professor em PDF.
    Inclui foto, dados pessoais e lista de cursos/modulos lecionados.
    """
    pdf = ATECReport("Ficha do Professor")
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # --- Dados Pessoais ---
    avatar_path = _get_avatar_path(user)
    y_start = pdf.get_y()

    if avatar_path:
        try:
            pdf.image(avatar_path, x=10, y=y_start, w=28, h=28)
            pdf.set_xy(42, y_start)
        except Exception:
            pdf.set_xy(10, y_start)
    else:
        pdf.set_xy(10, y_start)

    x_info = pdf.get_x()
    pdf.info_line("Nome", user.full_name or "-")
    pdf.set_x(x_info)
    pdf.info_line("Email", user.email)
    pdf.set_x(x_info)
    pdf.info_line("Telefone", user.phone_number or "-")

    # Garantir que passamos abaixo da foto
    if avatar_path and pdf.get_y() < y_start + 30:
        pdf.set_y(y_start + 30)

    pdf.ln(5)

    # --- Cursos e Modulos Lecionados ---
    pdf.section_title("Cursos e Modulos Lecionados")

    course_modules = (
        db.query(CourseModule)
        .filter(CourseModule.trainer_id == user.id)
        .order_by(CourseModule.course_id, CourseModule.order)
        .all()
    )

    if not course_modules:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 8, "Sem modulos lecionados.", new_x="LMARGIN", new_y="NEXT")
        return pdf.output()

    # Tabela
    col_widths = [65, 55, 25, 45]
    headers = ["Curso", "Modulo", "Horas", "Estado do Curso"]

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(0, 51, 102)
    pdf.set_text_color(255, 255, 255)
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 6, f" {header}", border=1, fill=True)
    pdf.ln()

    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 9)

    total_hours = 0
    fill = False
    for cm in course_modules:
        course_name = _truncate(cm.course.name, 32)
        module_name = _truncate(cm.module.name, 28)
        hours = str(cm.total_hours or 0)
        status = _translate_status(cm.course.status)

        if fill:
            pdf.set_fill_color(248, 248, 248)
        else:
            pdf.set_fill_color(255, 255, 255)

        pdf.cell(col_widths[0], 6, f" {course_name}", border=1, fill=True)
        pdf.cell(col_widths[1], 6, f" {module_name}", border=1, fill=True)
        pdf.cell(col_widths[2], 6, hours, border=1, align="C", fill=True)
        pdf.cell(col_widths[3], 6, f" {status}", border=1, fill=True)
        pdf.ln()
        fill = not fill
        total_hours += cm.total_hours or 0

    # Linha de total
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(230, 240, 250)
    pdf.cell(col_widths[0] + col_widths[1], 6, " Total", border=1, fill=True)
    pdf.cell(col_widths[2], 6, str(total_hours), border=1, align="C", fill=True)
    pdf.cell(col_widths[3], 6, f" {len(course_modules)} modulo(s)", border=1, fill=True)
    pdf.ln()

    return pdf.output()
