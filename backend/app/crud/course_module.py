"""
CRUD para Módulo do Curso (CourseModule)
----------------------------------------
Operações de base de dados para a entidade CourseModule.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.course_module import CourseModule
from app.schemas.course_module import CourseModuleCreate, CourseModuleUpdate


class CRUDCourseModule(CRUDBase[CourseModule, CourseModuleCreate, CourseModuleUpdate]):
    """
    CRUD para CourseModule.
    Herda operações básicas e adiciona métodos específicos.
    """

    def get_by_course(
        self, db: Session, *, course_id: int
    ) -> List[CourseModule]:
        """
        Lista módulos de um curso específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.course_id == course_id)
            .order_by(self.model.order)
            .all()
        )

    def get_by_course_and_id(
        self, db: Session, *, course_id: int, id: int
    ) -> Optional[CourseModule]:
        """
        Obtém um módulo específico de um curso.
        """
        return (
            db.query(self.model)
            .filter(
                self.model.id == id,
                self.model.course_id == course_id,
            )
            .first()
        )

    def create_for_course(
        self, db: Session, *, course_id: int, obj_in: CourseModuleCreate
    ) -> CourseModule:
        """
        Cria um módulo associado a um curso específico.
        """
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, course_id=course_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instância singleton para uso nos routers
course_module = CRUDCourseModule(CourseModule)
