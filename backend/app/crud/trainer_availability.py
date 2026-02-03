"""
CRUD para Disponibilidade de Professor (TrainerAvailability)
------------------------------------------------------------
Operações de base de dados para a entidade TrainerAvailability.
"""

from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.trainer_availability import TrainerAvailability
from app.schemas.trainer_availability import TrainerAvailabilityCreate, TrainerAvailabilityUpdate


class CRUDTrainerAvailability(CRUDBase[TrainerAvailability, TrainerAvailabilityCreate, TrainerAvailabilityUpdate]):
    """
    CRUD para TrainerAvailability.
    Herda operações básicas e adiciona métodos específicos.
    """

    def get_by_trainer(
        self, db: Session, *, trainer_id: int, skip: int = 0, limit: int = 100
    ) -> List[TrainerAvailability]:
        """
        Lista disponibilidades de um professor específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.trainer_id == trainer_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_multi_filtered(
        self,
        db: Session,
        *,
        trainer_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[TrainerAvailability]:
        """
        Lista disponibilidades com filtro opcional por professor.
        """
        query = db.query(self.model)
        if trainer_id:
            query = query.filter(self.model.trainer_id == trainer_id)
        return query.offset(skip).limit(limit).all()

    def create_for_trainer(
        self, db: Session, *, trainer_id: int, obj_in: TrainerAvailabilityCreate
    ) -> TrainerAvailability:
        """
        Cria uma disponibilidade para um professor específico.
        """
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, trainer_id=trainer_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_day_of_week(
        self, db: Session, *, trainer_id: int, day_of_week: int
    ) -> List[TrainerAvailability]:
        """
        Lista disponibilidades recorrentes de um professor para um dia da semana.
        """
        return (
            db.query(self.model)
            .filter(
                self.model.trainer_id == trainer_id,
                self.model.day_of_week == day_of_week,
                self.model.is_recurring == True,
            )
            .all()
        )

    def get_by_specific_date(
        self, db: Session, *, trainer_id: int, specific_date: date
    ) -> List[TrainerAvailability]:
        """
        Lista disponibilidades de um professor para uma data específica.
        """
        return (
            db.query(self.model)
            .filter(
                self.model.trainer_id == trainer_id,
                self.model.specific_date == specific_date,
            )
            .all()
        )


# Instância singleton para uso nos routers
trainer_availability = CRUDTrainerAvailability(TrainerAvailability)
