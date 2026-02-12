"""
Router de Exportacao PDF
-------------------------
Endpoints para exportar fichas de professores e estudantes em PDF.
Apenas Admin e Secretaria.
"""

from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.crud import user as user_crud
from app.services.pdf_generator import generate_student_pdf, generate_professor_pdf

router = APIRouter()


@router.get("/student/{user_id}/pdf")
def export_student_pdf(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Exporta a Ficha do Formando em PDF.
    Apenas Admin e Secretaria.
    """
    user = user_crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador nao encontrado")
    if user.role != "estudante":
        raise HTTPException(status_code=400, detail="Utilizador nao e estudante")

    pdf_content = generate_student_pdf(db, user)

    name = user.full_name or str(user.id)
    filename = f"ficha_formando_{name}.pdf"
    encoded_filename = quote(filename)

    return Response(
        content=bytes(pdf_content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        },
    )


@router.get("/professor/{user_id}/pdf")
def export_professor_pdf(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_or_secretaria),
):
    """
    Exporta a Ficha do Professor em PDF.
    Apenas Admin e Secretaria.
    """
    user = user_crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador nao encontrado")
    if user.role != "professor":
        raise HTTPException(status_code=400, detail="Utilizador nao e professor")

    pdf_content = generate_professor_pdf(db, user)

    name = user.full_name or str(user.id)
    filename = f"ficha_professor_{name}.pdf"
    encoded_filename = quote(filename)

    return Response(
        content=bytes(pdf_content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        },
    )
