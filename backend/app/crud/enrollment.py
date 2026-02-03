"""
CRUD para Inscrição (Enrollment)
--------------------------------
Operações de base de dados para a entidade Enrollment.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate


class CRUDEnrollment(CRUDBase[Enrollment, EnrollmentCreate, EnrollmentUpdate]):
    """
    CRUD para Enrollment.
    Herda operações básicas e adiciona métodos específicos.
    """

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Enrollment]:
        """
        Lista inscrições de um utilizador específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_course(
        self, db: Session, *, course_id: int, skip: int = 0, limit: int = 100
    ) -> List[Enrollment]:
        """
        Lista inscrições de um curso específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.course_id == course_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user_and_course(
        self, db: Session, *, user_id: int, course_id: int
    ) -> Optional[Enrollment]:
        """
        Verifica se existe inscrição de um utilizador num curso.
        """
        return (
            db.query(self.model)
            .filter(
                self.model.user_id == user_id,
                self.model.course_id == course_id,
            )
            .first()
        )

    def get_multi_filtered(
        self,
        db: Session,
        *,
        course_id: Optional[int] = None,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Enrollment]:
        """
        Lista inscrições com filtros opcionais.
        """
        query = db.query(self.model)
        if course_id:
            query = query.filter(self.model.course_id == course_id)
        if user_id:
            query = query.filter(self.model.user_id == user_id)
        return query.offset(skip).limit(limit).all()


# Instância singleton para uso nos routers
enrollment = CRUDEnrollment(Enrollment)
