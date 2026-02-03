"""
CRUD para Curso (Course)
------------------------
Operações de base de dados para a entidade Course.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.course import Course, CourseStatus
from app.schemas.course import CourseCreate, CourseUpdate


class CRUDCourse(CRUDBase[Course, CourseCreate, CourseUpdate]):
    """
    CRUD para Course.
    Herda operações básicas e adiciona métodos específicos.
    """

    def get_by_status(
        self, db: Session, *, status: CourseStatus, skip: int = 0, limit: int = 100
    ) -> List[Course]:
        """
        Lista cursos por status.
        """
        return (
            db.query(self.model)
            .filter(self.model.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Course]:
        """
        Lista cursos activos.
        """
        return self.get_by_status(db, status=CourseStatus.active, skip=skip, limit=limit)


# Instância singleton para uso nos routers
course = CRUDCourse(Course)
