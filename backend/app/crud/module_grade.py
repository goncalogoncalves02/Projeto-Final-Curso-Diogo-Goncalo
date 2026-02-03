"""
CRUD para Nota de Módulo (ModuleGrade)
--------------------------------------
Operações de base de dados para a entidade ModuleGrade.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.module_grade import ModuleGrade
from app.schemas.module_grade import ModuleGradeCreate, ModuleGradeUpdate


class CRUDModuleGrade(CRUDBase[ModuleGrade, ModuleGradeCreate, ModuleGradeUpdate]):
    """
    CRUD para ModuleGrade.
    Herda operações básicas e adiciona métodos específicos.
    """

    def get_by_enrollment(
        self, db: Session, *, enrollment_id: int
    ) -> List[ModuleGrade]:
        """
        Lista notas de uma inscrição específica.
        """
        return (
            db.query(self.model)
            .filter(self.model.enrollment_id == enrollment_id)
            .all()
        )

    def get_by_course_module(
        self, db: Session, *, course_module_id: int
    ) -> List[ModuleGrade]:
        """
        Lista notas de um módulo específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.course_module_id == course_module_id)
            .all()
        )

    def get_by_enrollment_and_module(
        self, db: Session, *, enrollment_id: int, course_module_id: int
    ) -> Optional[ModuleGrade]:
        """
        Verifica se existe nota para um aluno num módulo específico.
        """
        return (
            db.query(self.model)
            .filter(
                self.model.enrollment_id == enrollment_id,
                self.model.course_module_id == course_module_id,
            )
            .first()
        )

    def get_multi_filtered(
        self,
        db: Session,
        *,
        enrollment_id: Optional[int] = None,
        course_module_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModuleGrade]:
        """
        Lista notas com filtros opcionais.
        """
        query = db.query(self.model)
        if enrollment_id:
            query = query.filter(self.model.enrollment_id == enrollment_id)
        if course_module_id:
            query = query.filter(self.model.course_module_id == course_module_id)
        return query.offset(skip).limit(limit).all()

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[ModuleGrade]:
        """
        Lista notas de um utilizador (via join com Enrollment).
        """
        from app.models.enrollment import Enrollment

        return (
            db.query(self.model)
            .join(Enrollment)
            .filter(Enrollment.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )


# Instância singleton para uso nos routers
module_grade = CRUDModuleGrade(ModuleGrade)
