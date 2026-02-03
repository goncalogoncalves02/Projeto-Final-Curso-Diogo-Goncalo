"""
CRUD para Aula (Lesson)
-----------------------
Operações de base de dados para a entidade Lesson.
"""

from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.lesson import Lesson
from app.schemas.lesson import LessonCreate, LessonUpdate


class CRUDLesson(CRUDBase[Lesson, LessonCreate, LessonUpdate]):
    """
    CRUD para Lesson.
    Herda operações básicas e adiciona métodos específicos.
    """

    def get_by_date_range(
        self,
        db: Session,
        *,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Lesson]:
        """
        Lista aulas num intervalo de datas.
        """
        query = db.query(self.model)
        if start_date:
            query = query.filter(self.model.date >= start_date)
        if end_date:
            query = query.filter(self.model.date <= end_date)
        return (
            query.order_by(self.model.date, self.model.start_time)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_course_module(
        self, db: Session, *, course_module_id: int
    ) -> List[Lesson]:
        """
        Lista aulas de um módulo específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.course_module_id == course_module_id)
            .order_by(self.model.date, self.model.start_time)
            .all()
        )

    def get_by_course_module_ids(
        self,
        db: Session,
        *,
        course_module_ids: List[int],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Lesson]:
        """
        Lista aulas de múltiplos módulos (útil para horário de curso ou professor).
        """
        query = db.query(self.model).filter(
            self.model.course_module_id.in_(course_module_ids)
        )
        if start_date:
            query = query.filter(self.model.date >= start_date)
        if end_date:
            query = query.filter(self.model.date <= end_date)
        return query.order_by(self.model.date, self.model.start_time).all()

    def get_by_date(self, db: Session, *, lesson_date: date) -> List[Lesson]:
        """
        Lista aulas de um dia específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.date == lesson_date)
            .order_by(self.model.start_time)
            .all()
        )

    def get_by_classroom(
        self,
        db: Session,
        *,
        classroom_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Lesson]:
        """
        Lista aulas de uma sala específica.
        """
        query = db.query(self.model).filter(self.model.classroom_id == classroom_id)
        if start_date:
            query = query.filter(self.model.date >= start_date)
        if end_date:
            query = query.filter(self.model.date <= end_date)
        return query.order_by(self.model.date, self.model.start_time).all()

    def create_simple(
        self,
        db: Session,
        *,
        course_module_id: int,
        classroom_id: Optional[int],
        lesson_date: date,
        start_time,
        end_time,
        notes: Optional[str] = None
    ) -> Lesson:
        """
        Cria uma aula com parâmetros directos (sem schema).
        Útil para criação em batch com recorrência.
        """
        db_obj = self.model(
            course_module_id=course_module_id,
            classroom_id=classroom_id,
            date=lesson_date,
            start_time=start_time,
            end_time=end_time,
            notes=notes,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instância singleton para uso nos routers
lesson = CRUDLesson(Lesson)
